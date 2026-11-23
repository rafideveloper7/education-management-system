const academicService = require('../../services/academic/academic.service');

const sendOk = (res, data, status = 200) => {
  if (data && Array.isArray(data.items) && data.pagination) {
    return res.status(status).json({ success: true, data: data.items, pagination: data.pagination });
  }
  return res.status(status).json({ success: true, data });
};
const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};
const resourceHandlers = (name, plural) => ({
  create: wrap(async (req, res) => sendOk(res, await academicService[`create${name}`](req.validated.body), 201)),
  list: wrap(async (req, res) => sendOk(res, await academicService[`list${plural}`](req.validated.query))),
  get: wrap(async (req, res) => sendOk(res, await academicService[`get${name}`](req.validated.params.recordId))),
  update: wrap(async (req, res) => sendOk(res, await academicService[`update${name}`](
    req.validated.params.recordId,
    req.validated.body
  ))),
});

const sessions = resourceHandlers('Session', 'Sessions');
const classes = resourceHandlers('Class', 'Classes');
const sections = resourceHandlers('Section', 'Sections');
const subjects = resourceHandlers('Subject', 'Subjects');
const classSubjects = resourceHandlers('ClassSubject', 'ClassSubjects');

const listSessions = sessions.list;
const listClasses = classes.list;
const listSections = sections.list;
const listSubjects = subjects.list;
const listClassSubjects = classSubjects.list;

const changeSessionStatus = wrap(async (req, res) => sendOk(res, await academicService.changeSessionStatus(
  req.validated.params.recordId,
  req.validated.body.status
)));

module.exports = {
  createSession: sessions.create,
  listSessions,
  getSession: sessions.get,
  updateSession: sessions.update,
  changeSessionStatus,
  createClass: classes.create,
  listClasses,
  getClass: classes.get,
  updateClass: classes.update,
  createSection: sections.create,
  listSections,
  getSection: sections.get,
  updateSection: sections.update,
  createSubject: subjects.create,
  listSubjects,
  getSubject: subjects.get,
  updateSubject: subjects.update,
  createClassSubject: classSubjects.create,
  listClassSubjects,
  getClassSubject: classSubjects.get,
  updateClassSubject: classSubjects.update,
};