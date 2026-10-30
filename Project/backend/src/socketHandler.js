import jwt from 'jsonwebtoken';
import ChannelState from './models/ChannelState.js';
import ProjectMember from './models/ProjectMember.js';
import Message from './models/Message.js';
import ChatRoom from './models/ChatRoom.js';
import Project from './models/Project.js';
import User from './models/User.js';
import { getOrCreateDefaultOrganization } from './utils/tenant.js';
import { hasGlobalAccess } from './config/accessControl.js';
import Company from './control/Company.js';
import { getTenantModels, runWithTenant } from './tenancy/tenantContext.js';
import { modelDefinitions } from './tenancy/modelRegistry.js';

const jwtSecret = () => process.env.JWT_SECRET || 'doodlesaas_super_secret_key';
const sessionFromCookies = header => header
  ?.split(';')
  .map(cookie => cookie.trim())
  .find(cookie => cookie.startsWith('workbuddy_session='))
  ?.slice('workbuddy_session='.length);
const channelRoom = channelId => 'channel:' + channelId;

export default io => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || decodeURIComponent(sessionFromCookies(socket.handshake.headers.cookie) || '');
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, jwtSecret());
      const company = decoded.companyId ? await Company.findOne({ _id: decoded.companyId, status: 'ACTIVE' }) : null;
      const tenant = company ? getTenantModels(company.databaseName, modelDefinitions) : null;
      await runWithTenant(tenant ? { ...tenant, company } : {}, async () => {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return next(new Error('User not found'));
        if (user.accountStatus !== 'ACTIVE') return next(new Error('Account is not active'));
        if (!user.organizationId) {
          const organization = await getOrCreateDefaultOrganization();
          user.organizationId = organization._id;
          await user.save();
        }
        socket.user = user;
        socket.tenantContext = tenant ? { ...tenant, company } : {};
        socket.use((event, eventNext) => runWithTenant(socket.tenantContext, eventNext));
        next();
      });
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', socket => {
    const projectAccess = async projectId => {
      const project = await Project.findOne({ _id: projectId, organizationId: socket.user.organizationId });
      if (!project) return { allowed: false };
      const membership = await ProjectMember.findOne({
        organizationId: socket.user.organizationId,
        projectId,
        userId: socket.user._id
      });
      return { project, membership, allowed: hasGlobalAccess(socket.user) || Boolean(membership) };
    };

    const currentChannel = channelId => (
      socket.channelId && String(socket.channelId) === String(channelId)
    );

    socket.on('join-channel', async ({ projectId, channelId }, acknowledge = () => {}) => {
      try {
        const { allowed } = await projectAccess(projectId);
        const channel = allowed && await ChatRoom.findOne({
          _id: channelId,
          projectId,
          organizationId: socket.user.organizationId
        });
        if (!channel) return acknowledge({ ok: false, message: 'Channel access denied' });

        if (socket.channelId) socket.leave(channelRoom(socket.channelId));
        socket.join(channelRoom(channel._id));
        socket.projectId = projectId;
        socket.channelId = channel._id;
        socket.to(channelRoom(channel._id)).emit('user-status', {
          userId: socket.user._id,
          status: 'online'
        });
        acknowledge({ ok: true, archived: channel.isArchived });
      } catch {
        acknowledge({ ok: false, message: 'Could not join this channel' });
      }
    });

    socket.on('leave-channel', ({ channelId }) => {
      if (!currentChannel(channelId)) return;
      socket.leave(channelRoom(channelId));
      socket.to(channelRoom(channelId)).emit('user-status', { userId: socket.user._id, status: 'offline' });
      socket.channelId = null;
    });

    socket.on('send-message', async (data, acknowledge = () => {}) => {
      const { projectId, channelId, content, fileUrl, fileName, fileType, replyTo } = data;
      if (!currentChannel(channelId)) return acknowledge({ ok: false, message: 'Channel is reconnecting' });
      try {
        const [{ project, membership, allowed }, channel] = await Promise.all([
          projectAccess(projectId),
          ChatRoom.findOne({ _id: channelId, projectId, organizationId: socket.user.organizationId })
        ]);
        if (!allowed || !channel) return acknowledge({ ok: false, message: 'Channel access denied' });
        if (channel.isArchived) return acknowledge({ ok: false, message: 'Archived channels are read-only' });
        const canAnnounce = hasGlobalAccess(socket.user)
          || String(project.creatorId || project.creator) === String(socket.user._id)
          || membership?.role === 'PROJECT_LEAD';
        if (channel.type === 'ANNOUNCEMENTS' && !canAnnounce) {
          return acknowledge({ ok: false, message: 'Only project leads can publish announcements' });
        }
        if (!String(content || '').trim() && !fileUrl) return acknowledge({ ok: false, message: 'Message cannot be empty' });

        const saved = await Message.create({
          organizationId: socket.user.organizationId,
          roomId: channel._id,
          sender: socket.user._id,
          senderId: socket.user._id,
          senderName: socket.user.displayName || socket.user.name,
          senderRole: socket.user.jobTitle || socket.user.accessRole,
          senderAvatar: socket.user.profileImage || '',
          content: String(content || '').trim(),
          fileUrl,
          fileName,
          fileType,
          replyTo: replyTo || null,
          readBy: [socket.user._id]
        });
        const populated = await Message.findById(saved._id)
          .populate('sender', 'name displayName profileImage accessRole jobTitle')
          .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name displayName profileImage' } });
        io.to(channelRoom(channel._id)).emit('receive-message', populated);
        acknowledge({ ok: true, message: populated });
      } catch (error) {
        console.error('Socket send-message error:', error);
        acknowledge({ ok: false, message: 'Your message could not be sent' });
      }
    });

    socket.on('edit-message', async ({ channelId, messageId, content }, acknowledge = () => {}) => {
      if (!currentChannel(channelId)) return acknowledge({ ok: false });
      const message = await Message.findOne({
        _id: messageId,
        roomId: channelId,
        organizationId: socket.user.organizationId,
        sender: socket.user._id,
        deletedAt: null
      });
      if (!message) return acknowledge({ ok: false, message: 'You can only edit your own message' });
      message.content = String(content || '').trim();
      message.editedAt = new Date();
      await message.save();
      io.to(channelRoom(channelId)).emit('message-updated', message);
      acknowledge({ ok: true });
    });

    socket.on('delete-message', async ({ channelId, messageId }, acknowledge = () => {}) => {
      if (!currentChannel(channelId)) return acknowledge({ ok: false });
      const message = await Message.findOne({
        _id: messageId,
        roomId: channelId,
        organizationId: socket.user.organizationId
      });
      if (!message) return acknowledge({ ok: false, message: 'Message not found' });
      const { project } = await projectAccess(socket.projectId);
      const canDelete = String(message.sender) === String(socket.user._id)
        || hasGlobalAccess(socket.user)
        || String(project?.creatorId || project?.creator) === String(socket.user._id);
      if (!canDelete) return acknowledge({ ok: false, message: 'Message deletion permission required' });
      message.content = '';
      message.fileUrl = undefined;
      message.fileName = undefined;
      message.deletedAt = new Date();
      await message.save();
      io.to(channelRoom(channelId)).emit('message-deleted', { messageId, deletedAt: message.deletedAt });
      acknowledge({ ok: true });
    });

    socket.on('message-flags', async ({ channelId, messageId, isPinned, isDecision }, acknowledge = () => {}) => {
      if (!currentChannel(channelId)) return acknowledge({ ok: false });
      const { project, membership } = await projectAccess(socket.projectId);
      const canModerate = hasGlobalAccess(socket.user)
        || String(project?.creatorId || project?.creator) === String(socket.user._id)
        || membership?.role === 'PROJECT_LEAD';
      if (!canModerate) return acknowledge({ ok: false, message: 'Project lead permission required' });
      const update = {};
      if (isPinned !== undefined) update.isPinned = Boolean(isPinned);
      if (isDecision !== undefined) update.isDecision = Boolean(isDecision);
      const message = await Message.findOneAndUpdate(
        { _id: messageId, roomId: channelId, organizationId: socket.user.organizationId },
        update,
        { new: true }
      );
      if (!message) return acknowledge({ ok: false, message: 'Message not found' });
      io.to(channelRoom(channelId)).emit('message-updated', message);
      acknowledge({ ok: true });
    });

    socket.on('message-reaction', async ({ channelId, messageId, emoji }) => {
      if (!currentChannel(channelId)) return;
      const message = await Message.findOne({ _id: messageId, roomId: channelId, organizationId: socket.user.organizationId });
      if (!message) return;
      const index = message.reactions.findIndex(reaction =>
        String(reaction.userId) === String(socket.user._id) && reaction.emoji === emoji
      );
      if (index >= 0) message.reactions.splice(index, 1);
      else message.reactions.push({ user: socket.user.name, userId: socket.user._id, emoji });
      await message.save();
      io.to(channelRoom(channelId)).emit('message-reaction-updated', { messageId, reactions: message.reactions });
    });

    socket.on('task-converted', ({ channelId, messageId, task }) => {
      if (currentChannel(channelId)) {
        io.to(channelRoom(channelId)).emit('message-task-updated', { messageId, task });
      }
    });

    socket.on('message-read', async ({ channelId, messageId }) => {
      if (!currentChannel(channelId)) return;
      await Promise.all([
        Message.updateOne(
          { _id: messageId, roomId: channelId, organizationId: socket.user.organizationId },
          { $addToSet: { readBy: socket.user._id } }
        ),
        ChannelState.updateOne(
          { organizationId: socket.user.organizationId, projectId: socket.projectId, channelId, userId: socket.user._id },
          {
            $set: { lastReadAt: new Date() },
            $setOnInsert: { organizationId: socket.user.organizationId, projectId: socket.projectId, channelId, userId: socket.user._id }
          },
          { upsert: true }
        )
      ]);
      io.to(channelRoom(channelId)).emit('message-read', { messageId, userId: socket.user._id });
    });

    socket.on('typing-start', ({ channelId }) => {
      if (currentChannel(channelId)) socket.to(channelRoom(channelId)).emit('typing-start', {
        userId: socket.user._id,
        userName: socket.user.displayName || socket.user.name
      });
    });
    socket.on('typing-stop', ({ channelId }) => {
      if (currentChannel(channelId)) socket.to(channelRoom(channelId)).emit('typing-stop', {
        userId: socket.user._id,
        userName: socket.user.displayName || socket.user.name
      });
    });

    socket.on('disconnect', () => {
      if (socket.channelId) {
        socket.to(channelRoom(socket.channelId)).emit('user-status', { userId: socket.user._id, status: 'offline' });
      }
    });
  });
};
