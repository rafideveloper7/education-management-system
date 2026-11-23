const multer = require('multer');
const ApiError = require('../utils/ApiError');

const receive = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 20,
  },
});

const upload = {
  single: (fieldName) => receive.single(fieldName),
};

const handleUploadError = (handler) => (req, res, next) => {
  handler(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(413, 'Uploaded file exceeds the configured limit', {
        code: 'UPLOAD_LIMIT_EXCEEDED',
      }));
    }
    return next(new ApiError(400, 'Upload must contain exactly one supported file field', {
      code: 'INVALID_MULTIPART_REQUEST',
    }));
  });
};

upload.single = (fieldName) => handleUploadError(receive.single(fieldName));

module.exports = { upload };
