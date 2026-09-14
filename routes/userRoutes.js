const express = require("express");

const {
  createHallOwner,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require("../controllers/userController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// All routes below are ADMIN ONLY
// ==========================================

// ==========================================
// Create Hall Owner
// POST /api/v1/users/owners
// ==========================================

router.post(
  "/owners",
  protect,
  authorize("admin"),
  createHallOwner
);

// ==========================================
// Get All Users
// GET /api/v1/users
// ==========================================

router.get(
  "/",
  protect,
  authorize("admin"),
  getAllUsers
);

// ==========================================
// Get User By ID
// GET /api/v1/users/:id
// ==========================================

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getUserById
);

// ==========================================
// Update User Role
// PATCH /api/v1/users/:id/role
// ==========================================

router.patch(
  "/:id/role",
  protect,
  authorize("admin"),
  updateUserRole
);

// ==========================================
// Update User Status
// PATCH /api/v1/users/:id/status
// ==========================================

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  updateUserStatus
);

// ==========================================
// Delete User
// DELETE /api/v1/users/:id
// ==========================================

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteUser
);

module.exports = router;