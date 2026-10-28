import jwt from 'jsonwebtoken';
import SupportAgent from '../control/SupportAgent.js';
import SupportAccessGrant from '../control/SupportAccessGrant.js';

export const protectSupportAgent = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'Support authentication required' });
    const decoded = jwt.verify(token, process.env.SUPPORT_JWT_SECRET || process.env.JWT_SECRET);
    if (decoded.kind !== 'support') return res.status(403).json({ message: 'Company accounts cannot use support APIs' });
    req.supportAgent = await SupportAgent.findOne({ _id: decoded.id, status: 'ACTIVE' });
    if (!req.supportAgent) return res.status(401).json({ message: 'Support account unavailable' });
    next();
  } catch { res.status(401).json({ message: 'Invalid support token' }); }
};

export const requireActiveGrant = permission => async (req, res, next) => {
  const grant = await SupportAccessGrant.findOne({
    ticketId: req.params.id, revokedAt: null, expiresAt: { $gt: new Date() }, permissions: permission
  });
  if (!grant) return res.status(403).json({ message: `An active ${permission} grant is required` });
  req.supportGrant = grant; next();
};
