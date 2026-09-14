const express = require("express");

const {
  getAllHalls,
  getAdminHallById,
  approveHall,
  rejectHall,
  suspendHall,
  activateHall,
} = require("../controllers/hallController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================================
// ADMIN - GET ALL HALLS
// =========================================================

router.get(
  "/",
  protect,
  authorize("admin"),
  getAllHalls
);

// =========================================================
// ADMIN - GET HALL BY ID
// =========================================================

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getAdminHallById
);

// =========================================================
// ADMIN - APPROVE HALL
// =========================================================

router.patch(
  "/:id/approve",
  protect,
  authorize("admin"),
  approveHall
);

// =========================================================
// ADMIN - REJECT HALL
// =========================================================

router.patch(
  "/:id/reject",
  protect,
  authorize("admin"),
  rejectHall
);

// =========================================================
// ADMIN - SUSPEND HALL
// =========================================================

router.patch(
  "/:id/suspend",
  protect,
  authorize("admin"),
  suspendHall
);

// =========================================================
// ADMIN - ACTIVATE HALL
// =========================================================

router.patch(
  "/:id/activate",
  protect,
  authorize("admin"),
  activateHall
);

module.exports = router;

