import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    trim: true,
    default: 'Creative Collaboration'
  },
  algorithmConfig: {
    prioritizeInternalHires: {
      type: Boolean,
      default: true
    },
    synergyWeightMultiplier: {
      type: Number,
      default: 1.0
    }
  }
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
