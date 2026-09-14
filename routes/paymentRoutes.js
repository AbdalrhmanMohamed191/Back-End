const express = require("express");

const {
  createPayment,
  getPaymentByBooking,
} = require("../controllers/paymentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Customer Payment
|--------------------------------------------------------------------------
*/

router.post(
  "/create",
  protect,
  authorize("user"),
  createPayment
);

router.get(
  "/booking/:bookingId",
  protect,
  authorize("user"),
  getPaymentByBooking
);

module.exports = router;