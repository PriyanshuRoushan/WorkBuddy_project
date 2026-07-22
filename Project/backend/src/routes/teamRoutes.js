import express from 'express';
import {
  getTeamMembers,
  inviteTeamMember,
  getStickyNotes,
  createStickyNote,
  deleteStickyNote
} from '../controllers/teamController.js';
import { protect, requireProjectManager } from '../middleware/authMiddleware.js';

const router = express.Router();

// Members routes
router.route('/members')
  .get(protect, getTeamMembers)
  .post(protect, requireProjectManager, inviteTeamMember);

// Sticky notes routes
router.route('/notes')
  .get(protect, getStickyNotes)
  .post(protect, createStickyNote);

router.route('/notes/:id')
  .delete(protect, deleteStickyNote);

export default router;
