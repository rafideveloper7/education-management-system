const { ROLES } = require('../constants/roles.constants');
const { PERMISSIONS } = require('../constants/permissions.constants');
const { hasPermission } = require('../services/permission.service');

const canEnterResult = ({ user, result, resource, relationship = {} }) => {
  const targetResult = result || resource;
  if (!user || !user.sub || user.role !== ROLES.TEACHER || !targetResult) return false;
  if (!hasPermission(user, PERMISSIONS.RESULT_ENTER)) return false;
  if (!targetResult || typeof targetResult.status !== 'string' || targetResult.status === 'PUBLISHED') return false;
  if (!targetResult.academicSessionId || !targetResult.classId || !targetResult.sectionId || !targetResult.subjectId) return false;

  return relationship.isStudentEnrolled === true && relationship.hasTeachingAssignment === true;
};

module.exports = { canEnterResult };