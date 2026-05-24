import mongoose from 'mongoose';

const projectNoteSchema = new mongoose.Schema({
  noteId: {
    type: String,
    required: true,
    unique: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  positionX: {
    type: Number,
    required: true,
    default: 100
  },
  positionY: {
    type: Number,
    required: true,
    default: 100
  },
  width: {
    type: Number,
    default: 180
  },
  height: {
    type: Number,
    default: 180
  },
  color: {
    type: String,
    default: 'primary-container'
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const ProjectNote = mongoose.model('ProjectNote', projectNoteSchema);
export default ProjectNote;
