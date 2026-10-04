const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const User = require('../models/user/User');
const PublicUserProfile = require('../models/profile/PublicUserProfile');
const StudentProfile = require('../models/profile/StudentProfile');
const profileService = require('../services/profile/profile.service');

test('profile upsert always binds the profile to the authenticated user', async () => {
  const authenticatedUserId = new mongoose.Types.ObjectId().toString();
  const injectedUserId = new mongoose.Types.ObjectId().toString();
  const originalFindById = User.findById;
  const originalFindOneAndUpdate = PublicUserProfile.findOneAndUpdate;
  let capturedFilter;
  let capturedUpdate;

  User.findById = async () => ({ role: 'PUBLIC_USER' });
  PublicUserProfile.findOneAndUpdate = async (filter, update) => {
    capturedFilter = filter;
    capturedUpdate = update;
    return update.$set;
  };

  try {
    await profileService.upsertProfile({
      userId: authenticatedUserId,
      role: 'PUBLIC_USER',
      data: {
        userId: injectedUserId,
        fullName: 'Test User',
      },
    });

    assert.equal(capturedFilter.userId, authenticatedUserId);
    assert.equal(capturedUpdate.$set.userId, authenticatedUserId);
  } finally {
    User.findById = originalFindById;
    PublicUserProfile.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('first profile PATCH supplies the required name only on insert', async () => {
  const authenticatedUserId = new mongoose.Types.ObjectId().toString();
  const originalFindById = User.findById;
  const originalFindOneAndUpdate = PublicUserProfile.findOneAndUpdate;
  let capturedUpdate;

  User.findById = async () => ({ role: 'PUBLIC_USER', fullName: 'Account Name' });
  PublicUserProfile.findOneAndUpdate = async (filter, update) => {
    capturedUpdate = update;
    return update;
  };

  try {
    await profileService.upsertProfile({
      userId: authenticatedUserId,
      role: 'PUBLIC_USER',
      data: { phone: '03001234567' },
    });

    assert.equal(capturedUpdate.$setOnInsert.fullName, 'Account Name');
    assert.equal(capturedUpdate.$set.fullName, undefined);
    assert.equal(capturedUpdate.$set.phone, '03001234567');
  } finally {
    User.findById = originalFindById;
    PublicUserProfile.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('profile replacement clears omitted optional fields and keeps authenticated ownership', async () => {
  const authenticatedUserId = new mongoose.Types.ObjectId().toString();
  const injectedUserId = new mongoose.Types.ObjectId().toString();
  const originalFindById = User.findById;
  const originalFindOneAndUpdate = StudentProfile.findOneAndUpdate;
  let capturedFilter;
  let capturedUpdate;

  User.findById = async () => ({ role: 'STUDENT' });
  StudentProfile.findOneAndUpdate = async (filter, update) => {
    capturedFilter = filter;
    capturedUpdate = update;
    return update;
  };

  try {
    await profileService.replaceProfile({
      userId: authenticatedUserId,
      role: 'STUDENT',
      data: {
        userId: injectedUserId,
        fullName: 'Test Student',
      },
    });

    assert.equal(capturedFilter.userId, authenticatedUserId);
    assert.equal(String(capturedUpdate.$set.userId), authenticatedUserId);
    assert.equal(capturedUpdate.$set.fullName, 'Test Student');
    assert.equal(capturedUpdate.$unset.address, 1);
    assert.equal(capturedUpdate.$unset.rollNo, 1);
  } finally {
    User.findById = originalFindById;
    StudentProfile.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('profile replacement rejects a document missing required fields', async () => {
  const authenticatedUserId = new mongoose.Types.ObjectId().toString();
  const originalFindById = User.findById;
  User.findById = async () => ({ role: 'STUDENT' });

  try {
    await assert.rejects(
      profileService.replaceProfile({
        userId: authenticatedUserId,
        role: 'STUDENT',
        data: {},
      }),
      { statusCode: 400 }
    );
  } finally {
    User.findById = originalFindById;
  }
});

test('public profile replacement unsets an omitted phone number', async () => {
  const authenticatedUserId = new mongoose.Types.ObjectId().toString();
  const originalFindById = User.findById;
  const originalFindOneAndUpdate = PublicUserProfile.findOneAndUpdate;
  let capturedUpdate;

  User.findById = async () => ({ role: 'PUBLIC_USER' });
  PublicUserProfile.findOneAndUpdate = async (filter, update) => {
    capturedUpdate = update;
    return update;
  };

  try {
    await profileService.replaceProfile({
      userId: authenticatedUserId,
      role: 'PUBLIC_USER',
      data: { fullName: 'Test Parent Updated' },
    });

    assert.equal(capturedUpdate.$unset.phone, 1);
  } finally {
    User.findById = originalFindById;
    PublicUserProfile.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
