import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import ProjectNote from '../models/ProjectNote.js';

export const getMessages = async (req, res) => {
  const { projectId } = req.params;
  try {
    let room = await ChatRoom.findOne({ projectId });
    if (!room) {
      room = await ChatRoom.create({ projectId, name: 'Project Chat' });
    }
    const messages = await Message.find({ roomId: room._id }).sort({ createdAt: 1 });
    res.json({ room, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNotes = async (req, res) => {
  const { projectId } = req.params;
  try {
    const notes = await ProjectNote.find({ projectId });
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
