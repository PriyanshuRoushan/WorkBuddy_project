import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ControlCompany', required: true, unique: true },
  provider: { type: String, default: 'manual' },
  providerCustomerId: String,
  providerSubscriptionId: String,
  plan: { type: String, default: 'TRIAL' },
  status: { type: String, enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'], default: 'TRIAL' },
  seats: { type: Number, min: 1, default: 10 },
  renewsAt: Date,
  invoiceReferences: [{ id: String, url: String, createdAt: Date }]
}, { timestamps: true });

export default mongoose.model('ControlSubscription', schema, 'control_subscriptions');
