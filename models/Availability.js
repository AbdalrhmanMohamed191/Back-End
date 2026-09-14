const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
      index: true,
    },

    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },

    status: {
      type: String,
      enum: ["available", "blocked"],
      default: "available",
      index: true,
    },

    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
      default: null,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| One calendar record per hall per date
|--------------------------------------------------------------------------
*/

availabilitySchema.index(
  {
    hall: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

availabilitySchema.index({
  hall: 1,
  date: 1,
  status: 1,
});

module.exports = mongoose.model(
  "Availability",
  availabilitySchema
);