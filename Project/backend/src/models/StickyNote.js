import mongoose from 'mongoose';

const stickyNoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    enum: ['primary-container', 'secondary-container', 'tertiary-container', 'error-container'],
    default: 'primary-container'
  }
}, {
  timestamps: true
});

const StickyNote = mongoose.model('StickyNote', stickyNoteSchema);
export default StickyNote;
