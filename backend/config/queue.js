const env = require('./env');

let Queue;
let Worker;
try {
  ({ Queue, Worker } = require('bullmq'));
} catch {
  Queue = null;
  Worker = null;
}

const createConnection = () => env.redisUrl ? { url: env.redisUrl } : null;

const notificationQueueName = 'notification-delivery';
let notificationQueue = null;

const createNotificationQueue = () => {
  const connection = createConnection();
  if (!Queue || !connection) return null;
  if (!notificationQueue) {
    notificationQueue = new Queue(notificationQueueName, { connection });
  }
  return notificationQueue;
};

const closeNotificationQueue = async () => {
  if (!notificationQueue) return;
  await notificationQueue.close();
  notificationQueue = null;
};

module.exports = {
  createConnection,
  createNotificationQueue,
  closeNotificationQueue,
  notificationQueueName,
  Worker,
};
