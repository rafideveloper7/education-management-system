const { rateLimit } = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const createRateLimiter = ({ windowMs, limit }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(new ApiError(
    429,
    'Too many requests. Please try again later.'
  )),
});

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

const passwordRecoveryRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

module.exports = {
  createRateLimiter,
  loginRateLimiter,
  registrationRateLimiter,
  passwordRecoveryRateLimiter,
};
