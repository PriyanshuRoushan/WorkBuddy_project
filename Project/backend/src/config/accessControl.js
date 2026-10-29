export const ACCESS_ROLES = ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD', 'EMPLOYEE', 'VIEWER'];
export const GLOBAL_ACCESS_ROLES = ['CEO', 'HR'];
export const PEOPLE_ADMIN_ROLES = ['CEO', 'HR'];
export const PROJECT_ADMIN_ROLES = ['CEO', 'HR', 'MANAGER', 'TEAM_HEAD'];

export const ROLE_LEVELS = Object.freeze({
  CEO: 50,
  HR: 40,
  MANAGER: 30,
  TEAM_HEAD: 30,
  EMPLOYEE: 20,
  VIEWER: 10
});

export const hasRole = (user, roles) => Boolean(user && roles.includes(user.accessRole));
export const hasGlobalAccess = user => hasRole(user, GLOBAL_ACCESS_ROLES);
export const isRoleBelow = (actorRole, targetRole) => (
  Boolean(ROLE_LEVELS[actorRole] && ROLE_LEVELS[targetRole])
  && ROLE_LEVELS[actorRole] > ROLE_LEVELS[targetRole]
);
