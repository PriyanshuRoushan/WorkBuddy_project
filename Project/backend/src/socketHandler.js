import jwt from 'jsonwebtoken';
import ProjectMember from './models/ProjectMember.js';
import Message from './models/Message.js';
import ProjectNote from './models/ProjectNote.js';
import ChatRoom from './models/ChatRoom.js';
import User from './models/User.js';
import { getOrCreateDefaultOrganization } from './utils/tenant.js';
import { hasGlobalAccess } from './config/accessControl.js';
import Company from './control/Company.js';
import { getTenantModels, runWithTenant } from './tenancy/tenantContext.js';
import { modelDefinitions } from './tenancy/modelRegistry.js';

const jwtSecret = () => process.env.JWT_SECRET || 'doodlesaas_super_secret_key';

export default (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, jwtSecret());
      const company = decoded.companyId ? await Company.findOne({ _id: decoded.companyId, status: 'ACTIVE' }) : null;
      const tenant = company ? getTenantModels(company.databaseName, modelDefinitions) : null;
      await runWithTenant(tenant ? { ...tenant, company } : {}, async () => {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return next(new Error('User not found'));
        if (user.accountStatus !== 'ACTIVE') return next(new Error('Account is not active'));
        if (!user.organizationId) {
          const organization = await getOrCreateDefaultOrganization(); user.organizationId = organization._id; await user.save();
        }
        socket.user = user; socket.tenantContext = tenant ? { ...tenant, company } : {};
        socket.use((event, eventNext) => runWithTenant(socket.tenantContext, eventNext));
        next();
      });
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const isActiveProject = (projectId) => {
      return socket.projectId && socket.projectId.toString() === projectId.toString();
    };

    socket.on('join-project-room', async ({ projectId }, acknowledge = () => {}) => {
      try {
        const isManager = hasGlobalAccess(socket.user);
        const isMember = isManager || await ProjectMember.exists({
          organizationId: socket.user.organizationId,
          projectId,
          userId: socket.user._id
        });

        if (!isMember) {
          const message = 'Access denied: You are not a member of this project.';
          socket.emit('error-message', { message });
          acknowledge({ ok: false, message });
          return;
        }

        socket.join(projectId);
        socket.projectId = projectId;
        socket.to(projectId).emit('user-status', {
          userId: socket.user._id,
          status: 'online'
        });
        acknowledge({ ok: true });
      } catch (error) {
        console.error('Socket join room error:', error);
        acknowledge({ ok: false, message: 'Could not join the project chat.' });
      }
    });

    socket.on('leave-project-room', ({ projectId }) => {
      if (!isActiveProject(projectId)) return;
      socket.leave(projectId);
      socket.to(projectId).emit('user-status', {
        userId: socket.user._id,
        status: 'offline'
      });
      socket.projectId = null;
    });

    socket.on('send-message', async (messageData, acknowledge = () => {}) => {
      const { projectId, content, fileUrl, fileName, fileType, replyTo } = messageData;
      if (!isActiveProject(projectId)) {
        const message = 'Project chat is reconnecting. Please try sending again.';
        socket.emit('error-message', { message });
        acknowledge({ ok: false, message });
        return;
      }

      try {
        const room = await ChatRoom.findOne({
          organizationId: socket.user.organizationId,
          projectId
        });
        if (!room) {
          acknowledge({ ok: false, message: 'Project chat room was not found.' });
          return;
        }

        const savedMessage = await Message.create({
          organizationId: socket.user.organizationId,
          roomId: room._id,
          sender: socket.user._id,
          senderId: socket.user._id,
          senderName: socket.user.name,
          senderRole: socket.user.accessRole,
          content,
          fileUrl,
          fileName,
          fileType,
          replyTo,
          readBy: [socket.user._id]
        });

        const populatedMessage = replyTo
          ? await Message.findById(savedMessage._id).populate('replyTo')
          : savedMessage;
        io.to(projectId).emit('receive-message', populatedMessage);
        acknowledge({ ok: true, messageId: savedMessage._id });
      } catch (error) {
        console.error('Socket send-message error:', error);
        const message = 'Your message could not be sent.';
        socket.emit('error-message', { message });
        acknowledge({ ok: false, message });
      }
    });

    socket.on('typing-start', ({ projectId }) => {
      if (!isActiveProject(projectId)) return;
      socket.to(projectId).emit('typing-start', {
        userId: socket.user._id,
        userName: socket.user.name
      });
    });

    socket.on('typing-stop', ({ projectId }) => {
      if (!isActiveProject(projectId)) return;
      socket.to(projectId).emit('typing-stop', {
        userId: socket.user._id,
        userName: socket.user.name
      });
    });

    socket.on('message-read', async ({ projectId, messageId }) => {
      if (!isActiveProject(projectId)) return;
      try {
        const room = await ChatRoom.findOne({
          organizationId: socket.user.organizationId,
          projectId
        });
        if (!room) return;

        const updatedMessage = await Message.findOneAndUpdate(
          { _id: messageId, organizationId: socket.user.organizationId, roomId: room._id },
          { $addToSet: { readBy: socket.user._id } },
          { new: true }
        );
        if (updatedMessage) {
          io.to(projectId).emit('message-read', {
            messageId,
            userId: socket.user._id
          });
        }
      } catch (error) {
        console.error('Socket message-read error:', error);
      }
    });

    socket.on('message-reaction', async ({ projectId, messageId, emoji }) => {
      if (!isActiveProject(projectId)) return;
      try {
        const message = await Message.findOne({
          _id: messageId,
          organizationId: socket.user.organizationId
        });
        if (!message) return;

        const existingIndex = message.reactions.findIndex(reaction => {
          return reaction.userId?.toString() === socket.user._id.toString() && reaction.emoji === emoji;
        });
        if (existingIndex > -1) {
          message.reactions.splice(existingIndex, 1);
        } else {
          message.reactions.push({
            user: socket.user.name,
            userId: socket.user._id,
            emoji
          });
        }

        await message.save();
        io.to(projectId).emit('message-reaction-updated', {
          messageId,
          reactions: message.reactions
        });
      } catch (error) {
        console.error('Socket message-reaction error:', error);
      }
    });

    socket.on('create-note', async (noteData) => {
      const { noteId, projectId, content, positionX, positionY, width, height, color, isPinned } = noteData;
      if (!isActiveProject(projectId)) return;
      try {
        const savedNote = await ProjectNote.create({
          organizationId: socket.user.organizationId,
          noteId,
          projectId,
          createdBy: socket.user.name,
          createdByUserId: socket.user._id,
          content,
          positionX,
          positionY,
          width,
          height,
          color,
          isPinned
        });
        socket.to(projectId).emit('receive-create-note', savedNote);
      } catch (error) {
        console.error('Socket create-note error:', error);
      }
    });

    const updateNote = async (projectId, noteId, update, eventName) => {
      if (!isActiveProject(projectId)) return;
      const note = await ProjectNote.findOneAndUpdate(
        {
          organizationId: socket.user.organizationId,
          projectId,
          noteId
        },
        update,
        { new: true }
      );
      if (note) socket.to(projectId).emit(eventName, { noteId, ...update });
    };

    socket.on('move-note', ({ projectId, noteId, positionX, positionY }) => {
      updateNote(projectId, noteId, { positionX, positionY }, 'receive-move-note')
        .catch(error => console.error('Socket move-note error:', error));
    });

    socket.on('update-note', ({ projectId, noteId, content, color, width, height }) => {
      const update = {};
      if (content !== undefined) update.content = content;
      if (color !== undefined) update.color = color;
      if (width !== undefined) update.width = width;
      if (height !== undefined) update.height = height;
      updateNote(projectId, noteId, update, 'receive-update-note')
        .catch(error => console.error('Socket update-note error:', error));
    });

    socket.on('pin-note', ({ projectId, noteId, isPinned }) => {
      updateNote(projectId, noteId, { isPinned }, 'receive-pin-note')
        .catch(error => console.error('Socket pin-note error:', error));
    });

    socket.on('delete-note', async ({ projectId, noteId }) => {
      if (!isActiveProject(projectId)) return;
      try {
        const deleted = await ProjectNote.findOneAndDelete({
          organizationId: socket.user.organizationId,
          projectId,
          noteId
        });
        if (deleted) socket.to(projectId).emit('receive-delete-note', { noteId });
      } catch (error) {
        console.error('Socket delete-note error:', error);
      }
    });

    socket.on('create-task', ({ projectId, task }) => {
      if (isActiveProject(projectId)) socket.to(projectId).emit('receive-create-task', task);
    });
    socket.on('update-task', ({ projectId, task }) => {
      if (isActiveProject(projectId)) socket.to(projectId).emit('receive-update-task', task);
    });
    socket.on('delete-task', ({ projectId, taskId }) => {
      if (isActiveProject(projectId)) socket.to(projectId).emit('receive-delete-task', { taskId });
    });

    socket.on('disconnect', () => {
      if (socket.projectId) {
        socket.to(socket.projectId).emit('user-status', {
          userId: socket.user._id,
          status: 'offline'
        });
      }
    });
  });
};
