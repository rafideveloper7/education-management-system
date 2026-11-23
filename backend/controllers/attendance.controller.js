const attendanceService = require('../services/attendance/attendance.service');

const sendOk = (res, data, status = 200) => {
  if (data && Array.isArray(data.items) && data.pagination) {
    return res.status(status).json({ success: true, data: data.items, pagination: data.pagination });
  }
  return res.status(status).json({ success: true, data });
};

const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};

module.exports = {
  markSectionAttendance: wrap(async (req, res) => sendOk(res, await attendanceService.markSectionAttendance({
    actor: req.user,
    sectionId: req.validated.params.sectionId,
    payload: req.validated.body,
  }), 201)),
  listSectionAttendance: wrap(async (req, res) => sendOk(res, await attendanceService.listSectionAttendance({
    actor: req.user,
    sectionId: req.validated.params.sectionId,
    filters: req.validated.query,
  }))),
  listStudentAttendance: wrap(async (req, res) => sendOk(res, await attendanceService.listStudentAttendance({
    actor: req.user,
    studentUserId: req.validated.params.studentUserId,
    filters: req.validated.query,
  }))),
  correctAttendance: wrap(async (req, res) => sendOk(res, await attendanceService.correctAttendance({
    actor: req.user,
    recordId: req.validated.params.recordId,
    ...req.validated.body,
  }))),
};