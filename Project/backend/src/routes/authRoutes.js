import express from 'express';
import { loginUser, getMe, updateProfile, inspectInvitation, acceptInvitation, restoreSession, logoutUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/invitations/:token', inspectInvitation);
router.post('/invitations/:token/accept', acceptInvitation);
router.get('/me', protect, getMe);
router.get('/session', protect, restoreSession);
router.put('/profile', protect, updateProfile);

export default router;
