import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['DRAFT', 'IN PROGRESS', 'REVIEW', 'DONE'],
    default: 'DRAFT'
  },
  collaborators: {
    type: [String],
    default: []
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

projectSchema.index({ organizationId: 1, updatedAt: -1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
