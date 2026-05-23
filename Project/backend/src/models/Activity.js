import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    default: 'System'
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
export default Activity;
