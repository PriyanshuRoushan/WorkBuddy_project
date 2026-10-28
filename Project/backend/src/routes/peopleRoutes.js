import express from 'express';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { listPeople, invitePerson, updatePerson, setAccountStatus } from '../controllers/peopleController.js';

const router = express.Router();
router.get('/', protect, listPeople);
router.post('/invite', protect, requireRoles('CEO', 'HR'), invitePerson);
router.patch('/:id', protect, requireRoles('CEO', 'HR', 'TEAM_HEAD'), updatePerson);
router.patch('/:id/status', protect, requireRoles('CEO', 'HR'), setAccountStatus);
export default router;
