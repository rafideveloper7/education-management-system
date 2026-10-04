const ApiError = require('../utils/ApiError');

const validateRequest = (schemas) => (req, res, next) => {
  req.validated = req.validated || {};

  for (const [source, schemaOrFactory] of Object.entries(schemas)) {
    const schema = typeof schemaOrFactory === 'function'
      ? schemaOrFactory(req)
      : schemaOrFactory;
    if (!schema || typeof schema.safeParse !== 'function') {
      return next(new ApiError(403, 'This request is not available for the account role', {
        code: 'OPERATION_NOT_ALLOWED',
      }));
    }
    const result = schema.safeParse(req[source] || {});

    if (!result.success) {
      const details = result.error.issues.flatMap((issue) => {
        if (issue.code === 'unrecognized_keys') {
          return issue.keys.map((field) => ({ field, message: 'Unrecognized field' }));
        }

        return [{
          field: issue.path.join('.') || source,
          message: issue.message,
        }];
      });

      return next(new ApiError(400, 'Request validation failed', {
        code: 'VALIDATION_ERROR',
        details,
      }));
    }

    req.validated[source] = result.data;
  }

  return next();
};

module.exports = { validateRequest };