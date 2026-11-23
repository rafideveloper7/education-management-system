const { createNotificationService } = require('../services/notification/notification.service');

const notifications = createNotificationService();
const sendOk = (res, data, status = 200) => res.status(status).json({ success: true, data });
const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};

module.exports = {
  list: wrap(async (req, res) => {
    const page = await notifications.list({ actor: req.user, filters: req.validated.query });
    return res.status(200).json({
      success: true,
      data: page.items,
      pagination: page.pagination,
    });
  }),
  getById: wrap(async (req, res) => sendOk(res, await notifications.getById({
    actor: req.user,
    notificationId: req.validated.params.notificationId,
  }))),
  markRead: wrap(async (req, res) => sendOk(res, await notifications.markRead({
    actor: req.user,
    notificationId: req.validated.params.notificationId,
  }))),
  markAllRead: wrap(async (req, res) => sendOk(res, await notifications.markAllRead({ actor: req.user }))),
  unreadCount: wrap(async (req, res) => sendOk(res, await notifications.unreadCount({ actor: req.user }))),
};
