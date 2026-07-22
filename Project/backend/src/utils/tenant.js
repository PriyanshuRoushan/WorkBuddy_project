import Organization from '../models/Organization.js';

const DEFAULT_ORG_NAME = 'WorkBuddy Studio';

export const getTenantId = (req) => {
  return req.user?.organizationId;
};

export const tenantFilter = (req, extra = {}) => {
  const organizationId = getTenantId(req);
  return organizationId ? { organizationId, ...extra } : extra;
};

export const getOrCreateDefaultOrganization = async () => {
  let organization = await Organization.findOne({ name: DEFAULT_ORG_NAME });
  if (!organization) {
    organization = await Organization.create({ name: DEFAULT_ORG_NAME });
  }
  return organization;
};
