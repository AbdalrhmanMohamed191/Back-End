const express = require("express");
const {
  createPackage,
  getMyPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  restorePackage,
  getPublicHallPackages,
  togglePackageActive,
} = require("../controllers/packageController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/public/hall/:hallId",
  getPublicHallPackages
);

/*
|--------------------------------------------------------------------------
| Hall Owner Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/my",
  protect,
  authorize("hallOwner"),
  getMyPackages
);

router.post(
  "/",
  protect,
  authorize("hallOwner"),
  createPackage
);

router.patch(
  "/:id",
  protect,
  authorize("hallOwner", "admin"),
  updatePackage
);

router.delete(
  "/:id",
  protect,
  authorize("hallOwner", "admin"),
  deletePackage
);

router.patch(
  "/:id/restore",
  protect,
  authorize("hallOwner", "admin"),
  restorePackage
);

router.patch(
  "/:id/toggle-active",
  protect,
  authorize("hallOwner", "admin"),
  togglePackageActive
);

/*
|--------------------------------------------------------------------------
| Protected Package Details
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  protect,
  authorize("hallOwner", "admin"),
  getPackageById
);

module.exports = router;
