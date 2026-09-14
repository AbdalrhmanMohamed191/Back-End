const express = require("express");

const {
  createHall,
  getMyHalls,
  getHallById,
  updateHall,
  deleteHall,
  restoreHall,

  getPublicHalls,
  getPublicHallById,

  uploadHallCover,
  addHallGalleryImages,
  deleteHallGalleryImage,
  deleteHallCover,
  reorderHallGalleryImages,
} = require("../controllers/hallController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// =========================================================
// PUBLIC
// =========================================================

router.get(
  "/public",
  getPublicHalls
);

router.get(
  "/public/:id",
  getPublicHallById
);

// =========================================================
// HALL OWNER
// =========================================================

router.get(
  "/my",
  protect,
  authorize("hallOwner"),
  getMyHalls
);

router.get(
  "/:id",
  protect,
  authorize("hallOwner", "admin"),
  getHallById
);

router.post(
  "/",
  protect,
  authorize("hallOwner"),
  createHall
);

router.patch(
  "/:id",
  protect,
  authorize("hallOwner"),
  updateHall
);

router.delete(
  "/:id",
  protect,
  authorize("hallOwner"),
  deleteHall
);

router.patch(
  "/:id/restore",
  protect,
  authorize("hallOwner"),
  restoreHall
);

// =========================================================
// COVER IMAGE
// =========================================================

router.post(
  "/:id/cover",
  protect,
  authorize("hallOwner"),
  upload.single("image"),
  uploadHallCover
);

router.delete(
  "/:id/cover",
  protect,
  authorize("hallOwner"),
  deleteHallCover
);

// =========================================================
// GALLERY
// =========================================================

router.post(
  "/:id/gallery",
  protect,
  authorize("hallOwner"),
  upload.array("images", 10),
  addHallGalleryImages
);

router.patch(
  "/:id/gallery/reorder",
  protect,
  authorize("hallOwner"),
  reorderHallGalleryImages
);

router.delete(
  "/:id/gallery/:imageId",
  protect,
  authorize("hallOwner"),
  deleteHallGalleryImage
);

module.exports = router;