const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');

const notificationParamsSchema = z.object({
  notificationId: objectId,
}).strict();

const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
  isRead: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
}).strict();

module.exports = { notificationParamsSchema, notificationListQuerySchema };
