import express from 'express';
import { loginUser, getMe, updateProfile, inspectInvitation, acceptInvitation } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/invitations/:token', inspectInvitation);
router.post('/invitations/:token/accept', acceptInvitation);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
