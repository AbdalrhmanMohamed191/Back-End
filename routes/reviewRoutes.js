const express = require("express");

const {
  createReview,
  getHallReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getOwnerReviews,
} = require("../controllers/reviewController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.get(
  "/hall/:hallId",
  getHallReviews
);

/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protect,
  authorize("user"),
  createReview
);

router.get(
  "/my",
  protect,
  authorize("user"),
  getMyReviews
);

router.patch(
  "/:id",
  protect,
  authorize("user"),
  updateReview
);

router.delete(
  "/:id",
  protect,
  authorize("user"),
  deleteReview
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
  getOwnerReviews
);

module.exports = router;