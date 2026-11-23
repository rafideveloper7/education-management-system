const assignmentService = require('../services/assignment/assignment.service');
const storage = require('../services/assignment/cloudinary-storage.service');
const { pipeline } = require('stream/promises');

const sendOk = (res, data, status = 200) => res.status(status).json({ success: true, data });
const sendPage = (res, page) => res.status(200).json({
  success: true,
  data: page.items,
  pagination: page.pagination,
});
const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};
const preflight = (handler) => async (req, res, next) => {
  try { await handler(req); next(); } catch (error) { next(error); }
};

const presentFile = (file) => {
  if (!file) return null;
  const { publicId, provider, resourceType, ...safeMetadata } = file;
  return safeMetadata;
};
const presentAssignment = (assignment) => {
  if (!assignment) return assignment;
  const value = assignment.toObject ? assignment.toObject() : { ...assignment };
  return { ...value, attachments: (value.attachments || []).map(presentFile) };
};
const presentSubmission = (submission) => {
  if (!submission) return submission;
  const value = submission.toObject ? submission.toObject() : { ...submission };
  return { ...value, file: presentFile(value.file) };
};

const downloadFile = async (res, file) => {
  const download = await storage.download({ publicId: file.publicId, format: file.format });
  const headers = {
    'Content-Type': file.mimeType,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  };
  if (download.contentLength) headers['Content-Length'] = download.contentLength;
  res.set(headers).status(200);
  return pipeline(download.body, res);
};

module.exports = {
  create: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.createAssignment({
    actor: req.user,
    data: req.validated.body,
  })), 201)),
  listTeacher: wrap(async (req, res) => sendPage(res, await assignmentService.listTeacherAssignments({
    actor: req.user,
    filters: req.validated.query,
  }).then((page) => ({ ...page, items: page.items.map(presentAssignment) })))),
  getTeacher: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.getAssignmentForTeacher({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
  })))),
  update: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.updateAssignment({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
    data: req.validated.body,
  })))),
  publish: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.publishAssignment({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
  })))),
  close: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.closeAssignment({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
  })))),
  extendDeadline: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.extendDeadline({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
    ...req.validated.body,
  })))),
  preflightAttachment: preflight((req) => assignmentService.authorizeAttachmentUpload({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
  })),
  addAttachment: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.uploadAttachment({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
    file: req.assignmentFile,
  })), 201)),
  listSubmissions: wrap(async (req, res) => sendPage(res, await assignmentService.listAssignmentSubmissions({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
    ...req.validated.query,
  }).then((page) => ({ ...page, items: page.items.map(presentSubmission) })))),
  listStudent: wrap(async (req, res) => sendPage(res, await assignmentService.listStudentAssignments({
    actor: req.user,
    filters: req.validated.query,
  }).then((page) => ({ ...page, items: page.items.map(presentAssignment) })))),
  getStudent: wrap(async (req, res) => sendOk(res, presentAssignment(await assignmentService.getStudentAssignment({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
  })))),
  preflightSubmission: preflight((req) => assignmentService.authorizeSubmissionUpload({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
  })),
  submit: wrap(async (req, res) => sendOk(res, presentSubmission(await assignmentService.submitFile({
    actor: req.user,
    assignmentId: req.validated.params.assignmentId,
    file: req.assignmentFile,
  })), 201)),
  listOwnSubmissions: wrap(async (req, res) => sendPage(res, await assignmentService.listStudentSubmissions({
    actor: req.user,
    limit: req.validated.query.limit,
    cursor: req.validated.query.cursor,
  }).then((page) => ({ ...page, items: page.items.map(presentSubmission) })))),
  getSubmission: wrap(async (req, res) => sendOk(res, presentSubmission(await assignmentService.getSubmission({
    actor: req.user,
    submissionId: req.validated.params.submissionId,
  })))),
  preflightReplacement: preflight((req) => assignmentService.authorizeReplacement({
    actor: req.user,
    submissionId: req.validated.params.submissionId,
  })),
  replaceFile: wrap(async (req, res) => sendOk(res, presentSubmission(await assignmentService.replaceSubmissionFile({
    actor: req.user,
    submissionId: req.validated.params.submissionId,
    file: req.assignmentFile,
  })))),
  getAttachmentFile: wrap(async (req, res) => {
    const file = await assignmentService.getAssignmentAttachment({
      actor: req.user,
      assignmentId: req.validated.params.assignmentId,
      fileId: req.validated.params.fileId,
    });
    return downloadFile(res, file);
  }),
  getSubmissionFile: wrap(async (req, res) => {
    const submission = await assignmentService.canAccessSubmissionFile({
      actor: req.user,
      submissionId: req.validated.params.submissionId,
    });
    return downloadFile(res, submission.file);
  }),
  getUploadPolicy: wrap(async (req, res) => {
    const policy = await assignmentService.getUploadPolicy();
    return sendOk(res, {
      attachmentMaxBytes: policy.attachmentMaxBytes,
      submissionMaxBytes: policy.submissionMaxBytes,
      hardLimitBytes: policy.hardLimitBytes,
    });
  }),
  updateUploadPolicy: wrap(async (req, res) => {
    const policy = await assignmentService.updateUploadLimits({ actor: req.user, ...req.validated.body });
    return sendOk(res, {
      attachmentMaxBytes: policy.attachmentMaxBytes,
      submissionMaxBytes: policy.submissionMaxBytes,
    });
  }),
};