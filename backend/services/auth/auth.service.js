
const crypto = require('crypto');
const mongoose = require('mongoose');

const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const User = require('../../models/user/User');
const UserSession = require('../../models/user/UserSession');
const {
  hashPassword,
  verifyPassword,
} = require('./password.service');
const {
  createAccessToken,
  createOpaqueToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} = require('./token.service');
const {
  validateCredentials,
  validatePasswordReset,
  validateRegistration,
} = require('../../validators/auth/auth.validator');

const normalizeEmail = (email) => email.trim().toLowerCase();

const sanitizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
});

const issueTokens = async (user) => {
  const session = new UserSession({
    _id: new mongoose.Types.ObjectId(),
    user: user._id,
    refreshTokenHash: 'pending',
    expiresAt: new Date(Date.now() + env.refreshTokenTtlMs),
  });

  const refreshToken = createRefreshToken(user, session._id.toString());
  const accessToken = createAccessToken(user, session._id.toString());

  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  return {
    accessToken,
    refreshToken,
  };
};

const registerPublicUser = async (payload) => {
  validateRegistration(payload);

  const email = normalizeEmail(payload.email);
  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    fullName: payload.fullName.trim(),
    email,
    phone: payload.phone?.trim(),
    passwordHash: await hashPassword(payload.password),
    role: 'PUBLIC_USER',
    status: 'ACTIVE',
  });

  const tokens = await issueTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const login = async (payload) => {
  validateCredentials(payload);

  const email = normalizeEmail(payload.email);
  const user = await User.findOne({ email }).select('+passwordHash');
  const invalidCredentialsError = new ApiError(401, 'Invalid email or password');

  if (!user || !(await verifyPassword(user.passwordHash, payload.password))) {
    throw invalidCredentialsError;
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'This account is disabled');
  }

  const tokens = await issueTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const session = await UserSession.findOne({
    _id: payload.sid,
    user: payload.sub,
    revokedAt: null,
  });

  if (!session || session.expiresAt <= new Date() || session.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(403, 'This account is disabled');
  }

  session.revokedAt = new Date();
  await session.save();

  return {
    user: sanitizeUser(user),
    ...(await issueTokens(user)),
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    await UserSession.findOneAndUpdate(
      {
        _id: payload.sid,
        user: payload.sub,
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      { revokedAt: new Date() }
    );
  } catch (error) {
    // Logout is intentionally idempotent.
  }
};

const forgotPassword = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const user = normalizedEmail ? await User.findOne({ email: normalizedEmail }) : null;
  const response = {
    message: 'If an account exists, password reset instructions have been requested',
  };

  if (!user) {
    return response;
  }

  const resetToken = createOpaqueToken();
  user.resetPasswordTokenHash = hashToken(resetToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + env.passwordResetTtlMs);
  await user.save();

  if (env.nodeEnv !== 'production') {
    response.resetToken = resetToken;
  }

  return response;
};

const resetPassword = async (payload) => {
  validatePasswordReset(payload);

  if (!payload.token) {
    throw new ApiError(400, 'Password reset token is required');
  }

  const user = await User.findOne({
    resetPasswordTokenHash: hashToken(payload.token),
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpiresAt +passwordHash');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  user.passwordHash = await hashPassword(payload.password);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();
  await UserSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });

  return { message: 'Password updated successfully' };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'User account is not available');
  }

  return { user: sanitizeUser(user) };
};

module.exports = {
  registerPublicUser,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
