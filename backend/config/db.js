const mongoose = require('mongoose');

const connectDatabase = async (mongoUri) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!mongoUri) {
    throw new Error('MongoDB connection string is not configured');
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  console.log(`MongoDB connected: ${connection.connection.host}`);

  return connection;
};

module.exports = connectDatabase;
