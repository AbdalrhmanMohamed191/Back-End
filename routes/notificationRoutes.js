const express = require("express");

const {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyNotifications);

router.get("/unread-count", protect, getUnreadCount);

router.patch("/:id/read", protect, markNotificationAsRead);

router.patch("/read-all", protect, markAllNotificationsAsRead);

router.delete("/:id", protect, deleteNotification);

module.exports = router;