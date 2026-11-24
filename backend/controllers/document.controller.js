const { pipeline } = require('stream/promises');
const { createDocumentService } = require('../services/document.service');

const documents = createDocumentService();

const sendOk = (res, data, status = 200) => res.status(status).json({ success: true, data });
const sendPage = (res, page) => res.status(200).json({
  success: true,
  data: page.items,
  pagination: page.pagination,
});
const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};

const streamDocument = (res, file) => {
  res.set({
    'Content-Type': file.mimeType,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  });
  if (file.contentLength) res.set('Content-Length', file.contentLength);
  res.status(200);
  return pipeline(file.body, res);
};

module.exports = {
  upload: wrap(async (req, res) => sendOk(res, await documents.upload({
    actor: req.user,
    ...req.validated.body,
    file: req.documentFile,
  }), 201)),
  list: wrap(async (req, res) => sendPage(res, await documents.list({
    actor: req.user,
    filters: req.validated.query,
  }))),
  getById: wrap(async (req, res) => sendOk(res, await documents.getById({
    actor: req.user,
    documentId: req.validated.params.documentId,
  }))),
  download: wrap(async (req, res) => streamDocument(res, await documents.download({
    actor: req.user,
    documentId: req.validated.params.documentId,
  }))),
  archive: wrap(async (req, res) => sendOk(res, await documents.archive({
    actor: req.user,
    documentId: req.validated.params.documentId,
  }))),
  listAdmission: wrap(async (req, res) => sendPage(res, await documents.listAdmissionDocuments({
    actor: req.user,
    filters: req.validated.query,
  }))),
  downloadAdmission: wrap(async (req, res) => streamDocument(res, await documents.downloadAdmissionDocument({
    actor: req.user,
    documentId: req.validated.params.documentId,
  }))),
  listAssignment: wrap(async (req, res) => sendPage(res, await documents.listAssignmentDocuments({
    actor: req.user,
    filters: req.validated.query,
  }))),
  downloadAssignmentAttachment: wrap(async (req, res) => streamDocument(res, await documents.downloadAssignmentAttachment({
    actor: req.user,
    ...req.validated.params,
  }))),
  downloadAssignmentSubmission: wrap(async (req, res) => streamDocument(res, await documents.downloadAssignmentSubmission({
    actor: req.user,
    ...req.validated.params,
  }))),
};
