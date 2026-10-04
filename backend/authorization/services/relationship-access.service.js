const mongoose = require('mongoose');

const ParentStudent = require('../../models/parent/ParentStudent');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const TeacherAssignment = require('../../models/teacher/TeacherAssignment');

const effectiveOn = (date, historicalStatuses = []) => ({
  validFrom: { $lte: date },
  $or: [
    {
      status: 'ACTIVE',
      $or: [{ validTo: null }, { validTo: { $gte: date } }],
    },
    ...(historicalStatuses.length > 0
      ? [{ status: { $in: historicalStatuses }, validTo: { $gte: date } }]
      : []),
  ],
});

const createRelationshipContextResolver = ({
  resolveResource,
  models = { ParentStudent, StudentEnrollment, TeacherAssignment },
  now = () => new Date(),
}) => {
  if (typeof resolveResource !== 'function') {
    throw new TypeError('resolveResource must be a function');
  }

  return async (req) => {
    const resource = await resolveResource(req);
    if (!resource) return null;

    const { user } = req;
    const requiredIds = [
      user?.sub,
      resource.studentUserId,
      resource.academicSessionId,
      resource.classId,
      resource.sectionId,
    ];

    if (!requiredIds.every((id) => mongoose.isValidObjectId(id))) return null;

    const accessDate = new Date(
      resource.authorizationDate || resource.occurredAt || resource.createdAt || now()
    );
    const currentDate = now();
    if (Number.isNaN(accessDate.getTime())) return null;

    const relationship = {
      isLinkedParent: false,
      isStudentEnrolled: false,
      hasTeachingAssignment: false,
    };

    if (user.role !== 'ADMIN') {
      relationship.isStudentEnrolled = Boolean(await models.StudentEnrollment.exists({
        studentUserId: resource.studentUserId,
        academicSessionId: resource.academicSessionId,
        classId: resource.classId,
        sectionId: resource.sectionId,
        ...effectiveOn(accessDate, ['COMPLETED', 'ENDED']),
      }));
    }

    if (user.role !== 'ADMIN' && !relationship.isStudentEnrolled) {
      return { studentUserId: resource.studentUserId, resource, relationship };
    }

    if (user.role === 'PARENT') {
      relationship.isLinkedParent = Boolean(await models.ParentStudent.exists({
        parentUserId: user.sub,
        studentUserId: resource.studentUserId,
        status: 'ACTIVE',
        ...effectiveOn(currentDate),
      }));
    } else if (user.role === 'TEACHER') {
      const assignmentFilter = {
        teacherUserId: user.sub,
        academicSessionId: resource.academicSessionId,
        classId: resource.classId,
        sectionId: resource.sectionId,
        ...effectiveOn(accessDate, ['ENDED']),
      };

      if (resource.subjectId) {
        if (!mongoose.isValidObjectId(resource.subjectId)) return null;
        assignmentFilter.subjectId = resource.subjectId;
      }

      relationship.hasTeachingAssignment = Boolean(
        await models.TeacherAssignment.exists(assignmentFilter)
      );
    }

    return {
      studentUserId: resource.studentUserId,
      resource,
      relationship,
    };
  };
};

module.exports = { createRelationshipContextResolver };