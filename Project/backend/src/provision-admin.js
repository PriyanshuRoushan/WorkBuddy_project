import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Organization from './models/Organization.js';
import User from './models/User.js';
import { generateEmployeeId } from './utils/employeeId.js';
import Company from './control/Company.js';
import Identity from './control/Identity.js';
import Subscription from './control/Subscription.js';
import { getTenantModels, runWithTenant } from './tenancy/tenantContext.js';
import { modelDefinitions } from './tenancy/modelRegistry.js';
import crypto from 'node:crypto';

dotenv.config();
const required = ['PROVISION_ORG', 'PROVISION_NAME', 'PROVISION_EMAIL', 'PROVISION_PASSWORD'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Missing variables: ${missing.join(', ')}`);
  process.exit(1);
}

await connectDB();
try {
  const companyName = process.env.PROVISION_ORG.trim();
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
  const databaseName = `workbuddy_company_${crypto.randomBytes(8).toString('hex')}`;
  const email = process.env.PROVISION_EMAIL.trim().toLowerCase();
  if (await Company.exists({ $or: [{ slug }, { ownerEmail: email }] })) throw new Error('Company or owner email already exists');
  const companyObjectId = new mongoose.Types.ObjectId();
  const companyId = `WB-CMP-${companyObjectId.toString().slice(-8).toUpperCase()}`;
  const company = await Company.create({
    _id: companyObjectId,
    companyId,
    name: companyName,
    slug,
    databaseName,
    ownerEmail: email,
    owner: { name: process.env.PROVISION_NAME.trim(), email },
    contactEmail: email,
    subscription: { plan: 'TRIAL', status: 'TRIAL', seats: 10, provider: 'manual' },
    status: 'PROVISIONING'
  });
  const tenant = getTenantModels(databaseName, modelDefinitions);
  let user;
  await runWithTenant({ ...tenant, company }, async () => {
    const organization = await Organization.create({ name: companyName });
    user = await User.create({
      organizationId: organization._id, name: process.env.PROVISION_NAME.trim(), email,
      password: process.env.PROVISION_PASSWORD, employeeId: await generateEmployeeId(organization),
      accessRole: process.env.PROVISION_ROLE === 'HR' ? 'HR' : 'CEO',
      jobTitle: process.env.PROVISION_ROLE === 'HR' ? 'Human Resources' : 'Chief Executive Officer', accountStatus: 'ACTIVE'
    });
  });
  await Identity.create({ email, companyId: company._id, tenantUserId: user._id, status: 'ACTIVE' });
  await Subscription.create({ companyId: company._id, plan: 'TRIAL', status: 'TRIAL', seats: 10 });
  company.owner.tenantUserId = user._id;
  company.metrics = { users: 1, projects: 0, lastSyncedAt: new Date() };
  company.status = 'ACTIVE'; company.provisionedAt = new Date(); await company.save();
  console.log(`Provisioned ${user.accessRole} ${user.email} (${user.employeeId})`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
