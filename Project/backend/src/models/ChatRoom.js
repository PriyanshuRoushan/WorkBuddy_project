import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  }
}, { timestamps: true });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default ChatRoom;
