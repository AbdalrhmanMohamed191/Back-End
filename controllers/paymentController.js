const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

/*
|--------------------------------------------------------------------------
| Create Payment
|--------------------------------------------------------------------------
|
| Creates or reuses the internal payment record.
|
| Fawry integration will use this payment record later to
| create the actual payment request.
|
*/

const createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Booking ID
    |--------------------------------------------------------------------------
    */

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required.",
      });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Booking
    |--------------------------------------------------------------------------
    */

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Ownership
    |--------------------------------------------------------------------------
    */

    if (
      !booking.customer ||
      String(booking.customer) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to pay for this booking.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Method
    |--------------------------------------------------------------------------
    |
    | Only card and online payments should reach this endpoint.
    |
    */

    if (!["card", "online"].includes(booking.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message:
          "This booking does not require an online payment.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Booking Status
    |--------------------------------------------------------------------------
    */

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Payment is not available for this booking.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Already Paid
    |--------------------------------------------------------------------------
    */

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been paid.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Amount
    |--------------------------------------------------------------------------
    */

    const amount = Number(booking.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking payment amount.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Existing Payment
    |--------------------------------------------------------------------------
    */

    let payment = await Payment.findOne({
      booking: booking._id,
    });

    /*
    |--------------------------------------------------------------------------
    | Reuse Existing Payment
    |--------------------------------------------------------------------------
    */

    if (payment) {
      /*
      | Never recreate an already successful payment.
      */

      if (payment.status === "paid") {
        return res.status(400).json({
          success: false,
          message: "This booking has already been paid.",
        });
      }

      /*
      | Update payment information in case the payment
      | needs to be retried.
      */

      payment.amount = amount;
      payment.currency = booking.currency || "EGP";
      payment.method = booking.paymentMethod;
      payment.provider = "fawry";

      payment.status = "pending";
      payment.failureReason = null;

      /*
      | Keep old provider IDs until the real Fawry
      | integration decides whether a new transaction
      | should be generated.
      */

      await payment.save();
    } else {
      /*
      |--------------------------------------------------------------------------
      | Create New Payment
      |--------------------------------------------------------------------------
      */

      payment = await Payment.create({
        booking: booking._id,
        user: req.user._id,

        amount,

        currency: booking.currency || "EGP",

        method: booking.paymentMethod,

        status: "pending",

        provider: "fawry",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message: "Payment created successfully.",

      payment: {
        _id: payment._id,
        booking: payment.booking,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        provider: payment.provider,
        providerOrderId: payment.providerOrderId,
        providerTransactionId:
          payment.providerTransactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create Payment Error:", error);

    /*
    |--------------------------------------------------------------------------
    | Duplicate Payment
    |--------------------------------------------------------------------------
    */

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A payment already exists for this booking.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create payment.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get My Payment
|--------------------------------------------------------------------------
*/

const getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    /*
    |--------------------------------------------------------------------------
    | Validate Booking ID
    |--------------------------------------------------------------------------
    */

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Payment
    |--------------------------------------------------------------------------
    */

    const payment = await Payment.findOne({
      booking: bookingId,
      user: req.user._id,
    }).populate({
      path: "booking",
      select:
        "hall package eventDate guests totalAmount paymentMethod paymentStatus status",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get payment.",
    });
  }
};

module.exports = {
  createPayment,
  getPaymentByBooking,
};