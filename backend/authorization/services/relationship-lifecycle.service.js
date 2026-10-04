const ParentStudent = require('../../models/parent/ParentStudent');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const TeacherAssignment = require('../../models/teacher/TeacherAssignment');

const RELATIONSHIP_TRANSITIONS = Object.freeze({
  parentStudent: Object.freeze(['ENDED', 'DECEASED']),
  studentEnrollment: Object.freeze(['COMPLETED', 'ENDED', 'SUSPENDED']),
  teacherAssignment: Object.freeze(['ENDED', 'CANCELLED']),
});

const createRelationshipLifecycleService = ({
  ParentStudent: ParentStudentModel = ParentStudent,
  StudentEnrollment: StudentEnrollmentModel = StudentEnrollment,
  TeacherAssignment: TeacherAssignmentModel = TeacherAssignment,
  now = () => new Date(),
}) => {
  const closeRecord = async (Model, allowedStatuses, relationshipId, status, effectiveAt) => {
    if (!allowedStatuses.includes(status)) {
      throw new TypeError(`Unsupported relationship status: ${status}`);
    }

    const endedAt = effectiveAt ? new Date(effectiveAt) : now();
    if (Number.isNaN(endedAt.getTime())) {
      throw new TypeError('effectiveAt must be a valid date');
    }

    return Model.findOneAndUpdate(
      {
        _id: relationshipId,
        status: 'ACTIVE',
        validFrom: { $lte: endedAt },
      },
      { $set: { status, validTo: endedAt } },
      { new: true, runValidators: true }
    );
  };

  return {
    closeParentStudent: (id, status = 'ENDED', at) => closeRecord(
      ParentStudentModel,
      RELATIONSHIP_TRANSITIONS.parentStudent,
      id,
      status,
      at
    ),
    closeStudentEnrollment: (id, status = 'ENDED', at) => closeRecord(
      StudentEnrollmentModel,
      RELATIONSHIP_TRANSITIONS.studentEnrollment,
      id,
      status,
      at
    ),
    closeTeacherAssignment: (id, status = 'ENDED', at) => closeRecord(
      TeacherAssignmentModel,
      RELATIONSHIP_TRANSITIONS.teacherAssignment,
      id,
      status,
      at
    ),
  };
};

module.exports = { createRelationshipLifecycleService, RELATIONSHIP_TRANSITIONS };