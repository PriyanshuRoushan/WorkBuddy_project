import mongoose from 'mongoose';

const stickyNoteSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
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
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
