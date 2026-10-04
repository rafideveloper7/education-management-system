const { verifyAccessToken } = require('../services/auth/token.service');
const ApiError = require('../utils/ApiError');

const authenticate = (req, res, next) => {
  try {
    const authorization = req.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Authentication required'));
    }

    req.user = verifyAccessToken(authorization.slice(7));
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
};
