import Subscription from '../control/Subscription.js';
import SupportTicket from '../control/SupportTicket.js';
import SupportAccessGrant from '../control/SupportAccessGrant.js';
import AuditLog from '../control/AuditLog.js';

const audit = (req, action, metadata = {}) => AuditLog.create({
  companyId: req.company._id, actorType: 'COMPANY', actorId: req.user._id,
  action, metadata, ipAddress: req.ip
});

export const getSubscription = async (req, res) => {
  const subscription = await Subscription.findOne({ companyId: req.company._id }).lean();
  res.json(subscription || { plan: 'UNCONFIGURED', status: 'TRIAL', seats: 0 });
};

export const listSupportTickets = async (req, res) => {
  const canSeeCompanyTickets = ['CEO', 'HR'].includes(req.user.accessRole);
  res.json(await SupportTicket.find({ companyId: req.company._id, ...(!canSeeCompanyTickets && { openedByTenantUserId: req.user._id }) }).sort({ updatedAt: -1 }));
};

export const createSupportTicket = async (req, res) => {
  try {
    const { subject, message, priority = 'NORMAL' } = req.body;
    const ticket = await SupportTicket.create({ companyId: req.company._id, openedByTenantUserId: req.user._id, subject, priority, messages: [{ authorType: 'COMPANY', authorId: req.user._id, authorName: req.user.name, message }] });
    await audit(req, 'SUPPORT_TICKET_CREATED', { ticketId: ticket._id });
    res.status(201).json(ticket);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const addTicketMessage = async (req, res) => {
  const canSeeCompanyTickets = ['CEO', 'HR'].includes(req.user.accessRole);
  const ticket = await SupportTicket.findOneAndUpdate(
    { _id: req.params.id, companyId: req.company._id, ...(!canSeeCompanyTickets && { openedByTenantUserId: req.user._id }) },
    { $push: { messages: { authorType: 'COMPANY', authorId: req.user._id, authorName: req.user.name, message: req.body.message } } }, { new: true }
  );
  if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
  res.json(ticket);
};

export const grantSupportAccess = async (req, res) => {
  const { permissions = ['READ_DIAGNOSTICS'], reason, durationHours = 24 } = req.body;
  const ticket = await SupportTicket.findOne({ _id: req.params.id, companyId: req.company._id });
  if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
  const hours = Math.min(Math.max(Number(durationHours), 1), 72);
  const grant = await SupportAccessGrant.create({ companyId: req.company._id, ticketId: ticket._id, grantedByTenantUserId: req.user._id, permissions, reason, expiresAt: new Date(Date.now() + hours * 3600000) });
  await audit(req, 'SUPPORT_ACCESS_GRANTED', { ticketId: ticket._id, grantId: grant._id, permissions, expiresAt: grant.expiresAt });
  res.status(201).json(grant);
};

export const revokeSupportAccess = async (req, res) => {
  const grant = await SupportAccessGrant.findOneAndUpdate({ _id: req.params.grantId, companyId: req.company._id, revokedAt: null }, { revokedAt: new Date(), revokedByTenantUserId: req.user._id }, { new: true });
  if (!grant) return res.status(404).json({ message: 'Active access grant not found' });
  await audit(req, 'SUPPORT_ACCESS_REVOKED', { grantId: grant._id });
  res.json(grant);
};

export const getSupportAudit = async (req, res) => {
  res.json(await AuditLog.find({ companyId: req.company._id }).sort({ createdAt: -1 }).limit(500));
};
