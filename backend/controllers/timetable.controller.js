const { createTimetableService } = require('../services/timetable.service');

const timetable = createTimetableService();

const sendOk = (res, data, status = 200) => res.status(status).json({ success: true, data });
const sendPage = (res, page) => res.status(200).json({
  success: true,
  data: page.items,
  pagination: page.pagination,
});
const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};

module.exports = {
  create: wrap(async (req, res) => sendOk(res, await timetable.create({
    actor: req.user,
    payload: req.validated.body,
  }), 201)),
  update: wrap(async (req, res) => sendOk(res, await timetable.update({
    actor: req.user,
    entryId: req.validated.params.entryId,
    payload: req.validated.body,
  }))),
  publish: wrap(async (req, res) => sendOk(res, await timetable.publish({
    actor: req.user,
    entryId: req.validated.params.entryId,
  }))),
  archive: wrap(async (req, res) => sendOk(res, await timetable.archive({
    actor: req.user,
    entryId: req.validated.params.entryId,
  }))),
  listAdmin: wrap(async (req, res) => sendPage(res, await timetable.listForAdmin({
    filters: req.validated.query,
  }))),
  listClass: wrap(async (req, res) => {
    const page = await timetable.listForClass({
      actor: req.user,
      classId: req.validated.params.classId,
      sectionId: req.validated.params.sectionId,
      filters: req.validated.query,
    });
    return sendPage(res, page);
  }),
  listTeacher: wrap(async (req, res) => sendPage(res, await timetable.listForTeacher({
    actor: req.user,
    filters: req.validated.query,
  }))),
  listMe: wrap(async (req, res) => {
    if (req.user.role === 'TEACHER') {
      return sendPage(res, await timetable.listForTeacher({
        actor: req.user,
        filters: req.validated.query,
      }));
    }
    if (req.user.role === 'STUDENT') {
      return sendPage(res, await timetable.listForStudent({
        actor: req.user,
        filters: req.validated.query,
      }));
    }
    throw new Error('Unsupported timetable /me role');
  }),
  listParentChild: wrap(async (req, res) => sendPage(res, await timetable.listForParent({
    actor: req.user,
    studentId: req.validated.params.studentId,
    filters: req.validated.query,
  }))),
};
