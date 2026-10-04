const createCorsOptions = ({ nodeEnv, clientOrigins }) => ({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (nodeEnv !== 'production' && clientOrigins.length === 0) {
      return callback(null, true);
    }

    return callback(null, clientOrigins.includes(origin));
  },
});

module.exports = { createCorsOptions };
