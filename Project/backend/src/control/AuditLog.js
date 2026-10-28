import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlCompany', required: true, index: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlSupportTicket' },
  grantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlSupportAccessGrant' },
  actorType: { type: String, enum: ['COMPANY', 'SUPPORT', 'SYSTEM'], required: true },
  actorId: mongoose.Schema.Types.ObjectId,
  action: { type: String, required: true },
  resource: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: String
}, { timestamps: true });

schema.index({ companyId: 1, createdAt: -1 });
export default mongoose.model('ControlAuditLog', schema, 'control_audit_logs');
