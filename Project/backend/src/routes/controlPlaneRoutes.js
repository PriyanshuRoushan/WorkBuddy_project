import express from 'express';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { getSubscription, listSupportTickets, createSupportTicket, addTicketMessage, grantSupportAccess, revokeSupportAccess, getSupportAudit } from '../controllers/controlPlaneController.js';

const router = express.Router();
router.get('/subscription', protect, requireRoles('CEO'), getSubscription);
router.get('/support/tickets', protect, listSupportTickets);
router.post('/support/tickets', protect, createSupportTicket);
router.post('/support/tickets/:id/messages', protect, addTicketMessage);
router.post('/support/tickets/:id/access', protect, requireRoles('CEO', 'HR'), grantSupportAccess);
router.post('/support/access/:grantId/revoke', protect, requireRoles('CEO', 'HR'), revokeSupportAccess);
router.get('/support/audit', protect, requireRoles('CEO', 'HR'), getSupportAudit);
export default router;
