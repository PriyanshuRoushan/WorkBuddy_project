import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['TO DO', 'IN PROGRESS', 'DONE'],
    default: 'TO DO'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  dueDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedToEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  requiredSkills: {
    type: [String],
    default: []
  },
  complexityScore: {
    type: Number,
    min: 1,
    max: 5,
    default: 1
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

taskSchema.index({ organizationId: 1, projectId: 1, status: 1 });
taskSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
