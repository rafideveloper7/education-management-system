const cors = require('cors');
const express = require('express');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Education Management System backend is running',
  });
});

app.use('/api/v1/auth', require('./routes/public/auth.routes'));

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message,
  });
});

module.exports = app;
