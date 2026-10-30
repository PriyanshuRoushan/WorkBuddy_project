import ChatRoom from '../models/ChatRoom.js';
import ChannelState from '../models/ChannelState.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import { tenantFilter } from '../utils/tenant.js';
import { hasGlobalAccess } from '../config/accessControl.js';

const DEFAULT_CHANNELS = [
  { name: 'General', slug: 'general', type: 'GENERAL', description: 'Project-wide discussion and everyday updates.' },
  { name: 'Announcements', slug: 'announcements', type: 'ANNOUNCEMENTS', description: 'Important project updates and decisions.' }
];

const slugify = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const getProjectAccess = async (req, projectId) => {
  const project = await Project.findOne(tenantFilter(req, { _id: projectId }));
  if (!project) return { project: null, membership: null, allowed: false };
  const membership = await ProjectMember.findOne({
    organizationId: req.user.organizationId,
    projectId,
    userId: req.user._id
  });
  return { project, membership, allowed: hasGlobalAccess(req.user) || Boolean(membership) };
};

export const ensureDefaultChannels = async (organizationId, project, creatorId) => {
  let general = await ChatRoom.findOne({ organizationId, projectId: project._id, slug: 'general' });
  if (!general) {
    general = await ChatRoom.findOne({ organizationId, projectId: project._id, slug: { $exists: false } });
    if (general) {
      Object.assign(general, { ...DEFAULT_CHANNELS[0], createdBy: general.createdBy || project.creatorId || project.creator || creatorId });
      await general.save();
    }
  }

  for (const channel of DEFAULT_CHANNELS) {
    await ChatRoom.updateOne(
      { organizationId, projectId: project._id, slug: channel.slug },
      {
        $setOnInsert: {
          ...channel,
          organizationId,
          projectId: project._id,
          createdBy: project.creatorId || project.creator || creatorId,
          participants: []
        }
      },
      { upsert: true }
    );
  }
  return ChatRoom.find({ organizationId, projectId: project._id })
    .populate('createdBy', 'name displayName profileImage jobTitle')
    .sort({ type: 1, createdAt: 1 });
};

const canManageChannel = (req, project, channel) => (
  hasGlobalAccess(req.user)
  || String(project.creatorId || project.creator) === String(req.user._id)
  || String(channel.createdBy?._id || channel.createdBy) === String(req.user._id)
);

