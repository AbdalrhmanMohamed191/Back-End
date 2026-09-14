const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
      index: true,
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: [true, "Package is required"],
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
      index: true,
    },

    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
      index: true,
    },

    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "Guests must be at least 1"],
    },

    packagePrice: {
      type: Number,
      required: [true, "Package price is required"],
      min: [0, "Package price cannot be negative"],
    },

    extraAmount: {
      type: Number,
      default: 0,
      min: [0, "Extra amount cannot be negative"],
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    currency: {
      type: String,
      enum: ["EGP"],
      default: "EGP",
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },

    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
      maxlength: [30, "Customer phone cannot exceed 30 characters"],
    },

    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      lowercase: true,
      trim: true,
      maxlength: [150, "Customer email cannot exceed 150 characters"],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
      ],
      default: "pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "unpaid",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      default: "cash",
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Cancellation reason cannot exceed 1000 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Double Booking Protection
|--------------------------------------------------------------------------
|
| A hall can only have ONE active booking for a specific event date.
|
*/

bookingSchema.index(
  {
    hall: 1,
    eventDate: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["pending", "confirmed"],
      },
    },
  }
);

/*
|--------------------------------------------------------------------------
| Useful Indexes
|--------------------------------------------------------------------------
*/

bookingSchema.index({
  customer: 1,
  createdAt: -1,
});

bookingSchema.index({
  hall: 1,
  status: 1,
  eventDate: 1,
});

bookingSchema.index({
  hall: 1,
  createdAt: -1,
});

bookingSchema.index({
  customer: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Booking", bookingSchema);