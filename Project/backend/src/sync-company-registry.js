import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Company from './control/Company.js';
import Identity from './control/Identity.js';
import Subscription from './control/Subscription.js';
import { getTenantModels, runWithTenant } from './tenancy/tenantContext.js';
import { modelDefinitions } from './tenancy/modelRegistry.js';

dotenv.config();

const companyCode = company => `WB-CMP-${company._id.toString().slice(-8).toUpperCase()}`;

const sync = async () => {
  await connectDB();
  const companies = await Company.find().sort({ createdAt: 1 });

  for (const company of companies) {
    const publicCompanyId = company.companyId || companyCode(company);
    const [subscription, ownerIdentity] = await Promise.all([
      Subscription.findOne({ companyId: company._id }).lean(),
      Identity.findOne({ companyId: company._id, email: company.ownerEmail }).lean()
    ]);
    const tenant = getTenantModels(company.databaseName, modelDefinitions);
    let owner = null;
    let organization = null;
    let users = 0;
    let projects = 0;

    await runWithTenant({ ...tenant, company }, async () => {
      [owner, organization, users, projects] = await Promise.all([
        ownerIdentity?.tenantUserId ? tenant.models.User.findById(ownerIdentity.tenantUserId).select('name email').lean() : null,
        tenant.models.Organization.findOne().select('industry').lean(),
        tenant.models.User.countDocuments(),
        tenant.models.Project.countDocuments()
      ]);
    });

    company.owner = {
      name: owner?.name || company.owner?.name || '',
      email: owner?.email || company.ownerEmail,
      tenantUserId: ownerIdentity?.tenantUserId || company.owner?.tenantUserId
    };
    company.contactEmail ||= company.ownerEmail;
    company.industry ||= organization?.industry || '';
    company.subscription = {
      plan: subscription?.plan || company.subscription?.plan || 'TRIAL',
      status: subscription?.status || company.subscription?.status || 'TRIAL',
      seats: subscription?.seats || company.subscription?.seats || 10,
      provider: subscription?.provider || company.subscription?.provider || 'manual',
      providerCustomerId: subscription?.providerCustomerId || company.subscription?.providerCustomerId || '',
      providerSubscriptionId: subscription?.providerSubscriptionId || company.subscription?.providerSubscriptionId || '',
      renewsAt: subscription?.renewsAt || company.subscription?.renewsAt
    };
    company.metrics = { users, projects, lastSyncedAt: new Date() };
    await company.save();
    if (!company.companyId) {
      await Company.collection.updateOne({ _id: company._id }, { $set: { companyId: publicCompanyId } });
    }
    console.log(`${publicCompanyId}: ${company.name} -> ${company.databaseName} (${users} users, ${projects} projects)`);
  }

  console.log(`Company registry synchronized: ${companies.length} companies`);
  await mongoose.disconnect();
};

sync().catch(async error => {
  console.error(`Company registry sync failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
