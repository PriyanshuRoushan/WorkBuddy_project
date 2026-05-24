import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
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
    type: String,
    default: 'creator@workbuddy.com'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
