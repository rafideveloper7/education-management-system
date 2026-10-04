const { ROLE_PERMISSIONS } = require('../config/role-permissions');

const hasPermission = (user, permission) => Boolean(
  user
  && typeof user.role === 'string'
  && Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, user.role)
  && ROLE_PERMISSIONS[user.role].includes(permission)
);

const hasAllPermissions = (user, permissions) => (
  Array.isArray(permissions)
  && permissions.length > 0
  && permissions.every((permission) => hasPermission(user, permission))
);

module.exports = { hasPermission, hasAllPermissions };