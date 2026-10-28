import User from '../models/User.js';

const slug = value => String(value || 'WB').replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase() || 'WB';

export const generateEmployeeId = async (organization) => {
  const prefix = slug(organization.name);
  const year = new Date().getFullYear();
  const regex = new RegExp(`^WB-${prefix}-${year}-(\\d{4})$`);
  const latest = await User.findOne({ organizationId: organization._id, employeeId: regex })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();
  const next = latest ? Number(latest.employeeId.match(regex)?.[1] || 0) + 1 : 1;
  return `WB-${prefix}-${year}-${String(next).padStart(4, '0')}`;
};
