const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const controller = require('../../controllers/admin/relationships.controller');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const relationshipValidators = require('../../validators/relationships/relationship.validator');

const router = express.Router();
const parentStudents = express.Router();
const studentEnrollments = express.Router();
const teacherAssignments = express.Router();

router.use(authenticate);

parentStudents.use(requirePermissions(PERMISSIONS.PARENT_STUDENT_MANAGE));
parentStudents.post('/', validateRequest({ body: relationshipValidators.parentStudentCreateSchema }), controller.createParentStudent);
parentStudents.get('/', validateRequest({ query: relationshipValidators.parentStudentListQuerySchema }), controller.listParentStudents);
parentStudents.get('/:relationshipId', validateRequest({ params: relationshipValidators.relationshipParamsSchema }), controller.getParentStudent);
parentStudents.patch(
	'/:relationshipId/close',
	validateRequest({
		params: relationshipValidators.relationshipParamsSchema,
		body: relationshipValidators.parentStudentCloseSchema,
	}),
	controller.closeParentStudent
);

studentEnrollments.use(requirePermissions(PERMISSIONS.STUDENT_ENROLLMENT_MANAGE));
studentEnrollments.post('/', validateRequest({ body: relationshipValidators.studentEnrollmentCreateSchema }), controller.createStudentEnrollment);
studentEnrollments.get('/', validateRequest({ query: relationshipValidators.studentEnrollmentListQuerySchema }), controller.listStudentEnrollments);
studentEnrollments.get('/:relationshipId', validateRequest({ params: relationshipValidators.relationshipParamsSchema }), controller.getStudentEnrollment);
studentEnrollments.patch(
	'/:relationshipId/close',
	validateRequest({
		params: relationshipValidators.relationshipParamsSchema,
		body: relationshipValidators.studentEnrollmentCloseSchema,
	}),
	controller.closeStudentEnrollment
);

teacherAssignments.use(requirePermissions(PERMISSIONS.TEACHER_ASSIGNMENT_MANAGE));
teacherAssignments.post('/', validateRequest({ body: relationshipValidators.teacherAssignmentCreateSchema }), controller.createTeacherAssignment);
teacherAssignments.get('/', validateRequest({ query: relationshipValidators.teacherAssignmentListQuerySchema }), controller.listTeacherAssignments);
teacherAssignments.get('/:relationshipId', validateRequest({ params: relationshipValidators.relationshipParamsSchema }), controller.getTeacherAssignment);
teacherAssignments.patch(
	'/:relationshipId/close',
	validateRequest({
		params: relationshipValidators.relationshipParamsSchema,
		body: relationshipValidators.teacherAssignmentCloseSchema,
	}),
	controller.closeTeacherAssignment
);

router.use('/parent-students', parentStudents);
router.use('/student-enrollments', studentEnrollments);
router.use('/teacher-assignments', teacherAssignments);

module.exports = router;