const { Worker, notificationQueueName, createConnection } = require('../config/queue');
const { processNotificationDelivery } = require('../jobs/notificationDelivery.job');

const startNotificationWorker = () => {
  const connection = createConnection();
  if (!Worker || !connection) return null;
  return new Worker(
    notificationQueueName,
    processNotificationDelivery,
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    }
  );
};

module.exports = { startNotificationWorker };
