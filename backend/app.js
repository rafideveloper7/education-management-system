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
app.use('/api/v1/admin/academics', require('./routes/admin/academic.routes'));
app.use('/api/v1', require('./routes/examination.routes'));
app.use('/api/v1', require('./routes/assignment.routes'));
app.use('/api/v1/admin/assignment-config', require('./routes/admin/assignment-config.routes'));
app.use('/api/v1/attendance', require('./routes/attendance.routes'));
app.use('/api/v1/admin/attendance', require('./routes/admin/attendance.routes'));
app.use('/api/v1/admin/relationships', require('./routes/admin/relationships.routes'));
app.use('/api/v1', require('./routes/communication.routes'));
app.use('/api/v1', require('./routes/document.routes'));
app.use('/api/v1', require('./routes/timetable.routes'));
app.use('/api/v1', require('./routes/notification.routes'));

// Group 14 — Fees & Finance
app.use('/api/v1', require('./routes/fee.routes'));
app.use('/api/v1/admin', require('./routes/admin/fee.routes'));
app.use('/api/v1/webhooks', require('./routes/webhooks/payment.routes'));

// Group 15 — Admission Management
app.use('/api/v1', require('./routes/public/admission.routes'));
app.use('/api/v1/admin', require('./routes/admin/admission.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
