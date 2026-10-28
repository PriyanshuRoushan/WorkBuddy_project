import jwt from 'jsonwebtoken';
import SupportAgent from '../control/SupportAgent.js';
import SupportTicket from '../control/SupportTicket.js';
import Company from '../control/Company.js';
import AuditLog from '../control/AuditLog.js';
import { getTenantModels } from '../tenancy/tenantContext.js';
import { modelDefinitions } from '../tenancy/modelRegistry.js';

const log = (req, companyId, action, metadata = {}) => AuditLog.create({
  companyId, ticketId: req.params.id, grantId: req.supportGrant?._id,
  actorType: 'SUPPORT', actorId: req.supportAgent._id, action, metadata, ipAddress: req.ip
});

export const supportLogin = async (req, res) => {
  const agent = await SupportAgent.findOne({ email: req.body.email?.toLowerCase(), status: 'ACTIVE' }).select('+password');
  if (!agent || !await agent.matchPassword(req.body.password || '')) return res.status(401).json({ message: 'Invalid support credentials' });
  const token = jwt.sign({ id: agent._id, kind: 'support' }, process.env.SUPPORT_JWT_SECRET || process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ name: agent.name, email: agent.email, token });
};

export const listGrantedTickets = async (req, res) => {
  const tickets = await SupportTicket.find({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }).populate('companyId', 'name slug').sort({ updatedAt: -1 });
  res.json(tickets);
};

export const replyToTicket = async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { $push: { messages: { authorType: 'SUPPORT', authorId: req.supportAgent._id, authorName: req.supportAgent.name, message: req.body.message } }, status: 'IN_PROGRESS' }, { new: true });
  if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
  await log(req, ticket.companyId, 'SUPPORT_MESSAGE_ADDED'); res.json(ticket);
};

export const getDiagnostics = async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  const company = ticket ? await Company.findById(ticket.companyId) : null;
  if (!ticket || !company) return res.status(404).json({ message: 'Company or ticket not found' });
  const tenant = getTenantModels(company.databaseName, modelDefinitions);
  const collectionNames = (await tenant.db.db.listCollections({}, { nameOnly: true }).toArray()).map(item => item.name);
  const counts = {};
  for (const name of collectionNames) counts[name] = await tenant.db.db.collection(name).estimatedDocumentCount();
  await log(req, company._id, 'SUPPORT_DIAGNOSTICS_VIEWED', { collections: collectionNames });
  res.json({ company: { id: company._id, name: company.name }, database: company.databaseName, collectionCounts: counts, grantExpiresAt: req.supportGrant.expiresAt });
};
