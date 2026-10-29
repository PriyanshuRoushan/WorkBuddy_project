import Activity from '../models/Activity.js';
import Announcement from '../models/Announcement.js';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import { tenantFilter } from '../utils/tenant.js';
import { hasGlobalAccess } from '../config/accessControl.js';

const visibleAnnouncementQuery = async user => {
  if (hasGlobalAccess(user)) return {};
  const projectIds = await ProjectMember.find({
    organizationId: user.organizationId,
    userId: user._id
  }).distinct('projectId');
  return { $or: [
    { audienceType: 'COMPANY' },
    { audienceType: 'DEPARTMENT', audienceValue: user.department },
    { audienceType: 'TEAM', audienceValue: user.team },
    { audienceType: 'PROJECT', projectId: { $in: projectIds } },
    { audienceType: 'USERS', userIds: user._id }
  ] };
};

export const getActivities = async (req, res) => {
  try {
    let query = tenantFilter(req, { action: { $ne: 'invited employee' } });
    if (req.user && !hasGlobalAccess(req.user)) {
      const firstName = req.user.name.split(' ')[0];
      const memberProjectIds = await ProjectMember.find({
        organizationId: req.user.organizationId,
        userId: req.user._id
      }).distinct('projectId');
      query = tenantFilter(req, {
        action: { $ne: 'invited employee' },
        $or: [
          { user: firstName },
          { user: 'System' },
          { projectId: { $in: memberProjectIds } }
        ]
      });
    }
    const announcementVisibility = await visibleAnnouncementQuery(req.user);
    const accessibleProjectIds = hasGlobalAccess(req.user)
      ? await ChatRoom.find({ organizationId: req.user.organizationId }).distinct('projectId')
      : await ProjectMember.find({ organizationId: req.user.organizationId, userId: req.user._id }).distinct('projectId');
    const accessibleRooms = await ChatRoom.find({
      organizationId: req.user.organizationId,
      projectId: { $in: accessibleProjectIds }
    }).select('_id projectId').lean();
    const projectIdByRoom = new Map(accessibleRooms.map(room => [String(room._id), room.projectId]));

    const [activities, announcements, chatMessages] = await Promise.all([
      Activity.find(query).sort({ createdAt: -1 }).limit(15).lean(),
      Announcement.find({
        organizationId: req.user.organizationId,
        $and: [
          announcementVisibility,
          { $or: [{ audienceType: 'PROJECT' }, { priority: 'URGENT' }] },
          { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }
        ]
      })
        .populate('authorId', 'name')
        .populate('projectId', 'title')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
      Message.find({
        organizationId: req.user.organizationId,
        roomId: { $in: accessibleRooms.map(room => room._id) },
        sender: { $ne: req.user._id }
      })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean()
    ]);

    const messageActivities = announcements.map(item => ({
      _id: `announcement-${item._id}`,
      user: item.authorId?.name || 'System',
      action: item.priority === 'URGENT' ? 'posted a new urgent message' : 'posted a new project message in',
      target: item.projectId?.title || item.title,
      details: item.message,
      type: 'comment',
      priority: item.priority,
      link: item.projectId ? `/projects/${item.projectId._id}/workspace` : '/announcements',
      createdAt: item.createdAt
    }));

    const projectTitles = new Map(announcements
      .filter(item => item.projectId)
      .map(item => [String(item.projectId._id), item.projectId.title]));
    const projectIdsMissingTitles = accessibleProjectIds.filter(id => !projectTitles.has(String(id)));
    if (projectIdsMissingTitles.length) {
      const projects = await Project.find({
        organizationId: req.user.organizationId,
        _id: { $in: projectIdsMissingTitles }
      }).select('title').lean();
      projects.forEach(project => projectTitles.set(String(project._id), project.title));
    }

    const chatActivities = chatMessages.map(message => {
      const projectId = projectIdByRoom.get(String(message.roomId));
      return {
        _id: `chat-${message._id}`,
        notificationText: `A message in ${projectTitles.get(String(projectId)) || 'Project chat'} from ${message.senderName}`,
        type: 'comment',
        link: `/projects/${projectId}/workspace`,
        createdAt: message.createdAt
      };
    });

    res.json([...activities, ...messageActivities, ...chatActivities]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createActivity = async (req, res) => {
  const { user, action, target, details, type } = req.body;
  try {
    const activity = new Activity({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      user,
      action,
      target,
      details,
      type
    });
    const savedActivity = await activity.save();
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
