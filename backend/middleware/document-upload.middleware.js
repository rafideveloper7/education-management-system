const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');
const { sanitizeDocumentName } = require('../utils/sanitizeDocumentName');

const CENTRAL_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = Object.freeze({
  'application/pdf': ['pdf'],
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
});

const receive = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CENTRAL_DOCUMENT_MAX_BYTES,
    files: 1,
    fields: 20,
    parts: 21,
  },
}).single('file');

const receiveDocument = (req, res, next) => {
  receive(req, res, async (parseError) => {
    if (parseError) {
      if (parseError.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(413, 'Central document exceeds the 10 MB limit', {
          code: 'DOCUMENT_LIMIT_EXCEEDED',
        }));
      }
      return next(new ApiError(400, 'Upload must contain exactly one file field named file', {
        code: 'INVALID_MULTIPART_REQUEST',
      }));
    }
    if (!req.file) {
      return next(new ApiError(400, 'A document file is required', { code: 'FILE_REQUIRED' }));
    }
    if (req.file.size === 0) {
      return next(new ApiError(415, 'Empty files are not allowed', { code: 'EMPTY_FILE' }));
    }

    try {
      const { fileTypeFromBuffer } = await import('file-type');
      const detected = await fileTypeFromBuffer(req.file.buffer);
      if (!detected) throw new Error('File content could not be identified');
      const allowedExtensions = ALLOWED_DOCUMENT_TYPES[detected.mime];
      const extension = path.extname(req.file.originalname).slice(1).toLowerCase();
      if (!allowedExtensions || !allowedExtensions.includes(extension)) {
        return next(new ApiError(415, 'Unsupported document type or MIME/extension mismatch', {
          code: 'UNSUPPORTED_DOCUMENT_TYPE',
        }));
      }
      let originalName;
      try {
        originalName = sanitizeDocumentName(req.file.originalname);
      } catch (error) {
        return next(new ApiError(400, error.message, { code: 'INVALID_DOCUMENT_FILENAME' }));
      }
      req.documentFile = {
        buffer: req.file.buffer,
        format: detected.ext,
        mimeType: detected.mime,
        originalName,
        sizeBytes: req.file.size,
      };
      return next();
    } catch (error) {
      return next(error instanceof ApiError ? error : new ApiError(415, 'File content could not be validated', {
        code: 'INVALID_FILE_CONTENT',
      }));
    }
  });
};

module.exports = {
  receiveDocument,
  CENTRAL_DOCUMENT_MAX_BYTES,
  ALLOWED_DOCUMENT_TYPES,
};
