import express from 'express';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { listAnnouncements, createAnnouncement, markRead } from '../controllers/announcementController.js';

const router = express.Router();
router.get('/', protect, listAnnouncements);
router.post('/', protect, requireRoles('CEO', 'HR', 'MANAGER', 'TEAM_HEAD'), createAnnouncement);
router.patch('/:id/read', protect, markRead);
export default router;
