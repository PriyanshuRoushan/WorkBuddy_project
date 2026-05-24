import ProjectMember from './models/ProjectMember.js';
import Message from './models/Message.js';
import ProjectNote from './models/ProjectNote.js';
import ChatRoom from './models/ChatRoom.js';

export default (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join Project Room
    socket.on('join-project-room', async ({ projectId, userId, userEmail, userName }) => {
      try {
        // Security: Verify project membership
        const isMember = await ProjectMember.findOne({ projectId, userId });
        if (!isMember) {
          socket.emit('error-message', { message: 'Access denied: You are not a member of this project.' });
          return;
        }

        socket.join(projectId);
        socket.projectId = projectId;
        socket.userId = userId;
        socket.userName = userName;

        console.log(`User ${userName} (${userId}) joined project room: ${projectId}`);
        
        // Notify others of online status
        socket.to(projectId).emit('user-status', { userId, status: 'online' });
      } catch (error) {
        console.error('Socket join room error:', error);
      }
    });

    // Leave Project Room
    socket.on('leave-project-room', ({ projectId, userId }) => {
      socket.leave(projectId);
      console.log(`User ${userId} left project room: ${projectId}`);
      socket.to(projectId).emit('user-status', { userId, status: 'offline' });
    });

    // Chat Message
    socket.on('send-message', async (messageData) => {
      const { projectId, roomId, sender, senderName, senderRole, content, fileUrl, fileName, fileType, replyTo } = messageData;
      try {
        const savedMessage = await Message.create({
          roomId,
          sender,
          senderName,
          senderRole,
          content,
          fileUrl,
          fileName,
          fileType,
          replyTo,
          readBy: [sender] // Creator has read it
        });

        // Populate replyTo if set
        let populatedMessage = savedMessage;
        if (replyTo) {
          populatedMessage = await Message.findById(savedMessage._id).populate('replyTo');
        }

        io.to(projectId).emit('receive-message', populatedMessage);
      } catch (error) {
        console.error('Socket send-message error:', error);
      }
    });

    // Typing Indicators
    socket.on('typing-start', ({ projectId, userId, userName }) => {
      socket.to(projectId).emit('typing-start', { userId, userName });
    });

    socket.on('typing-stop', ({ projectId, userId, userName }) => {
      socket.to(projectId).emit('typing-stop', { userId, userName });
    });

    // Read Receipt
    socket.on('message-read', async ({ projectId, messageId, userId }) => {
      try {
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { $addToSet: { readBy: userId } },
          { new: true }
        );
        if (updatedMessage) {
          io.to(projectId).emit('message-read', { messageId, userId });
        }
      } catch (error) {
        console.error('Socket message-read error:', error);
      }
    });

    // Message Reaction
    socket.on('message-reaction', async ({ projectId, messageId, user, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (message) {
          // Toggle or add reaction
          const existingReactionIndex = message.reactions.findIndex(
            r => r.user === user && r.emoji === emoji
          );

          if (existingReactionIndex > -1) {
            message.reactions.splice(existingReactionIndex, 1);
          } else {
            message.reactions.push({ user, emoji });
          }

          await message.save();
          io.to(projectId).emit('message-reaction-updated', {
            messageId,
            reactions: message.reactions
          });
        }
      } catch (error) {
        console.error('Socket message-reaction error:', error);
      }
    });

    // Whiteboard notes - Create Note
    socket.on('create-note', async (noteData) => {
      const { noteId, projectId, createdBy, content, positionX, positionY, color, isPinned } = noteData;
      try {
        const savedNote = await ProjectNote.create({
          noteId,
          projectId,
          createdBy,
          content,
          positionX,
          positionY,
          color,
          isPinned
        });
        socket.to(projectId).emit('receive-create-note', savedNote);
      } catch (error) {
        console.error('Socket create-note error:', error);
      }
    });

    // Whiteboard notes - Move Note
    socket.on('move-note', async ({ projectId, noteId, positionX, positionY }) => {
      try {
        await ProjectNote.findOneAndUpdate({ noteId }, { positionX, positionY });
        socket.to(projectId).emit('receive-move-note', { noteId, positionX, positionY });
      } catch (error) {
        console.error('Socket move-note error:', error);
      }
    });

    // Whiteboard notes - Update Note (Content, color, sizing)
    socket.on('update-note', async ({ projectId, noteId, content, color, width, height }) => {
      try {
        const updateData = {};
        if (content !== undefined) updateData.content = content;
        if (color !== undefined) updateData.color = color;
        if (width !== undefined) updateData.width = width;
        if (height !== undefined) updateData.height = height;

        await ProjectNote.findOneAndUpdate({ noteId }, updateData);
        socket.to(projectId).emit('receive-update-note', { noteId, content, color, width, height });
      } catch (error) {
        console.error('Socket update-note error:', error);
      }
    });

    // Whiteboard notes - Pin Note
    socket.on('pin-note', async ({ projectId, noteId, isPinned }) => {
      try {
        await ProjectNote.findOneAndUpdate({ noteId }, { isPinned });
        socket.to(projectId).emit('receive-pin-note', { noteId, isPinned });
      } catch (error) {
        console.error('Socket pin-note error:', error);
      }
    });

    // Whiteboard notes - Delete Note
    socket.on('delete-note', async ({ projectId, noteId }) => {
      try {
        await ProjectNote.findOneAndDelete({ noteId });
        socket.to(projectId).emit('receive-delete-note', { noteId });
      } catch (error) {
        console.error('Socket delete-note error:', error);
      }
    });

    // Project Tasks sync
    socket.on('create-task', ({ projectId, task }) => {
      socket.to(projectId).emit('receive-create-task', task);
    });

    socket.on('update-task', ({ projectId, task }) => {
      socket.to(projectId).emit('receive-update-task', task);
    });

    socket.on('delete-task', ({ projectId, taskId }) => {
      socket.to(projectId).emit('receive-delete-task', { taskId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.projectId && socket.userId) {
        socket.to(socket.projectId).emit('user-status', { userId: socket.userId, status: 'offline' });
      }
    });
  });
};
