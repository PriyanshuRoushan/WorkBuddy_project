import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  companyId: { type: String, unique: true, sparse: true, immutable: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  databaseName: { type: String, required: true, unique: true, immutable: true },
  status: { type: String, enum: ['PROVISIONING', 'ACTIVE', 'SUSPENDED'], default: 'PROVISIONING' },
  ownerEmail: { type: String, required: true, lowercase: true },
  owner: {
    name: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    tenantUserId: mongoose.Schema.Types.ObjectId
  },
  contactEmail: { type: String, lowercase: true, trim: true, default: '' },
  industry: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'IN' },
  timezone: { type: String, trim: true, default: 'Asia/Kolkata' },
  subscription: {
    plan: { type: String, trim: true, default: 'TRIAL' },
    status: { type: String, enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'], default: 'TRIAL' },
    seats: { type: Number, min: 1, default: 10 },
    provider: { type: String, trim: true, default: 'manual' },
    providerCustomerId: { type: String, trim: true, default: '' },
    providerSubscriptionId: { type: String, trim: true, default: '' },
    renewsAt: Date
  },
  metrics: {
    users: { type: Number, min: 0, default: 0 },
    projects: { type: Number, min: 0, default: 0 },
    lastSyncedAt: Date
  },
  provisionedAt: Date
}, { timestamps: true });

schema.pre('validate', function () {
  if (!this.companyId) this.companyId = `WB-CMP-${this._id.toString().slice(-8).toUpperCase()}`;
  if (!this.owner?.email) this.set('owner.email', this.ownerEmail);
  if (!this.contactEmail) this.contactEmail = this.ownerEmail;
  if (!this.metrics?.lastSyncedAt) this.set('metrics.lastSyncedAt', new Date());
});

export default mongoose.model('ControlCompany', schema, 'control_companies');
