import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import ProjectNote from '../models/ProjectNote.js';
import ProjectMember from '../models/ProjectMember.js';
import { tenantFilter } from '../utils/tenant.js';

const canAccessProject = async (req, projectId) => {
  if (req.user.role === 'Project Manager' || req.user.role === 'Admin') return true;
  return Boolean(await ProjectMember.exists({
    organizationId: req.user.organizationId,
    projectId,
    userId: req.user._id
  }));
};

export const getMessages = async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await canAccessProject(req, projectId))) {
      return res.status(403).json({ message: 'Access denied: You are not a project member' });
    }

    let room = await ChatRoom.findOne(tenantFilter(req, { projectId }));
    if (!room) {
      room = await ChatRoom.create({
        organizationId: req.user.organizationId,
        projectId,
        name: 'Project Chat',
        participants: [req.user._id]
      });
    }

    const messages = await Message.find(tenantFilter(req, { roomId: room._id }))
      .populate('replyTo')
      .sort({ createdAt: 1 });
    res.json({ room, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNotes = async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await canAccessProject(req, projectId))) {
      return res.status(403).json({ message: 'Access denied: You are not a project member' });
    }
    const notes = await ProjectNote.find(tenantFilter(req, { projectId }));
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