export const getChannels = async (req, res) => {
  try {
    const { project, membership, allowed } = await getProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied: You are not a project member' });

    const channels = await ensureDefaultChannels(req.user.organizationId, project, req.user._id);
    const states = await ChannelState.find({
      organizationId: req.user.organizationId,
      projectId: project._id,
      userId: req.user._id
    }).lean();
    const stateByChannel = new Map(states.map(state => [String(state.channelId), state]));
    const unreadStart = membership?.startDate || new Date(0);

    const response = await Promise.all(channels.map(async channel => {
      const state = stateByChannel.get(String(channel._id));
      const after = state?.lastReadAt && state.lastReadAt > unreadStart ? state.lastReadAt : unreadStart;
      const unreadCount = await Message.countDocuments({
        organizationId: req.user.organizationId,
        roomId: channel._id,
        sender: { $ne: req.user._id },
        createdAt: { $gt: after },
        deletedAt: null
      });
      return {
        ...channel.toObject(),
        unreadCount,
        notificationPreference: state?.notificationPreference || 'ALL',
        canManage: channel.type === 'CUSTOM' && canManageChannel(req, project, channel)
      };
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createChannel = async (req, res) => {
  try {
    const { project, allowed } = await getProjectAccess(req, req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const name = String(req.body.name || '').trim();
    const slug = slugify(name);
    if (!name || !slug) return res.status(400).json({ message: 'Channel name is required' });
    const channel = await ChatRoom.create({
      organizationId: req.user.organizationId,
      projectId: project._id,
      name,
      slug,
      description: String(req.body.description || '').trim(),
      type: 'CUSTOM',
      createdBy: req.user._id
    });
    res.status(201).json(channel);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      message: error.code === 11000 ? 'A channel with this name already exists' : error.message
    });
  }
};

export const updateChannel = async (req, res) => {
  try {
    const channel = await ChatRoom.findOne(tenantFilter(req, { _id: req.params.channelId }));
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    const { project, allowed } = await getProjectAccess(req, channel.projectId);
    if (!allowed || !canManageChannel(req, project, channel)) return res.status(403).json({ message: 'Channel management permission required' });
    if (channel.type !== 'CUSTOM' && req.body.name !== undefined) return res.status(400).json({ message: 'Default channels cannot be renamed' });

    if (req.body.name !== undefined) {
      channel.name = String(req.body.name).trim();
      channel.slug = slugify(channel.name);
    }
    if (req.body.description !== undefined) channel.description = String(req.body.description).trim();
    if (req.body.isArchived !== undefined) channel.isArchived = Boolean(req.body.isArchived);
    await channel.save();
    res.json(channel);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? 'Channel name already exists' : error.message });
  }
};

export const deleteChannel = async (req, res) => {
  try {
    const channel = await ChatRoom.findOne(tenantFilter(req, { _id: req.params.channelId }));
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    const { project, allowed } = await getProjectAccess(req, channel.projectId);
    if (!allowed || !canManageChannel(req, project, channel)) return res.status(403).json({ message: 'Channel management permission required' });
    if (channel.type !== 'CUSTOM') return res.status(400).json({ message: 'Default channels cannot be deleted' });
    await Promise.all([
      Message.deleteMany({ organizationId: req.user.organizationId, roomId: channel._id }),
      ChannelState.deleteMany({ organizationId: req.user.organizationId, channelId: channel._id }),
      channel.deleteOne()
    ]);
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const channel = await ChatRoom.findOne(tenantFilter(req, { _id: req.params.channelId, projectId: req.params.projectId }));
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    const { membership, allowed } = await getProjectAccess(req, channel.projectId);
    if (!allowed) return res.status(403).json({ message: 'Access denied: You are not a project member' });

    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 100);
    const query = tenantFilter(req, { roomId: channel._id });
    if (req.query.before) query.createdAt = { $lt: new Date(req.query.before) };
    if (req.query.search) query.content = { $regex: String(req.query.search).slice(0, 100), $options: 'i' };

    const messages = await Message.find(query)
      .populate('sender', 'name displayName profileImage accessRole jobTitle')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name displayName profileImage' } })
      .populate({ path: 'taskId', populate: { path: 'assignedTo', select: 'name displayName profileImage' } })
      .sort({ createdAt: -1 })
      .limit(limit + 1);
    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const state = await ChannelState.findOne({
      organizationId: req.user.organizationId,
      channelId: channel._id,
      userId: req.user._id
    }).lean();
    const bookmarked = new Set((state?.bookmarkedMessageIds || []).map(String));

    res.json({
      channel,
      messages: messages.reverse().map(message => ({ ...message.toObject(), isBookmarked: bookmarked.has(String(message._id)) })),
      hasMore,
      nextCursor: hasMore ? messages[0]?.createdAt : null,
      unreadSince: membership?.startDate || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateChannelState = async (req, res) => {
  try {
    const channel = await ChatRoom.findOne(tenantFilter(req, { _id: req.params.channelId }));
    if (!channel) return res.status(404).json({ message: 'Channel not found' });
    const { allowed } = await getProjectAccess(req, channel.projectId);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });
    const update = {};
    if (req.body.notificationPreference) update.notificationPreference = req.body.notificationPreference;
    if (req.body.markRead) update.lastReadAt = new Date();
    const state = await ChannelState.findOneAndUpdate(
      { organizationId: req.user.organizationId, projectId: channel.projectId, channelId: channel._id, userId: req.user._id },
      { $set: update, $setOnInsert: { organizationId: req.user.organizationId, projectId: channel.projectId, channelId: channel._id, userId: req.user._id } },
      { upsert: true, new: true }
    );
    res.json(state);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const message = await Message.findOne(tenantFilter(req, { _id: req.params.messageId }));
    if (!message) return res.status(404).json({ message: 'Message not found' });
    const channel = await ChatRoom.findById(message.roomId);
    const { allowed } = await getProjectAccess(req, channel.projectId);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });
    const state = await ChannelState.findOneAndUpdate(
      { organizationId: req.user.organizationId, projectId: channel.projectId, channelId: channel._id, userId: req.user._id },
      { $setOnInsert: { organizationId: req.user.organizationId, projectId: channel.projectId, channelId: channel._id, userId: req.user._id } },
      { upsert: true, new: true }
    );
    const exists = state.bookmarkedMessageIds.some(id => String(id) === String(message._id));
    await ChannelState.updateOne({ _id: state._id }, exists
      ? { $pull: { bookmarkedMessageIds: message._id } }
      : { $addToSet: { bookmarkedMessageIds: message._id } });
    res.json({ bookmarked: !exists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadFile = (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({
      fileUrl: req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
