import mongoose from 'mongoose';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const invitationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true, index: true },
  acceptedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });

invitationSchema.index({ organizationId: 1, email: 1, createdAt: -1 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default tenantModelProxy('Invitation', invitationSchema, Invitation);
