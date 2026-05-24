import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Ensure unique project membership
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);
export default ProjectMember;
