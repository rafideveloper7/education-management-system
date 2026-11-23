const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');
const assignmentService = require('../services/assignment/assignment.service');

const ALLOWED_FILE_EXTENSIONS = Object.freeze({
  'application/pdf': ['pdf'],
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
});

const sanitizeFilename = (originalName) => path.basename(originalName || 'upload')
  .replace(/[\u0000-\u001f\u007f]/g, '')
  .trim()
  .slice(0, 255) || 'upload';

const createAssignmentUploadMiddleware = ({ getUploadPolicy = assignmentService.getUploadPolicy } = {}) => {
  const receiveAssignmentFile = (purpose) => async (req, res, next) => {
  try {
    const policy = await getUploadPolicy();
    const limit = purpose === 'attachment' ? policy.attachmentMaxBytes : policy.submissionMaxBytes;
    const receive = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: Math.min(limit, policy.hardLimitBytes), files: 1, fields: 0, parts: 1 },
    }).single('file');

    receive(req, res, async (parseError) => {
      if (parseError) {
        const tooLarge = parseError.code === 'LIMIT_FILE_SIZE';
        return next(new ApiError(tooLarge ? 413 : 400,
          tooLarge ? 'File exceeds the configured upload limit' : 'Upload must contain exactly one file field named file', {
            code: tooLarge ? 'UPLOAD_LIMIT_EXCEEDED' : 'INVALID_MULTIPART_REQUEST',
          }));
      }
      if (!req.file) return next();

      try {
        const { fileTypeFromBuffer } = await import('file-type');
        const detected = await fileTypeFromBuffer(req.file.buffer);
        const allowedExtensions = ALLOWED_FILE_EXTENSIONS[detected?.mime];
        const extension = path.extname(req.file.originalname).slice(1).toLowerCase();
        if (!allowedExtensions || !allowedExtensions.includes(extension)) {
          return next(new ApiError(415, 'Only valid PDF, PNG, and JPEG files are supported', {
            code: 'UNSUPPORTED_FILE_TYPE',
          }));
        }
        req.assignmentFile = {
          buffer: req.file.buffer,
          format: detected.ext,
          mimeType: detected.mime,
          originalName: sanitizeFilename(req.file.originalname),
          sizeBytes: req.file.size,
        };
        return next();
      } catch (error) {
        return next(error instanceof ApiError ? error : new ApiError(415, 'File content could not be validated', {
          code: 'INVALID_FILE_CONTENT',
        }));
      }
    });
  } catch (error) {
    return next(error);
  }
};

  return { receiveAssignmentFile };
};

module.exports = {
  ...createAssignmentUploadMiddleware(),
  createAssignmentUploadMiddleware,
  ALLOWED_FILE_EXTENSIONS,
  sanitizeFilename,
};