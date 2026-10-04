const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
});

const requiredEnv = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const nodeEnv = process.env.NODE_ENV || 'development';
const clientOrigins = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

if (nodeEnv === 'production' && clientOrigins.length === 0) {
  throw new Error('CLIENT_ORIGINS must be configured in production');
}

const invalidClientOrigins = clientOrigins.filter((origin) => {
  try {
    const url = new URL(origin);
    return !['http:', 'https:'].includes(url.protocol) || url.origin !== origin;
  } catch (error) {
    return true;
  }
});

if (invalidClientOrigins.length) {
  throw new Error('CLIENT_ORIGINS must contain valid HTTP(S) origins without paths');
}

const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  clientOrigins,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenTtlMs: 1000 * 60 * 60 * 24 * 30,
  passwordResetTtlMs: 1000 * 60 * 15,
};

module.exports = env;
