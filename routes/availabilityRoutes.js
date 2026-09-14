const express = require("express");

const {
  upsertAvailability,
  getMyHallCalendar,
  deleteAvailability,
  getPublicHallCalendar,
} = require("../controllers/availabilityController");

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
  "/public/hall/:hallId",
  getPublicHallCalendar
);

/*
|--------------------------------------------------------------------------
| Hall Owner
|--------------------------------------------------------------------------
*/

router.get(
  "/my/hall/:hallId",
  protect,
  authorize("hallOwner"),
  getMyHallCalendar
);

router.put(
  "/",
  protect,
  authorize("hallOwner"),
  upsertAvailability
);

router.delete(
  "/:id",
  protect,
  authorize("hallOwner"),
  deleteAvailability
);

module.exports = router;