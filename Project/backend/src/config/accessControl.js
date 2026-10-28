export const ACCESS_ROLES = ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD', 'EMPLOYEE', 'VIEWER'];
export const GLOBAL_ACCESS_ROLES = ['CEO', 'HR'];
export const PEOPLE_ADMIN_ROLES = ['CEO', 'HR'];
export const PROJECT_ADMIN_ROLES = ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD'];

export const hasRole = (user, roles) => Boolean(user && roles.includes(user.accessRole));
export const hasGlobalAccess = user => hasRole(user, GLOBAL_ACCESS_ROLES);
