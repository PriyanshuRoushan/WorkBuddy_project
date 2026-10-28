import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlCompany', required: true, index: true },
  tenantUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], default: 'PENDING' },
  invitationTokenHash: { type: String, sparse: true, index: true }
}, { timestamps: true });

schema.index({ email: 1, companyId: 1 }, { unique: true });
export default mongoose.model('ControlIdentity', schema, 'control_identities');
