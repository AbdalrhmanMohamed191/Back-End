const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    // ===============================
    // Basic Information
    // ===============================

    name: {
      type: String,
      required: [true, "Hall name is required"],
      trim: true,
      minlength: [2, "Hall name must be at least 2 characters"],
      maxlength: [150, "Hall name cannot exceed 150 characters"],
    },

    description: {
      type: String,
      required: [true, "Hall description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    // ===============================
    // Owner
    // ===============================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Hall owner is required"],
      index: true,
    },

    // ===============================
    // Contact Information
    // ===============================

    phone: {
      type: String,
      required: [true, "Hall phone is required"],
      trim: true,
    },

    secondaryPhone: {
      type: String,
      trim: true,
      default: null,
    },

    // ===============================
    // Location
    // ===============================

    address: {
      type: String,
      required: [true, "Hall address is required"],
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },

    area: {
      type: String,
      trim: true,
      default: null,
    },

    // ===============================
    // Capacity
    // ===============================

    capacity: {
      min: {
        type: Number,
        required: [true, "Minimum capacity is required"],
        min: [1, "Minimum capacity must be at least 1"],
      },

      max: {
        type: Number,
        required: [true, "Maximum capacity is required"],
        min: [1, "Maximum capacity must be at least 1"],
      },
    },

    // ===============================
    // Pricing
    // ===============================

    startingPrice: {
      type: Number,
      required: [true, "Starting price is required"],
      min: [0, "Starting price cannot be negative"],
    },

    currency: {
      type: String,
      default: "EGP",
      enum: ["EGP"],
    },

    // ===============================
    // Features
    // ===============================

    features: {
      type: [String],
      default: [],
    },

    // ===============================
    // Cover Image
    // ===============================

    coverImage: {
      url: {
        type: String,
        default: null,
      },

      publicId: {
        type: String,
        default: null,
      },
    },

    // ===============================
    // Gallery
    // ===============================

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
          default: null,
        },

        alt: {
          type: String,
          default: "",
          trim: true,
        },

        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    // ===============================
    // Hall Status
    // ===============================

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "suspended",
      ],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null,
      maxlength: [1000, "Rejection reason cannot exceed 1000 characters"],
    },

    // ===============================
    // Availability
    // ===============================

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ===============================
    // Ratings
    // ===============================

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // ===============================
    // Statistics
    // ===============================

    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===============================
    // Featured
    // ===============================

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ===============================
    // Soft Delete
    // ===============================

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

// ==========================================
// Capacity Validation
// ==========================================

hallSchema.pre("validate", function () {
  if (
    this.capacity &&
    this.capacity.min != null &&
    this.capacity.max != null &&
    this.capacity.min > this.capacity.max
  ) {
    this.invalidate(
      "capacity.min",
      "Minimum capacity cannot be greater than maximum capacity"
    );
  }
});

// ==========================================
// Text Search Index
// ==========================================

hallSchema.index({
  name: "text",
  description: "text",
  city: "text",
  area: "text",
});

// ==========================================
// Owner + Status Index
// ==========================================

hallSchema.index({
  owner: 1,
  status: 1,
});

// ==========================================
// Hall Discovery Index
// ==========================================

hallSchema.index({
  city: 1,
  status: 1,
  isAvailable: 1,
  isDeleted: 1,
});

// ==========================================
// Model
// ==========================================

module.exports = mongoose.model("Hall", hallSchema);