const ApiError = require('../utils/ApiError');

const validationDetails = (errors) => Object.values(errors).map((error) => ({
  field: error.path,
  message: error.message,
}));

const normalizeError = (error) => {
  if (error instanceof ApiError) return error;

  if (error?.name === 'ZodError') {
    return new ApiError(400, 'Request validation failed', {
      code: 'VALIDATION_ERROR',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error?.name === 'ValidationError' && error.errors) {
    return new ApiError(400, 'Request validation failed', {
      code: 'VALIDATION_ERROR',
      details: validationDetails(error.errors),
    });
  }

  if (error?.name === 'CastError') {
    return new ApiError(400, 'Request contains an invalid value', {
      code: 'INVALID_VALUE',
      details: [{ field: error.path, message: 'Invalid value' }],
    });
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return new ApiError(409, 'A record with these details already exists', {
      code: 'RESOURCE_CONFLICT',
      details: field ? [{ field, message: 'Must be unique' }] : [],
    });
  }

  if (error?.type === 'entity.parse.failed') {
    return new ApiError(400, 'Request body contains invalid JSON', { code: 'INVALID_JSON' });
  }

  if (error?.type === 'entity.too.large') {
    return new ApiError(413, 'Request body is too large', { code: 'PAYLOAD_TOO_LARGE' });
  }

  return null;
};

const sendError = (error, req, res) => {
  const normalizedError = normalizeError(error);
  const isExpected = Boolean(normalizedError);
  const responseError = normalizedError || new ApiError(
    500,
    'Internal server error',
    { code: 'INTERNAL_SERVER_ERROR' }
  );

  if (!isExpected) {
    console.error(JSON.stringify({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      errorName: error?.name || 'Error',
      stack: error?.stack?.split('\n').slice(1).join('\n'),
    }));
  }

  return res.status(responseError.statusCode).json({
    success: false,
    message: responseError.message,
    error: {
      code: responseError.code,
      message: responseError.message,
      details: responseError.details,
      requestId: req.requestId,
    },
  });
};

const notFoundHandler = (req, res, next) => next(new ApiError(404, 'Route not found', { code: 'ROUTE_NOT_FOUND' }));

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  return sendError(error, req, res);
};

module.exports = { errorHandler, normalizeError, notFoundHandler, sendError };