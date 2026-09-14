const Notification = require("../models/Notification");

const {
  emitToUser,
  emitToOwner,
  emitToAdmin,
} = require("../config/socket");

/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
| Internal helper used by controllers/services.
|
| Important:
| - Notification is saved first.
| - Socket event is emitted after successful save.
| - Socket failure must NOT break the main business operation.
|--------------------------------------------------------------------------
*/

const createNotification = async ({
  recipient,
  type,
  title,
  message,
  booking = null,
  hall = null,
}) => {
  try {
    const notification =
      await Notification.create({
        recipient,
        type,
        title,
        message,
        booking,
        hall,
      });

    const populatedNotification =
      await Notification.findById(
        notification._id
      )
        .populate({
          path: "booking",
          select:
            "eventDate status guests totalAmount currency paymentStatus",
        })
        .populate({
          path: "hall",
          select:
            "name city area coverImage",
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | Live Socket Notification
    |--------------------------------------------------------------------------
    */

    try {
      /*
      |--------------------------------------------------------------------------
      | General Notification Event
      |--------------------------------------------------------------------------
      */

      emitToUser(
        String(recipient),
        "notification:new",
        populatedNotification
      );

      /*
      |--------------------------------------------------------------------------
      | New Booking
      |--------------------------------------------------------------------------
      |
      | When a customer creates a booking:
      | - notification:new -> notification bell
      | - booking:new -> owner dashboard
      |
      */

      if (
        type === "booking_created"
      ) {
        emitToOwner(
          String(recipient),
          "booking:new",
          populatedNotification
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Booking Status Updates
      |--------------------------------------------------------------------------
      |
      | Customer receives live update when:
      | - confirmed
      | - rejected
      | - cancelled
      | - completed
      |
      */

      if (
        type ===
          "booking_confirmed" ||
        type ===
          "booking_rejected" ||
        type ===
          "booking_cancelled" ||
        type ===
          "booking_completed"
      ) {
        emitToUser(
          String(recipient),
          "booking:updated",
          populatedNotification
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Hall Notifications
      |--------------------------------------------------------------------------
      |
      | Reserved for future admin/hall approval events.
      |--------------------------------------------------------------------------
      */

      if (
        type === "hall_approved" ||
        type === "hall_rejected" ||
        type === "hall_suspended"
      ) {
        emitToUser(
          String(recipient),
          "hall:updated",
          populatedNotification
        );
      }
    } catch (socketError) {
      /*
      |--------------------------------------------------------------------------
      | Socket failure must NEVER break notification creation
      |--------------------------------------------------------------------------
      */

      console.error(
        "Socket notification error:",
        socketError.message
      );
    }

    return populatedNotification;
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Notification failure must not break booking operation
    |--------------------------------------------------------------------------
    */

    console.error(
      "Create Notification Error:",
      error
    );

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Get My Notifications
|--------------------------------------------------------------------------
| GET /api/v1/notifications
|--------------------------------------------------------------------------
*/

const getMyNotifications = async (
  req,
  res
) => {
  try {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) ||
          20,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    const filter = {
      recipient: req.user._id,
    };

    const [
      notifications,
      total,
      unreadCount,
    ] = await Promise.all([
      Notification.find(filter)
        .populate(
          "booking",
          "eventDate status guests totalAmount currency paymentStatus"
        )
        .populate(
          "hall",
          "name city area coverImage"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(
        filter
      ),

      Notification.countDocuments({
        ...filter,
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(
            total / limit
          ),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error(
      "Get Notifications Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get notifications",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Unread Count
|--------------------------------------------------------------------------
| GET /api/v1/notifications/unread-count
|--------------------------------------------------------------------------
*/

const getUnreadCount = async (
  req,
  res
) => {
  try {
    const unreadCount =
      await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error(
      "Get Unread Count Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get unread count",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Mark One Notification As Read
|--------------------------------------------------------------------------
| PATCH /api/v1/notifications/:id/read
|--------------------------------------------------------------------------
*/

const markNotificationAsRead =
  async (req, res) => {
    try {
      const notification =
        await Notification.findOne({
          _id: req.params.id,
          recipient: req.user._id,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt =
          new Date();

        await notification.save();
      }

      return res.status(200).json({
        success: true,
        message:
          "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      console.error(
        "Mark Notification As Read Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update notification",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
| PATCH /api/v1/notifications/read-all
|--------------------------------------------------------------------------
*/

const markAllNotificationsAsRead =
  async (req, res) => {
    try {
      await Notification.updateMany(
        {
          recipient: req.user._id,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      console.error(
        "Mark All Notifications As Read Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update notifications",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
| DELETE /api/v1/notifications/:id
|--------------------------------------------------------------------------
*/

const deleteNotification =
  async (req, res) => {
    try {
      const notification =
        await Notification.findOneAndDelete({
          _id: req.params.id,
          recipient: req.user._id,
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Notification deleted",
      });
    } catch (error) {
      console.error(
        "Delete Notification Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete notification",
      });
    }
  };

module.exports = {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};