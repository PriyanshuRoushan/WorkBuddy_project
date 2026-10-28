import mongoose from 'mongoose';
import { tenantModelProxy } from '../tenancy/tenantContext.js';

const projectMemberSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
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
    enum: ['PROJECT_LEAD', 'DEVELOPER', 'REVIEWER', 'QA', 'OBSERVER', 'CONTRIBUTOR'],
    default: 'CONTRIBUTOR'
  },
  allocationPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Ensure unique project membership
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
projectMemberSchema.index({ organizationId: 1, projectId: 1, userId: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);
export default tenantModelProxy('ProjectMember', projectMemberSchema, ProjectMember);
