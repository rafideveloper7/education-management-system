const mongoose = require('mongoose');

const User = require('../../models/user/User');
const AdminProfile = require('../../models/profile/AdminProfile');
const TeacherProfile = require('../../models/profile/TeacherProfile');
const StudentProfile = require('../../models/profile/StudentProfile');
const ParentProfile = require('../../models/profile/ParentProfile');
const PublicUserProfile = require('../../models/profile/PublicUserProfile');
const ApiError = require('../../utils/ApiError');

const PROFILE_MODELS = {
  ADMIN: AdminProfile,
  TEACHER: TeacherProfile,
  STUDENT: StudentProfile,
  PARENT: ParentProfile,
  PUBLIC_USER: PublicUserProfile,
};

const getProfileModel = (role) => {
  if (!PROFILE_MODELS[role]) {
    throw new ApiError(403, 'This account cannot access a profile resource', { code: 'PROFILE_ACCESS_DENIED' });
  }

  return PROFILE_MODELS[role];
};

const getProfileByUserId = async (userId, role) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const model = getProfileModel(role || user.role);
  return model.findOne({ userId });
};

const upsertProfile = async ({ userId, role, data }) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid userId', { code: 'INVALID_USER_ID' });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found', { code: 'USER_NOT_FOUND' });
  }

  const finalRole = role || user.role;
  const model = getProfileModel(finalRole);
  const update = {
    $set: { ...data, userId },
    $setOnInsert: {},
  };

  if (!data.fullName) {
    update.$setOnInsert.fullName = user.fullName;
  }

  if (Object.keys(update.$setOnInsert).length === 0) {
    delete update.$setOnInsert;
  }

  const profile = await model.findOneAndUpdate(
    { userId },
    update,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  return profile;
};

const replaceProfile = async ({ userId, role, data }) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid userId', { code: 'INVALID_USER_ID' });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found', { code: 'USER_NOT_FOUND' });
  }

  const finalRole = role || user.role;
  const model = getProfileModel(finalRole);
  const replacement = new model({ ...data, userId });
  try {
    await replacement.validate();
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }

  const replacementData = replacement.toObject();
  const protectedPaths = new Set(['_id', 'userId', 'createdAt', 'updatedAt', '__v']);
  const update = { $set: { userId: replacement.userId }, $unset: {} };

  for (const path of Object.keys(model.schema.paths)) {
    if (protectedPaths.has(path)) continue;

    if (Object.prototype.hasOwnProperty.call(replacementData, path)) {
      update.$set[path] = replacementData[path];
    } else {
      update.$unset[path] = 1;
    }
  }

  if (Object.keys(update.$unset).length === 0) delete update.$unset;

  return model.findOneAndUpdate(
    { userId },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
};

module.exports = {
  getProfileModel,
  getProfileByUserId,
  upsertProfile,
  replaceProfile,
};
