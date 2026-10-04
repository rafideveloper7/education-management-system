const relationshipService = require('../../services/relationship.service');
const ApiError = require('../../utils/ApiError');

const sendCreated = (res, data) => res.status(201).json({ success: true, data });
const sendOk = (res, data) => res.status(200).json({ success: true, data });
const sendPage = (res, page) => res.status(200).json({
  success: true,
  data: page.items,
  pagination: page.pagination,
});

const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};

const createParentStudent = wrap(async (req, res) => sendCreated(
  res,
  await relationshipService.createParentStudent(req.validated.body)
));
const listParentStudents = wrap(async (req, res) => sendPage(
  res,
  await relationshipService.listParentStudents(req.validated.query)
));
const getParentStudent = wrap(async (req, res) => {
  const record = await relationshipService.getParentStudent(req.validated.params.relationshipId);
  if (!record) throw new ApiError(404, 'Relationship not found', { code: 'RELATIONSHIP_NOT_FOUND' });
  return sendOk(res, record);
});
const closeParentStudent = wrap(async (req, res) => {
  const { status, effectiveAt } = req.validated.body;
  return sendOk(res, await relationshipService.closeParentStudent(
    req.validated.params.relationshipId,
    status,
    effectiveAt
  ));
});

const createStudentEnrollment = wrap(async (req, res) => sendCreated(
  res,
  await relationshipService.createStudentEnrollment(req.validated.body)
));
const listStudentEnrollments = wrap(async (req, res) => sendPage(
  res,
  await relationshipService.listStudentEnrollments(req.validated.query)
));
const getStudentEnrollment = wrap(async (req, res) => {
  const record = await relationshipService.getStudentEnrollment(req.validated.params.relationshipId);
  if (!record) throw new ApiError(404, 'Relationship not found', { code: 'RELATIONSHIP_NOT_FOUND' });
  return sendOk(res, record);
});
const closeStudentEnrollment = wrap(async (req, res) => {
  const { status, effectiveAt } = req.validated.body;
  return sendOk(res, await relationshipService.closeStudentEnrollment(
    req.validated.params.relationshipId,
    status,
    effectiveAt
  ));
});

const createTeacherAssignment = wrap(async (req, res) => sendCreated(
  res,
  await relationshipService.createTeacherAssignment(req.validated.body)
));
const listTeacherAssignments = wrap(async (req, res) => sendPage(
  res,
  await relationshipService.listTeacherAssignments(req.validated.query)
));
const getTeacherAssignment = wrap(async (req, res) => {
  const record = await relationshipService.getTeacherAssignment(req.validated.params.relationshipId);
  if (!record) throw new ApiError(404, 'Relationship not found', { code: 'RELATIONSHIP_NOT_FOUND' });
  return sendOk(res, record);
});
const closeTeacherAssignment = wrap(async (req, res) => {
  const { status, effectiveAt } = req.validated.body;
  return sendOk(res, await relationshipService.closeTeacherAssignment(
    req.validated.params.relationshipId,
    status,
    effectiveAt
  ));
});

module.exports = {
  createParentStudent,
  listParentStudents,
  getParentStudent,
  closeParentStudent,
  createStudentEnrollment,
  listStudentEnrollments,
  getStudentEnrollment,
  closeStudentEnrollment,
  createTeacherAssignment,
  listTeacherAssignments,
  getTeacherAssignment,
  closeTeacherAssignment,
};