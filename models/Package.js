const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: [true, "Hall is required"],
      index: true,
    },

    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
      minlength: [2, "Package name must be at least 2 characters"],
      maxlength: [150, "Package name cannot exceed 150 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Package description cannot exceed 2000 characters"],
      default: "",
    },

    price: {
      type: Number,
      required: [true, "Package price is required"],
      min: [0, "Package price cannot be negative"],
    },

    currency: {
      type: String,
      enum: ["EGP"],
      default: "EGP",
    },

    minGuests: {
      type: Number,
      required: [true, "Minimum guests is required"],
      min: [1, "Minimum guests must be at least 1"],
    },

    maxGuests: {
      type: Number,
      required: [true, "Maximum guests is required"],
      min: [1, "Maximum guests must be at least 1"],
    },

    durationHours: {
      type: Number,
      min: [0.5, "Duration must be at least 0.5 hours"],
      max: [24, "Duration cannot exceed 24 hours"],
      default: null,
    },

    features: {
      type: [String],
      default: [],
    },

    image: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: [0, "Sort order cannot be negative"],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

packageSchema.pre("validate", function () {
  if (
    this.minGuests != null &&
    this.maxGuests != null &&
    this.minGuests > this.maxGuests
  ) {
    this.invalidate(
      "minGuests",
      "Minimum guests cannot be greater than maximum guests"
    );
  }
});

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

packageSchema.index({
  hall: 1,
  isDeleted: 1,
  isActive: 1,
});

packageSchema.index({
  hall: 1,
  sortOrder: 1,
});

packageSchema.index({
  hall: 1,
  name: 1,
});

module.exports = mongoose.model("Package", packageSchema);