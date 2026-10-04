const { ROLES, ROLE_VALUES } = require('./constants/roles.constants');
const { PERMISSIONS } = require('./constants/permissions.constants');
const { ROLE_PERMISSIONS } = require('./config/role-permissions');
const { requirePermissions } = require('./middleware/permission.middleware');
const { requireResourceAccess } = require('./middleware/resource-access.middleware');
const { hasPermission, hasAllPermissions } = require('./services/permission.service');
const { createRelationshipContextResolver } = require('./services/relationship-access.service');
const { createRelationshipLifecycleService } = require('./services/relationship-lifecycle.service');
const { canAccessStudentRecord } = require('./policies/student-record.policy');
const { canEnterResult } = require('./policies/result.policy');

module.exports = {
  ROLES,
  ROLE_VALUES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  requirePermissions,
  requireResourceAccess,
  hasPermission,
  hasAllPermissions,
  createRelationshipContextResolver,
  createRelationshipLifecycleService,
  canAccessStudentRecord,
  canEnterResult,
};