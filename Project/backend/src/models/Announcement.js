import mongoose from 'mongoose';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const announcementSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['NORMAL', 'IMPORTANT', 'URGENT'], default: 'NORMAL' },
  audienceType: { type: String, enum: ['COMPANY', 'DEPARTMENT', 'TEAM', 'PROJECT', 'USERS'], required: true },
  audienceValue: { type: String, trim: true, default: '' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pinned: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

announcementSchema.index({ organizationId: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default tenantModelProxy('Announcement', announcementSchema, Announcement);
