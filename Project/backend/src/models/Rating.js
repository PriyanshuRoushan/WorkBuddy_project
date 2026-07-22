import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  raterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  scores: {
    type: Map,
    of: Number,
    default: {}
  },
  comment: {
    type: String,
    trim: true
  }
}, { timestamps: true });

ratingSchema.index({ organizationId: 1, targetUserId: 1, createdAt: -1 });
ratingSchema.index({ organizationId: 1, projectId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
