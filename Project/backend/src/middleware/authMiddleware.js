import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getOrCreateDefaultOrganization } from '../utils/tenant.js';
import { hasRole } from '../config/accessControl.js';
import Company from '../control/Company.js';
import { getTenantModels, runWithTenant } from '../tenancy/tenantContext.js';
import { modelDefinitions } from '../tenancy/modelRegistry.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'doodlesaas_super_secret_key');
      
      const company = decoded.companyId ? await Company.findById(decoded.companyId) : null;
      if (decoded.companyId && (!company || company.status !== 'ACTIVE')) {
        return res.status(403).json({ message: 'Company workspace is not active' });
      }
      const tenant = company ? getTenantModels(company.databaseName, modelDefinitions) : null;
      runWithTenant(tenant ? { ...tenant, company } : {}, async () => {
        req.company = company;
        req.tenant = tenant;
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'Not authorized, user not found' });
        if (req.user.accountStatus !== 'ACTIVE') return res.status(403).json({ message: 'Your account is not active. Contact HR or your CEO.' });
        if (!req.user.organizationId) {
          const organization = await getOrCreateDefaultOrganization();
          req.user.organizationId = organization._id;
          await req.user.save();
        }
        next();
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
export const requireProjectManager = (req, res, next) => {
  if (hasRole(req.user, ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD'])) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: project administration permission required' });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (hasRole(req.user, roles)) return next();
  return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });
};
