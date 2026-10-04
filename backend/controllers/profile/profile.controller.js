const profileService = require('../../services/profile/profile.service');
const ApiError = require('../../utils/ApiError');

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.sub, req.user.role);

    if (!profile) {
      throw new ApiError(404, 'Profile not found', { code: 'PROFILE_NOT_FOUND' });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

const patchProfile = async (req, res, next) => {
  try {
    const profile = await profileService.upsertProfile({
      userId: req.user.sub,
      role: req.user.role,
      data: req.validated.body,
    });

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

const replaceProfile = async (req, res, next) => {
  try {
    const profile = await profileService.replaceProfile({
      userId: req.user.sub,
      role: req.user.role,
      data: req.validated.body,
    });

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  patchProfile,
  replaceProfile,
};
