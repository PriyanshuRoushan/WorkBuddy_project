import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlCompany', required: true, index: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlSupportTicket', required: true, index: true },
  grantedByTenantUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
  permissions: [{ type: String, enum: ['READ_DIAGNOSTICS', 'READ_DATA', 'REPAIR_DATA'] }],
  reason: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  revokedByTenantUserId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

export default mongoose.model('ControlSupportAccessGrant', schema, 'control_support_access_grants');
