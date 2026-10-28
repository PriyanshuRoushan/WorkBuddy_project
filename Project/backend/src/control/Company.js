import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  databaseName: { type: String, required: true, unique: true, immutable: true },
  status: { type: String, enum: ['PROVISIONING', 'ACTIVE', 'SUSPENDED'], default: 'PROVISIONING' },
  ownerEmail: { type: String, required: true, lowercase: true },
  provisionedAt: Date
}, { timestamps: true });

export default mongoose.model('ControlCompany', schema, 'control_companies');
