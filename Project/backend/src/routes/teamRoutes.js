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
  .get(getTeamMembers)
  .post(protect, requireProjectManager, inviteTeamMember);

// Sticky notes routes
router.route('/notes')
  .get(getStickyNotes)
  .post(createStickyNote);

router.route('/notes/:id')
  .delete(deleteStickyNote);

export default router;
