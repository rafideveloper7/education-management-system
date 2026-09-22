const app = require('./app');
const connectDatabase = require('./config/db');
const env = require('./config/env');

let server;

const startServer = async () => {
  try {
    await connectDatabase(env.mongodbUri);

    console.log('MongoDB connected ✅');

    server = app.listen(env.port, () => {
      console.log(`Backend server running ✅ http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error(`Unable to start backend: ${error.message}`);
    process.exit(1);
  }
};

const shutdown = (signal) => {
  console.log(`${signal} received. Closing server...`);

  if (!server) {
    process.exit(0);
  }

  server.close(async () => {
    await require('mongoose').connection.close();
    console.log('Server and MongoDB connection closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
