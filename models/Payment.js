const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "EGP",
      trim: true,
      uppercase: true,
    },

    method: {
      type: String,
      enum: ["card", "online"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    provider: {
      type: String,
      enum: ["fawry"],
      default: "fawry",
    },

    providerOrderId: {
      type: String,
      default: null,
      index: true,
    },

    providerTransactionId: {
      type: String,
      default: null,
      index: true,
    },

    providerPaymentKey: {
      type: String,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  provider: 1,
  providerOrderId: 1,
});

paymentSchema.index({
  provider: 1,
  providerTransactionId: 1,
});

module.exports = mongoose.model("Payment", paymentSchema);