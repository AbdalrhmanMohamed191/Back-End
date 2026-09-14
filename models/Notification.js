const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required"],
      index: true,
    },

    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_confirmed",
        "booking_rejected",
        "booking_cancelled",
        "booking_completed",
        "hall_approved",
        "hall_rejected",
        "hall_suspended",
        "general",
      ],
      required: [true, "Notification type is required"],
    },

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [200, "Notification title cannot exceed 200 characters"],
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [1000, "Notification message cannot exceed 1000 characters"],
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },

    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      default: null,
      index: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Fast notification queries
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Notification", notificationSchema);