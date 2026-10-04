const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { errorHandler, notFoundHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const authRoutes = require('../routes/public/auth.routes');
const profileRoutes = require('../routes/profile/profile.routes');
const relationshipRoutes = require('../routes/admin/relationships.routes');
const { createAccessToken } = require('../services/auth/token.service');
const ApiError = require('../utils/ApiError');

const createApp = (route) => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  route(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

const withServer = async (app, run) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

test('application errors use a stable response envelope and request id', async () => {
  const app = createApp((server) => server.get('/expected-error', (req, res, next) => {
    next(new ApiError(409, 'Already exists', { code: 'RESOURCE_EXISTS' }));
  }));

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/expected-error`);
    const body = await response.json();

    assert.equal(response.status, 409);
    assert.match(response.headers.get('x-request-id'), /^[\da-f-]{36}$/i);
    assert.deepEqual(body, {
      success: false,
      message: 'Already exists',
      error: {
        code: 'RESOURCE_EXISTS',
        message: 'Already exists',
        details: [],
        requestId: response.headers.get('x-request-id'),
      },
    });
  });
});

test('malformed JSON receives a safe client error', async () => {
  const app = createApp((server) => server.post('/payload', (req, res) => res.sendStatus(204)));

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/payload`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'INVALID_JSON');
    assert.equal(body.error.message, 'Request body contains invalid JSON');
  });
});

test('unknown routes and unexpected failures are safe and traceable', async () => {
  const originalConsoleError = console.error;
  const loggedErrors = [];
  console.error = (message) => loggedErrors.push(JSON.parse(message));
  const app = createApp((server) => {
    server.get('/unexpected', () => { throw new Error('private database detail'); });
  });

  try {
    await withServer(app, async (baseUrl) => {
      const missing = await fetch(`${baseUrl}/missing`);
      const missingBody = await missing.json();
      assert.equal(missing.status, 404);
      assert.equal(missingBody.error.code, 'ROUTE_NOT_FOUND');

      const failed = await fetch(`${baseUrl}/unexpected`);
      const failedBody = await failed.json();
      assert.equal(failed.status, 500);
      assert.equal(failedBody.message, 'Internal server error');
      assert.equal(failedBody.error.code, 'INTERNAL_SERVER_ERROR');
      assert.equal(failedBody.error.message, 'Internal server error');
      assert.equal(JSON.stringify(failedBody).includes('private database detail'), false);
      assert.equal(loggedErrors.length, 1);
      assert.equal(loggedErrors[0].requestId, failedBody.error.requestId);
    });
  } finally {
    console.error = originalConsoleError;
  }
});

test('invalid authentication payloads are rejected at the request boundary', async () => {
  const app = createApp((server) => server.use('/api/v1/auth', authRoutes));

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short', role: 'ADMIN' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.deepEqual(body.error.details.map(({ field }) => field).sort(), ['email', 'password', 'role'].sort());
  });
});

test('profile and relationship payloads reject unknown fields before service execution', async () => {
  const app = createApp((server) => {
    server.use('/api/v1/profile', profileRoutes);
    server.use('/api/v1/admin/relationships', relationshipRoutes);
  });
  const userId = '64b000000000000000000091';
  const publicUserToken = createAccessToken({
    _id: { toString: () => userId },
    role: 'PUBLIC_USER',
  }, 'group-eight-validation-session');
  const adminToken = createAccessToken({
    _id: { toString: () => '64b000000000000000000092' },
    role: 'ADMIN',
  }, 'group-eight-validation-admin-session');

  await withServer(app, async (baseUrl) => {
    const profileResponse = await fetch(`${baseUrl}/api/v1/profile/me`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${publicUserToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ fullName: 'Valid Name', userId: '64b000000000000000000093' }),
    });
    const profileBody = await profileResponse.json();
    assert.equal(profileResponse.status, 400);
    assert.equal(profileBody.error.code, 'VALIDATION_ERROR');
    assert.equal(profileBody.error.details[0].field, 'userId');

    const relationshipResponse = await fetch(`${baseUrl}/api/v1/admin/relationships/teacher-assignments`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ teacherUserId: 'invalid', role: 'ADMIN' }),
    });
    const relationshipBody = await relationshipResponse.json();
    assert.equal(relationshipResponse.status, 400);
    assert.equal(relationshipBody.error.code, 'VALIDATION_ERROR');
    assert.ok(relationshipBody.error.details.length >= 2);
  });
});

test('database validation, cast, and duplicate-key errors map to safe client errors', async () => {
  const app = createApp((server) => {
    server.get('/mongoose-validation', (req, res, next) => {
      const error = new Error('raw validation details');
      error.name = 'ValidationError';
      error.errors = {
        email: { path: 'email', message: 'Path `email` is required' },
      };
      next(error);
    });
    server.get('/mongoose-cast', (req, res, next) => {
      const error = new Error('raw cast details');
      error.name = 'CastError';
      error.path = 'studentId';
      next(error);
    });
    server.get('/duplicate-key', (req, res, next) => {
      const error = new Error('raw database index details');
      error.code = 11000;
      error.keyPattern = { email: 1 };
      next(error);
    });
  });

  await withServer(app, async (baseUrl) => {
    const validation = await fetch(`${baseUrl}/mongoose-validation`);
    const validationBody = await validation.json();
    assert.equal(validation.status, 400);
    assert.equal(validationBody.error.code, 'VALIDATION_ERROR');
    assert.equal(validationBody.error.details[0].field, 'email');

    const cast = await fetch(`${baseUrl}/mongoose-cast`);
    const castBody = await cast.json();
    assert.equal(cast.status, 400);
    assert.equal(castBody.error.code, 'INVALID_VALUE');
    assert.equal(castBody.error.details[0].field, 'studentId');

    const duplicate = await fetch(`${baseUrl}/duplicate-key`);
    const duplicateBody = await duplicate.json();
    assert.equal(duplicate.status, 409);
    assert.equal(duplicateBody.error.code, 'RESOURCE_CONFLICT');
    assert.equal(duplicateBody.error.details[0].field, 'email');
    assert.equal(JSON.stringify(duplicateBody).includes('raw database index details'), false);
  });
});