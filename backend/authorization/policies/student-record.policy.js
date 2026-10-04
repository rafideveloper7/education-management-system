const { ROLES } = require('../constants/roles.constants');

const canAccessStudentRecord = ({ user, studentId, studentUserId, relationship = {} }) => {
  const targetStudentId = studentUserId || studentId;
  if (!user || !user.sub || !targetStudentId) return false;

  if (user.role === ROLES.ADMIN) return true;
  if (relationship.isStudentEnrolled !== true) return false;

  if (user.role === ROLES.STUDENT) {
    return String(user.sub) === String(targetStudentId);
  }

  if (user.role === ROLES.PARENT) {
    return relationship.isLinkedParent === true;
  }

  if (user.role === ROLES.TEACHER) {
    return relationship.hasTeachingAssignment === true;
  }

  return false;
};

module.exports = { canAccessStudentRecord };