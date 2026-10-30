import mongoose from 'mongoose';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const channelStateSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  notificationPreference: {
    type: String,
    enum: ['ALL', 'MENTIONS', 'MUTED'],
    default: 'ALL'
  },
  lastReadAt: Date,
  bookmarkedMessageIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
}, { timestamps: true });

channelStateSchema.index({ organizationId: 1, channelId: 1, userId: 1 }, { unique: true });

const ChannelState = mongoose.model('ChannelState', channelStateSchema);
export default tenantModelProxy('ChannelState', channelStateSchema, ChannelState);
