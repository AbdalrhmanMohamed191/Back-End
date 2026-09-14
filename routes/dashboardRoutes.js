const express = require("express");

const {
  getOwnerDashboard,
  getAdminDashboard,
} = require("../controllers/dashboardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/owner",
  protect,
  authorize("hallOwner"),
  getOwnerDashboard
);

router.get(
  "/admin",
  protect,
  authorize("admin"),
  getAdminDashboard
);

module.exports = router;