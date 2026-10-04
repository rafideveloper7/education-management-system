const cors = require('cors');
const express = require('express');
const env = require('./config/env');
const { createCorsOptions } = require('./config/cors');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { attachRequestId } = require('./middleware/requestId.middleware');

const app = express();

app.use(attachRequestId);
app.use(cors(createCorsOptions(env)));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Education Management System backend is running',
  });
});

app.use('/api/v1/auth', require('./routes/public/auth.routes'));
app.use('/api/v1/profile', require('./routes/profile/profile.routes'));
app.use('/api/v1/admin/relationships', require('./routes/admin/relationships.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
