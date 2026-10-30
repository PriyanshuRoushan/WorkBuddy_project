import mongoose from 'mongoose';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const chatRoomSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  slug: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, default: '', trim: true },
  type: { type: String, enum: ['GENERAL', 'ANNOUNCEMENTS', 'CUSTOM'], default: 'CUSTOM' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived: { type: Boolean, default: false, index: true },
  isDirectMessage: { type: Boolean, default: false },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

chatRoomSchema.index({ organizationId: 1, projectId: 1, slug: 1 }, { unique: true });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default tenantModelProxy('ChatRoom', chatRoomSchema, ChatRoom);
