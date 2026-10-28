import Announcement from '../models/Announcement.js';
import ProjectMember from '../models/ProjectMember.js';
import { hasGlobalAccess } from '../config/accessControl.js';
import User from '../models/User.js';

const visibilityQuery = async user => {
  if (hasGlobalAccess(user)) return {};
  const projectIds = await ProjectMember.find({ organizationId: user.organizationId, userId: user._id }).distinct('projectId');
  return { $or: [
    { audienceType: 'COMPANY' },
    { audienceType: 'DEPARTMENT', audienceValue: user.department },
    { audienceType: 'TEAM', audienceValue: user.team },
    { audienceType: 'PROJECT', projectId: { $in: projectIds } },
    { audienceType: 'USERS', userIds: user._id }
  ] };
};

export const listAnnouncements = async (req, res) => {
  try {
    const visible = await visibilityQuery(req.user);
    const announcements = await Announcement.find({
      organizationId: req.user.organizationId,
      $and: [visible, { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }]
    }).populate('authorId', 'name accessRole jobTitle').sort({ pinned: -1, createdAt: -1 });
    res.json(announcements.map(item => ({ ...item.toObject(), isRead: item.readBy.some(id => String(id) === String(req.user._id)) })));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const createAnnouncement = async (req, res) => {
  const { title, message, priority = 'NORMAL', audienceType, audienceValue = '', projectId = null, userIds = [], pinned = false, expiresAt = null } = req.body;
  const allowedAudience = req.user.accessRole === 'MANAGER'
    ? ['DEPARTMENT', 'TEAM', 'PROJECT', 'USERS']
    : req.user.accessRole === 'TEAM_HEAD' ? ['TEAM', 'PROJECT', 'USERS'] : ['COMPANY', 'DEPARTMENT', 'TEAM', 'PROJECT', 'USERS'];
  if (!allowedAudience.includes(audienceType)) return res.status(403).json({ message: 'You cannot publish to this audience' });
  try {
    if (!hasGlobalAccess(req.user)) {
      if (audienceType === 'DEPARTMENT' && audienceValue !== req.user.department) return res.status(403).json({ message: 'You can publish only to your department' });
      if (audienceType === 'TEAM' && audienceValue !== req.user.team) return res.status(403).json({ message: 'You can publish only to your team' });
      if (audienceType === 'PROJECT' && !await ProjectMember.exists({ organizationId: req.user.organizationId, projectId, userId: req.user._id })) return res.status(403).json({ message: 'You are not assigned to that project' });
      if (audienceType === 'USERS') {
        const scope = req.user.accessRole === 'TEAM_HEAD' ? { team: req.user.team } : { department: req.user.department };
        const validCount = await User.countDocuments({ organizationId: req.user.organizationId, _id: { $in: userIds }, ...scope });
        if (validCount !== userIds.length) return res.status(403).json({ message: 'One or more selected employees are outside your scope' });
      }
    }
    const item = await Announcement.create({ organizationId: req.user.organizationId, authorId: req.user._id, title, message, priority, audienceType, audienceValue, projectId, userIds, pinned, expiresAt });
    res.status(201).json(await item.populate('authorId', 'name accessRole jobTitle'));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const markRead = async (req, res) => {
  try {
    const item = await Announcement.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { $addToSet: { readBy: req.user._id } }, { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Marked as read' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
