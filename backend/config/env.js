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
const academicTimeZone = process.env.ACADEMIC_TIME_ZONE || 'UTC';
try {
  new Intl.DateTimeFormat('en-US', { timeZone: academicTimeZone });
} catch (error) {
  throw new Error('ACADEMIC_TIME_ZONE must be a valid IANA time zone');
}
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
  academicTimeZone,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenTtlMs: 1000 * 60 * 60 * 24 * 30,
  passwordResetTtlMs: 1000 * 60 * 15,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  // Group 14 — Easypaisa payment provider (Section 26)
  // Set EASYPAISA_ENABLED=true and provide credentials to activate.
  // Credentials must NEVER be committed to version control.
  EASYPAISA_STORE_ID: process.env.EASYPAISA_STORE_ID || '',
  EASYPAISA_HASH_KEY: process.env.EASYPAISA_HASH_KEY || '',
  EASYPAISA_ENABLED: process.env.EASYPAISA_ENABLED || 'false',
  EASYPAISA_ENV: process.env.EASYPAISA_ENV || 'sandbox', // 'sandbox' | 'production'
  redisUrl: process.env.REDIS_URL || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || '',
};

module.exports = env;
