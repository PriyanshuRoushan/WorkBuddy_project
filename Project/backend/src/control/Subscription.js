import mongoose from 'mongoose';
import Company from './Company.js';

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

const syncCompanySubscription = async subscription => {
  if (!subscription?.companyId) return;
  await Company.updateOne(
    { _id: subscription.companyId },
    {
      $set: {
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          seats: subscription.seats,
          provider: subscription.provider,
          providerCustomerId: subscription.providerCustomerId || '',
          providerSubscriptionId: subscription.providerSubscriptionId || '',
          renewsAt: subscription.renewsAt
        }
      }
    }
  );
};

schema.post('save', syncCompanySubscription);
schema.post('findOneAndUpdate', syncCompanySubscription);
schema.post('updateOne', async function () {
  await syncCompanySubscription(await this.model.findOne(this.getQuery()).lean());
});

export default mongoose.model('ControlSubscription', schema, 'control_subscriptions');
