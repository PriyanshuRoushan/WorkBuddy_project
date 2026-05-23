import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  color: {
    type: String,
    enum: ['primary-container', 'secondary-container', 'tertiary-container', 'error-container'],
    default: 'primary-container'
  },
  collaborators: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
