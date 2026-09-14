const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Hall = require("../models/Hall");
const Booking = require("../models/Booking");

// ==========================================
// Helpers
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ==========================================
// Create Hall Owner
// ==========================================

const createHallOwner = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    // ==========================================
    // Validation
    // ==========================================

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedPhone =
      phone.trim();

    // ==========================================
    // Check duplicate email
    // ==========================================

    const existingEmail =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "Email is already registered",
      });
    }

    // ==========================================
    // Check duplicate phone
    // ==========================================

    const existingPhone =
      await User.findOne({
        phone: normalizedPhone,
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "Phone number is already registered",
      });
    }

    // ==========================================
    // Hash Password
    // ==========================================

    const hashedPassword =
      await bcrypt.hash(password, 12);

    // ==========================================
    // Create Owner
    // ==========================================

    const owner = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "hallOwner",
      isActive: true,
    });

    // ==========================================
    // Response
    // ==========================================

    return res.status(201).json({
      success: true,
      message:
        "Hall owner created successfully",
      user: safeUser(owner),
    });
  } catch (error) {
    console.error(
      "Create Hall Owner Error:",
      error
    );

    // ==========================================
    // Duplicate Key Error
    // ==========================================

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Email or phone is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Get All Users
// ==========================================

const getAllUsers = async (req, res) => {
  try {
    let {
      search = "",
      role,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    page = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    limit = Math.min(
      Math.max(
        parseInt(limit, 10) || 20,
        1
      ),
      50
    );

    const filter = {};

    // ==========================================
    // Role Filter
    // ==========================================

    const allowedRoles = [
      "user",
      "hallOwner",
      "admin",
    ];

    if (role) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role filter",
        });
      }

      filter.role = role;
    }

    // ==========================================
    // Status Filter
    // ==========================================

    if (status) {
      if (
        !["active", "inactive"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status filter",
        });
      }

      filter.isActive =
        status === "active";
    }

    // ==========================================
    // Search
    // ==========================================

    if (search.trim()) {
      const searchRegex =
        new RegExp(
          search.trim(),
          "i"
        );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // ==========================================
    // Pagination
    // ==========================================

    const skip =
      (page - 1) * limit;

    const [users, total] =
      await Promise.all([
        User.find(filter)
          .select(
            "name email phone role isActive createdAt updatedAt"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        User.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(
          total / limit
        ),
        hasNextPage:
          page * limit < total,
        hasPrevPage:
          page > 1,
      },
      filters: {
        search,
        role: role || null,
        status: status || null,
      },
    });
  } catch (error) {
    console.error(
      "Get All Users Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Get User By ID
// ==========================================

const getUserById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // Validate ID
    // ==========================================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ==========================================
    // Find User
    // ==========================================

    const user =
      await User.findById(id).select(
        "name email phone role isActive createdAt updatedAt"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: safeUser(user),
    });
  } catch (error) {
    console.error(
      "Get User By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Update User Role
// ==========================================

const updateUserRole = async (
  req,
  res
) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    // ==========================================
    // Validate ID
    // ==========================================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ==========================================
    // Only user <-> hallOwner
    // ==========================================

    const allowedRoles = [
      "user",
      "hallOwner",
    ];

    if (
      !role ||
      !allowedRoles.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Admin role cannot be assigned here.",
      });
    }

    // ==========================================
    // Find User
    // ==========================================

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // Prevent Self Role Change
    // ==========================================

    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own role",
      });
    }

    // ==========================================
    // Prevent Changing Another Admin
    // ==========================================

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "You cannot change the role of another admin",
      });
    }

    // ==========================================
    // Update
    // ==========================================

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "User role updated successfully",
      user: safeUser(user),
    });
  } catch (error) {
    console.error(
      "Update User Role Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Update User Status
// ==========================================

const updateUserStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // ==========================================
    // Validate ID
    // ==========================================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ==========================================
    // Validate Status
    // ==========================================

    if (
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "isActive must be a boolean",
      });
    }

    // ==========================================
    // Find User
    // ==========================================

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // Prevent Self Deactivation
    // ==========================================

    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own account status",
      });
    }

    // ==========================================
    // Prevent Changing Another Admin
    // ==========================================

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "You cannot change the status of another admin",
      });
    }

    // ==========================================
    // Update Status
    // ==========================================

    user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: safeUser(user),
    });
  } catch (error) {
    console.error(
      "Update User Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Delete User
// ==========================================

const deleteUser = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ==========================================
    // Validate ID
    // ==========================================

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ==========================================
    // Find User
    // ==========================================

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // Prevent Self Delete
    // ==========================================

    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete yourself",
      });
    }

    // ==========================================
    // Prevent Deleting Another Admin
    // ==========================================

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "You cannot delete another admin",
      });
    }

    // ==========================================
    // Owner Checks
    // ==========================================

    if (
      user.role === "hallOwner"
    ) {
      const ownerHallIds =
        await Hall.find({
          owner: user._id,
        }).distinct("_id");

      const [
        hallCount,
        bookingCount,
      ] = await Promise.all([
        Hall.countDocuments({
          owner: user._id,
          isDeleted: {
            $ne: true,
          },
        }),

        Booking.countDocuments({
          $or: [
            {
              customer: user._id,
            },
            {
              hall: {
                $in: ownerHallIds,
              },
            },
          ],
        }),
      ]);

      if (hallCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            "This hall owner still has halls. Deactivate the account instead of deleting it.",
        });
      }

      if (bookingCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            "This user has booking history and cannot be deleted.",
        });
      }
    }

    // ==========================================
    // Delete
    // ==========================================

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// Exports
// ==========================================

module.exports = {
  createHallOwner,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};