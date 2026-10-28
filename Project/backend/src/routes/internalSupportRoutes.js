import express from 'express';
import { protectSupportAgent, requireActiveGrant } from '../middleware/supportMiddleware.js';
import { supportLogin, listGrantedTickets, replyToTicket, getDiagnostics } from '../controllers/internalSupportController.js';

const router = express.Router();
router.post('/login', supportLogin);
router.get('/tickets', protectSupportAgent, listGrantedTickets);
router.post('/tickets/:id/messages', protectSupportAgent, replyToTicket);
router.get('/tickets/:id/diagnostics', protectSupportAgent, requireActiveGrant('READ_DIAGNOSTICS'), getDiagnostics);
export default router;
