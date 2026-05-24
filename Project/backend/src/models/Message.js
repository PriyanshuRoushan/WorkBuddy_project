import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  reactions: [{
    user: String,
    emoji: String
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
