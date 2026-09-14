const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
  updateBookingStatus,
  getAdminBookings,
} = require("../controllers/bookingController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize("user"),
  createBooking
);

router.get(
  "/my",
  protect,
  authorize("user"),
  getMyBookings
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("user", "admin"),
  cancelBooking
);

/*
|--------------------------------------------------------------------------
| Hall Owner
|--------------------------------------------------------------------------
*/

router.get(
  "/owner",
  protect,
  authorize("hallOwner"),
  getOwnerBookings
);

router.patch(
  "/:id/status",
  protect,
  authorize("hallOwner", "admin"),
  updateBookingStatus
);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

router.get(
  "/admin",
  protect,
  authorize("admin"),
  getAdminBookings
);

/*
|--------------------------------------------------------------------------
| Shared
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  protect,
  authorize("user", "hallOwner", "admin"),
  getBookingById
);

module.exports = router;