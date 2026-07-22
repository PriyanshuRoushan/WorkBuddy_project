import User from '../models/User.js';
import StickyNote from '../models/StickyNote.js';
import Activity from '../models/Activity.js';
import { getOrCreateDefaultOrganization, tenantFilter } from '../utils/tenant.js';

// Team members directory
export const getTeamMembers = async (req, res) => {
  try {
    const organization = req.user?.organizationId
      ? { _id: req.user.organizationId }
      : await getOrCreateDefaultOrganization();
    const members = await User.find({ organizationId: organization._id })
      .select('-password')
      .sort({ createdAt: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteTeamMember = async (req, res) => {
  const { name, role, email, profileImage, themePreference } = req.body;
  try {
    const memberExists = await User.findOne({ organizationId: req.user.organizationId, email: email.toLowerCase() });
    if (memberExists) {
      return res.status(400).json({ message: 'Teammate with this email already exists' });
    }

    const defaultImg = profileImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqk97GopLCY0b1v6Sz4G0MTbOTGr4dRJXMhL3BhPT8g_2AGlm7mW_jaJlHkGNyRn5pB9F2g3C0UuE5oCoyrsUd5BmfVo3AAJ29AGQ1uzD2h-uEzOPdjnfmjdX0UQEbbvvI6KlB0dFV1DF8g7_SzvtZeuAhi6Cibl4V1XcBCjZzobzMdFHQtCKrLTlSWmLNywjfg9zcjQ1W97h_EW0WviC9vCcxr-zYrz0w1UU-7pYfobtri1KG4msxYGQdi8XaMvHFOWGlVSL7wUPJ';
    const member = await User.create({
      organizationId: req.user.organizationId,
      name,
      role,
      email: email.toLowerCase(),
      password: `invite-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      profileImage: defaultImg,
      themePreference: themePreference || 'light'
    });

    // Log activity
    await Activity.create({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      user: 'Creator',
      action: 'invited teammate',
      target: name,
      type: 'add'
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Team wall sticky notes
export const getStickyNotes = async (req, res) => {
  try {
    const notes = await StickyNote.find(tenantFilter(req)).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createStickyNote = async (req, res) => {
  const { content, author, color } = req.body;
  try {
    const note = new StickyNote({
      organizationId: req.user?.organizationId,
      authorId: req.user?._id,
      content,
      author,
      color
    });
    const savedNote = await note.save();

    // Log activity
    await Activity.create({
      organizationId: req.user?.organizationId,
      actorId: req.user?._id,
      user: author,
      action: 'posted on the team wall',
      target: content.substring(0, 20) + (content.length > 20 ? '...' : ''),
      type: 'comment',
      details: `"${content}"`
    });

    res.status(201).json(savedNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteStickyNote = async (req, res) => {
  try {
    const note = await StickyNote.findOneAndDelete(tenantFilter(req, { _id: req.params.id }));
    if (!note) return res.status(404).json({ message: 'Sticky note not found' });
    res.json({ message: 'Sticky note removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
