const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const env = require('../../config/env');

const createOpaqueToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createAccessToken = (user, sessionId) => jwt.sign(
  { role: user.role, sid: sessionId },
  env.jwtAccessSecret,
  { subject: user._id.toString(), expiresIn: env.accessTokenExpiresIn }
);

const createRefreshToken = (user, sessionId) => jwt.sign(
  { sid: sessionId },
  env.jwtRefreshSecret,
  { subject: user._id.toString(), expiresIn: '30d' }
);

const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);

module.exports = {
  createOpaqueToken,
  hashToken,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
