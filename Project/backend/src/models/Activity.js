import mongoose from 'mongoose';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const activitySchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  user: {
    type: String,
    required: true,
    default: 'System'
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  type: {
    type: String,
    enum: ['add', 'comment', 'check', 'system'],
    default: 'system'
  }
}, {
  timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);
export default tenantModelProxy('Activity', activitySchema, Activity);
