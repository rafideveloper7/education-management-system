const ApiError = require('../../utils/ApiError');

const requireResourceAccess = ({ resolveContext, policy }) => {
  if (typeof resolveContext !== 'function' || typeof policy !== 'function') {
    throw new TypeError('resolveContext and policy must be functions');
  }

  return async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    try {
      const context = await resolveContext(req);
      if (!context) {
        return next(new ApiError(404, 'Resource not found'));
      }

      if (!await policy({ ...context, user: req.user })) {
        return next(new ApiError(403, 'You do not have access to this resource'));
      }

      req.authorization = context;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = { requireResourceAccess };