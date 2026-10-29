import Activity from '../models/Activity.js';
import Announcement from '../models/Announcement.js';
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
    let query = tenantFilter(req);
    if (req.user && !hasGlobalAccess(req.user)) {
      const firstName = req.user.name.split(' ')[0];
      query = tenantFilter(req, {
        $or: [
          { user: firstName },
          { user: 'System' }
        ]
      });
    }
    const announcementVisibility = await visibleAnnouncementQuery(req.user);
    const [activities, announcements] = await Promise.all([
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

    res.json([...activities, ...messageActivities]
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
