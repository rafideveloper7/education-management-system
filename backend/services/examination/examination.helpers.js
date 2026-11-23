const mongoose = require('mongoose');
const ApiError = require('../../utils/ApiError');
const { hasPermission } = require('../../authorization/services/permission.service');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const requireObjectId = (value, field) => {
  if (!OBJECT_ID_PATTERN.test(String(value || ''))) {
    throw new ApiError(400, `${field} must be a valid ObjectId`, { code: 'INVALID_OBJECT_ID' });
  }
};

const assertPermission = (actor, permission) => {
  if (!hasPermission(actor, permission)) {
    throw new ApiError(403, 'You do not have permission to perform this action');
  }
};

const encodeCursor = (record) => Buffer.from(JSON.stringify({
  version: 1,
  createdAt: new Date(record.createdAt).toISOString(),
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(payload.createdAt);
    if (payload.version !== 1 || !OBJECT_ID_PATTERN.test(payload.id) || Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor payload');
    }
    return { createdAt, id: payload.id };
  } catch (error) {
    throw new ApiError(400, 'cursor must be a valid examination cursor', { code: 'INVALID_CURSOR' });
  }
};

const runInTransaction = async (operation) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const acquireWriteLock = async ({ Model, filter, field, session, message, code }) => {
  if (!session) return null;
  const record = await Model.findOneAndUpdate(
    filter,
    { $inc: { [field]: 1 } },
    { new: true, session },
  );
  if (!record) throw new ApiError(404, message, { code });
  return record;
};

const roundPercentage = (value) => Number(value.toFixed(2));

const validateGradeBands = (inputBands) => {
  if (!Array.isArray(inputBands) || inputBands.length === 0) {
    throw new ApiError(400, 'At least one grade band is required', { code: 'INVALID_GRADE_SCALE' });
  }
  const bands = [...inputBands].sort((left, right) => left.minimumPercentage - right.minimumPercentage);
  if (bands[0].minimumPercentage !== 0 || bands[bands.length - 1].maximumPercentage !== 100) {
    throw new ApiError(400, 'Grade bands must cover the full 0 to 100 percentage range', {
      code: 'INVALID_GRADE_SCALE',
    });
  }
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    if (band.minimumPercentage >= band.maximumPercentage
      || (index > 0 && bands[index - 1].maximumPercentage !== band.minimumPercentage)) {
      throw new ApiError(400, 'Grade bands must be ordered, contiguous, and non-overlapping', {
        code: 'INVALID_GRADE_SCALE',
      });
    }
  }
  const labels = bands.map(({ grade }) => grade.toLocaleLowerCase());
  if (new Set(labels).size !== labels.length) {
    throw new ApiError(400, 'Grade labels must be unique', { code: 'INVALID_GRADE_SCALE' });
  }
  return bands;
};

const gradeForPercentage = (percentage, bands) => {
  const gradeBand = bands.find((band, index) => (
    percentage >= band.minimumPercentage
    && (percentage < band.maximumPercentage || index === bands.length - 1)
  ));
  if (!gradeBand) {
    throw new ApiError(409, 'No configured grade matches the calculated percentage', {
      code: 'GRADE_SCALE_COVERAGE_ERROR',
    });
  }
  return gradeBand;
};

const hasDateCoverage = (record, startAt, endAt) => (
  record.validFrom <= endAt && (!record.validTo || record.validTo >= startAt)
);

const occursWithinDateRange = (startDate, endDate, startAt, endAt) => {
  const startKey = new Date(startDate).toISOString().slice(0, 10);
  const endKey = new Date(endDate).toISOString().slice(0, 10);
  return startAt.toISOString().slice(0, 10) >= startKey
    && endAt.toISOString().slice(0, 10) <= endKey;
};

module.exports = {
  OBJECT_ID_PATTERN,
  requireObjectId,
  assertPermission,
  encodeCursor,
  decodeCursor,
  runInTransaction,
  acquireWriteLock,
  roundPercentage,
  validateGradeBands,
  gradeForPercentage,
  hasDateCoverage,
  occursWithinDateRange,
};
