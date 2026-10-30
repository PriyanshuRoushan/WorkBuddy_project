import mongoose from 'mongoose';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const messageSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true
  },
  senderAvatar: { type: String, default: '' },
  content: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  reactions: [{
    user: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isPinned: { type: Boolean, default: false, index: true },
  isDecision: { type: Boolean, default: false, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  editedAt: Date,
  deletedAt: Date,
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

messageSchema.index({ organizationId: 1, roomId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default tenantModelProxy('Message', messageSchema, Message);
