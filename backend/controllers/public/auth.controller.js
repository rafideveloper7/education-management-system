const authService = require('../../services/auth/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerPublicUser(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user.sub);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
};
