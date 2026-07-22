import mongoose from 'mongoose';

const roleTemplateSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  roleName: {
    type: String,
    required: true,
    trim: true
  },
  profileSchema: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  algorithmWeights: {
    technicalSkill: {
      type: Number,
      default: 0.4
    },
    collaboration: {
      type: Number,
      default: 0.3
    },
    availability: {
      type: Number,
      default: 0.3
    }
  }
}, { timestamps: true });

roleTemplateSchema.index({ organizationId: 1, roleName: 1 }, { unique: true });

const RoleTemplate = mongoose.model('RoleTemplate', roleTemplateSchema);
export default RoleTemplate;
