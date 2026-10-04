const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { createCorsOptions } = require('../config/cors');
const { createRateLimiter } = require('../middleware/rateLimit.middleware');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');

const resolveOrigin = (options, origin) => new Promise((resolve, reject) => {
  options.origin(origin, (error, allowed) => {
    if (error) return reject(error);
    return resolve(allowed);
  });
});

test('CORS permits configured production origins and rejects unknown origins', async () => {
  const options = createCorsOptions({
    nodeEnv: 'production',
    clientOrigins: ['https://eduos.example.com'],
  });

  assert.equal(await resolveOrigin(options, 'https://eduos.example.com'), true);
  assert.equal(await resolveOrigin(options, 'https://untrusted.example.com'), false);
  assert.equal(await resolveOrigin(options, undefined), true);
});

test('development CORS remains usable when no origin allowlist is configured', async () => {
  const options = createCorsOptions({ nodeEnv: 'development', clientOrigins: [] });

  assert.equal(await resolveOrigin(options, 'http://localhost:5500'), true);
});

test('rate limiter returns 429 after the configured request limit', async () => {
  const app = express();
  app.use(attachRequestId);
  app.post('/login', createRateLimiter({ windowMs: 60_000, limit: 1 }), (req, res) => {
    res.sendStatus(200);
  });
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const url = `http://127.0.0.1:${server.address().port}/login`;
    const allowed = await fetch(url, { method: 'POST' });
    const limited = await fetch(url, { method: 'POST' });

    assert.equal(allowed.status, 200);
    assert.equal(limited.status, 429);
    const body = await limited.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'RATE_LIMITED');
    assert.equal(body.error.message, 'Too many requests. Please try again later.');
    assert.equal(body.error.requestId, limited.headers.get('x-request-id'));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
