const mongoose = require("mongoose");
const Hall = require("../models/Hall");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/* =========================================================
   CREATE HALL
========================================================= */

const createHall = async (req, res) => {
  try {
    const {
      name,
      description,
      phone,
      secondaryPhone,
      address,
      city,
      area,
      capacity,
      startingPrice,
      features,
    } = req.body;

    if (
      !name ||
      !description ||
      !phone ||
      !address ||
      !city ||
      !capacity ||
      startingPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, phone, address, city, capacity and starting price are required",
      });
    }

    if (
      capacity.min === undefined ||
      capacity.max === undefined ||
      Number(capacity.min) < 1 ||
      Number(capacity.max) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid minimum and maximum capacity are required",
      });
    }

    if (Number(capacity.min) > Number(capacity.max)) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum capacity cannot be greater than maximum capacity",
      });
    }

    if (Number(startingPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: "Starting price cannot be negative",
      });
    }

    const hall = await Hall.create({
      name: name.trim(),
      description: description.trim(),
      owner: req.user._id,
      phone: phone.trim(),
      secondaryPhone: secondaryPhone
        ? secondaryPhone.trim()
        : null,
      address: address.trim(),
      city: city.trim(),
      area: area ? area.trim() : null,

      capacity: {
        min: Number(capacity.min),
        max: Number(capacity.max),
      },

      startingPrice: Number(startingPrice),

      features: Array.isArray(features)
        ? features
            .map((feature) => String(feature).trim())
            .filter(Boolean)
        : [],

      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Hall created successfully and is waiting for approval",
      hall,
    });
  } catch (error) {
    console.error("Create Hall Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   GET MY HALLS
========================================================= */

// const getMyHalls = async (req, res) => {
//   try {
//     const page = Math.max(
//       Number.parseInt(req.query.page, 10) || 1,
//       1
//     );

//     const limit = Math.min(
//       Math.max(
//         Number.parseInt(req.query.limit, 10) || 10,
//         1
//       ),
//       50
//     );

//     const skip = (page - 1) * limit;

//     const filter = {
//       owner: req.user._id,
//       isDeleted: false,
//     };

//     const [halls, total] = await Promise.all([
//       Hall.find(filter)
//         .select(
//           "name description phone address city area capacity startingPrice currency features coverImage images status rejectionReason isAvailable rating totalBookings isFeatured createdAt updatedAt"
//         )
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),

//       Hall.countDocuments(filter),
//     ]);

//     const totalPages = Math.ceil(total / limit);

//     return res.status(200).json({
//       success: true,
//       results: halls.length,

//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages,
//         hasNextPage: page < totalPages,
//         hasPreviousPage: page > 1,
//       },

//       halls,
//     });
//   } catch (error) {
//     console.error("Get My Halls Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };



const getMyHalls = async (req, res) => {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 10,
        1
      ),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {
      owner: req.user._id,
    };

    // By default show active halls only.
    // ?deleted=true shows deleted halls.
    if (req.query.deleted === "true") {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = false;
    }

    const [halls, total] = await Promise.all([
      Hall.find(filter)
        .select(
          "name description phone secondaryPhone address city area capacity startingPrice currency features coverImage images status rejectionReason isAvailable rating totalBookings isFeatured isDeleted deletedAt createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Hall.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      results: halls.length,

      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      halls,
    });
  } catch (error) {
    console.error("Get My Halls Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   GET HALL BY ID
========================================================= */

const getHallById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    const isOwner =
      hall.owner.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this hall",
      });
    }

    const populatedHall = await Hall.findById(hall._id)
      .populate(
        "owner",
        "name email phone role isActive"
      )
      .lean();

    return res.status(200).json({
      success: true,
      hall: populatedHall,
    });
  } catch (error) {
    console.error("Get Hall By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   UPDATE MY HALL
========================================================= */

const updateHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    /*
      Only these fields are allowed to be updated
      by the hall owner.
    */

    const allowedFields = [
      "name",
      "description",
      "phone",
      "secondaryPhone",
      "address",
      "city",
      "area",
      "capacity",
      "startingPrice",
      "features",
    ];

    const receivedFields = Object.keys(req.body);

    const invalidFields = receivedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You cannot update these fields",
        invalidFields,
      });
    }

    /* =========================
       BASIC FIELD VALIDATION
    ========================= */

    if (
      req.body.name !== undefined &&
      (!req.body.name ||
        typeof req.body.name !== "string" ||
        req.body.name.trim().length < 2)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name must be at least 2 characters",
      });
    }

    if (
      req.body.description !== undefined &&
      (!req.body.description ||
        typeof req.body.description !== "string" ||
        req.body.description.trim().length < 20)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description must be at least 20 characters",
      });
    }

    if (
      req.body.phone !== undefined &&
      (!req.body.phone ||
        typeof req.body.phone !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    if (
      req.body.address !== undefined &&
      (!req.body.address ||
        typeof req.body.address !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid address is required",
      });
    }

    if (
      req.body.city !== undefined &&
      (!req.body.city ||
        typeof req.body.city !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid city is required",
      });
    }

    /* =========================
       CAPACITY
    ========================= */

    if (req.body.capacity !== undefined) {
      if (
        typeof req.body.capacity !== "object" ||
        req.body.capacity === null
      ) {
        return res.status(400).json({
          success: false,
          message: "Capacity must be an object",
        });
      }

      const min = Number(req.body.capacity.min);
      const max = Number(req.body.capacity.max);

      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        min < 1 ||
        max < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid minimum and maximum capacity are required",
        });
      }

      if (min > max) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum capacity cannot be greater than maximum capacity",
        });
      }

      hall.capacity = {
        min,
        max,
      };
    }

    /* =========================
       STARTING PRICE
    ========================= */

    if (req.body.startingPrice !== undefined) {
      const startingPrice = Number(
        req.body.startingPrice
      );

      if (
        !Number.isFinite(startingPrice) ||
        startingPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Starting price must be a valid non-negative number",
        });
      }

      hall.startingPrice = startingPrice;
    }

    /* =========================
       FEATURES
    ========================= */

    if (req.body.features !== undefined) {
      if (!Array.isArray(req.body.features)) {
        return res.status(400).json({
          success: false,
          message: "Features must be an array",
        });
      }

      hall.features = req.body.features
        .map((feature) => String(feature).trim())
        .filter(Boolean);
    }

    /* =========================
       STRING FIELDS
    ========================= */

    if (req.body.name !== undefined) {
      hall.name = req.body.name.trim();
    }

    if (req.body.description !== undefined) {
      hall.description =
        req.body.description.trim();
    }

    if (req.body.phone !== undefined) {
      hall.phone = req.body.phone.trim();
    }

    if (req.body.secondaryPhone !== undefined) {
      hall.secondaryPhone =
        req.body.secondaryPhone
          ? req.body.secondaryPhone.trim()
          : null;
    }

    if (req.body.address !== undefined) {
      hall.address = req.body.address.trim();
    }

    if (req.body.city !== undefined) {
      hall.city = req.body.city.trim();
    }

    if (req.body.area !== undefined) {
      hall.area = req.body.area
        ? req.body.area.trim()
        : null;
    }

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall updated successfully",
      hall,
    });
  } catch (error) {
    console.error("Update Hall Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map(
          (err) => err.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   SOFT DELETE MY HALL
========================================================= */

const deleteHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    hall.isDeleted = true;
    hall.deletedAt = new Date();
    hall.isAvailable = false;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall deleted successfully",
    });
  } catch (error) {
    console.error("Delete Hall Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   RESTORE MY HALL
========================================================= */

const restoreHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: true,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Deleted hall not found or you do not own this hall",
      });
    }

    hall.isDeleted = false;
    hall.deletedAt = null;

    /*
      We don't automatically make it available here.
      The hall must respect its approval status.
    */

    hall.isAvailable =
      hall.status === "approved";

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall restored successfully",
      hall,
    });
  } catch (error) {
    console.error("Restore Hall Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   ADMIN - GET ALL HALLS
========================================================= */

const getAllHalls = async (req, res) => {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 10,
        1
      ),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {};

    // Deleted
    if (req.query.deleted === "true") {
      filter.isDeleted = true;
    } else if (req.query.deleted === "all") {
      // Show both deleted and non-deleted
    } else {
      filter.isDeleted = false;
    }

    // Status
    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "suspended",
    ];

    if (
      req.query.status &&
      allowedStatuses.includes(req.query.status)
    ) {
      filter.status = req.query.status;
    }

    // Availability
    if (req.query.available === "true") {
      filter.isAvailable = true;
    }

    if (req.query.available === "false") {
      filter.isAvailable = false;
    }

    // Featured
    if (req.query.featured === "true") {
      filter.isFeatured = true;
    }

    if (req.query.featured === "false") {
      filter.isFeatured = false;
    }

    // City
    if (req.query.city?.trim()) {
      filter.city = {
        $regex: req.query.city.trim(),
        $options: "i",
      };
    }

    // Search
    if (req.query.search?.trim()) {
      const search = req.query.search.trim();

      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          city: {
            $regex: search,
            $options: "i",
          },
        },
        {
          area: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Sorting
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      priceLow: { startingPrice: 1 },
      priceHigh: { startingPrice: -1 },
      ratingHigh: { "rating.average": -1 },
      bookingsHigh: { totalBookings: -1 },
    };

    const sort =
      sortOptions[req.query.sort] ||
      sortOptions.newest;

    const [halls, total] = await Promise.all([
      Hall.find(filter)
        .populate(
          "owner",
          "name email phone role isActive"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Hall.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      results: halls.length,

      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      filters: {
        status: req.query.status || null,
        city: req.query.city || null,
        search: req.query.search || null,
        available:
          req.query.available !== undefined
            ? req.query.available
            : null,
        featured:
          req.query.featured !== undefined
            ? req.query.featured
            : null,
        deleted: req.query.deleted || "false",
        sort: req.query.sort || "newest",
      },

      halls,
    });
  } catch (error) {
    console.error("Admin Get All Halls Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   ADMIN - GET HALL BY ID
========================================================= */

const getAdminHallById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findById(id)
      .populate(
        "owner",
        "name email phone role isActive createdAt"
      )
      .lean();

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    return res.status(200).json({
      success: true,
      hall,
    });
  } catch (error) {
    console.error(
      "Admin Get Hall By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   ADMIN - APPROVE HALL
========================================================= */

const approveHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findById(id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    if (hall.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted halls cannot be approved",
      });
    }

    if (hall.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Hall is already approved",
      });
    }

    hall.status = "approved";
    hall.rejectionReason = null;
    hall.isAvailable = true;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall approved successfully",
      hall,
    });
  } catch (error) {
    console.error("Approve Hall Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   ADMIN - REJECT HALL
========================================================= */

const rejectHall = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    if (
      !reason ||
      typeof reason !== "string" ||
      reason.trim().length < 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A rejection reason of at least 5 characters is required",
      });
    }

    const hall = await Hall.findById(id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    if (hall.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted halls cannot be rejected",
      });
    }

    hall.status = "rejected";
    hall.rejectionReason = reason.trim();
    hall.isAvailable = false;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall rejected successfully",
      hall,
    });
  } catch (error) {
    console.error("Reject Hall Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   ADMIN - SUSPEND HALL
========================================================= */

const suspendHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findById(id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    if (hall.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted halls cannot be suspended",
      });
    }

    if (hall.status === "suspended") {
      return res.status(400).json({
        success: false,
        message: "Hall is already suspended",
      });
    }

    hall.status = "suspended";
    hall.isAvailable = false;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall suspended successfully",
      hall,
    });
  } catch (error) {
    console.error("Suspend Hall Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   ADMIN - ACTIVATE HALL
========================================================= */

const activateHall = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findById(id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    if (hall.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted halls cannot be activated",
      });
    }

    if (hall.status !== "suspended") {
      return res.status(400).json({
        success: false,
        message:
          "Only suspended halls can be activated",
      });
    }

    hall.status = "approved";
    hall.rejectionReason = null;
    hall.isAvailable = true;

    await hall.save();

    return res.status(200).json({
      success: true,
      message: "Hall activated successfully",
      hall,
    });
  } catch (error) {
    console.error("Activate Hall Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   PUBLIC - GET ALL APPROVED HALLS
========================================================= */

const getPublicHalls = async (req, res) => {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 12,
        1
      ),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {
      status: "approved",
      isAvailable: true,
      isDeleted: false,
    };

    /* =========================
       SEARCH
    ========================= */

    if (req.query.search?.trim()) {
      const search = req.query.search.trim();

      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          city: {
            $regex: search,
            $options: "i",
          },
        },
        {
          area: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /* =========================
       CITY
    ========================= */

    if (req.query.city?.trim()) {
      filter.city = {
        $regex: req.query.city.trim(),
        $options: "i",
      };
    }

    /* =========================
       AREA
    ========================= */

    if (req.query.area?.trim()) {
      filter.area = {
        $regex: req.query.area.trim(),
        $options: "i",
      };
    }

    /* =========================
       MIN PRICE
    ========================= */

    if (req.query.minPrice !== undefined) {
      const minPrice = Number(req.query.minPrice);

      if (!Number.isFinite(minPrice) || minPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid minPrice",
        });
      }

      filter.startingPrice = {
        $gte: minPrice,
      };
    }

    /* =========================
       MAX PRICE
    ========================= */

    if (req.query.maxPrice !== undefined) {
      const maxPrice = Number(req.query.maxPrice);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid maxPrice",
        });
      }

      if (filter.startingPrice) {
        filter.startingPrice.$lte = maxPrice;
      } else {
        filter.startingPrice = {
          $lte: maxPrice,
        };
      }
    }

    /* =========================
       CAPACITY
       Example:
       ?capacity=300
       means hall must support 300 people
    ========================= */

    if (req.query.capacity !== undefined) {
      const capacity = Number(req.query.capacity);

      if (!Number.isFinite(capacity) || capacity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid capacity",
        });
      }

      filter["capacity.min"] = {
        $lte: capacity,
      };

      filter["capacity.max"] = {
        $gte: capacity,
      };
    }

    /* =========================
       MIN RATING
    ========================= */

    if (req.query.minRating !== undefined) {
      const minRating = Number(req.query.minRating);

      if (
        !Number.isFinite(minRating) ||
        minRating < 0 ||
        minRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "minRating must be between 0 and 5",
        });
      }

      filter["rating.average"] = {
        $gte: minRating,
      };
    }

    /* =========================
       SORTING
    ========================= */

    const sortOptions = {
      newest: {
        createdAt: -1,
      },

      oldest: {
        createdAt: 1,
      },

      priceLow: {
        startingPrice: 1,
      },

      priceHigh: {
        startingPrice: -1,
      },

      ratingHigh: {
        "rating.average": -1,
        "rating.count": -1,
      },

      bookingsHigh: {
        totalBookings: -1,
      },
    };

    const sort =
      sortOptions[req.query.sort] ||
      sortOptions.newest;

    /* =========================
       QUERY
    ========================= */

    const [halls, total] = await Promise.all([
      Hall.find(filter)
        .select(
          "name description phone address city area capacity startingPrice currency features coverImage images rating totalBookings isFeatured createdAt updatedAt"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Hall.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,

      results: halls.length,

      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      filters: {
        search: req.query.search || null,
        city: req.query.city || null,
        area: req.query.area || null,
        minPrice:
          req.query.minPrice !== undefined
            ? Number(req.query.minPrice)
            : null,
        maxPrice:
          req.query.maxPrice !== undefined
            ? Number(req.query.maxPrice)
            : null,
        capacity:
          req.query.capacity !== undefined
            ? Number(req.query.capacity)
            : null,
        minRating:
          req.query.minRating !== undefined
            ? Number(req.query.minRating)
            : null,
        sort: req.query.sort || "newest",
      },

      halls,
    });
  } catch (error) {
    console.error(
      "Public Get All Halls Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =========================================================
   PUBLIC - GET HALL BY ID
========================================================= */

const getPublicHallById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      status: "approved",
      isAvailable: true,
      isDeleted: false,
    })
      .select(
        "name description phone address city area capacity startingPrice currency features coverImage images rating totalBookings isFeatured createdAt updatedAt"
      )
      .lean();

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    return res.status(200).json({
      success: true,
      hall,
    });
  } catch (error) {
    console.error(
      "Public Get Hall By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =========================================================
   CLOUDINARY UPLOAD HELPER
========================================================= */

const uploadToCloudinary = (
  buffer,
  folder
) => {
  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            {
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    streamifier
      .createReadStream(buffer)
      .pipe(stream);
  });
};


/* =========================================================
   OWNER - UPLOAD / UPDATE COVER IMAGE
========================================================= */

const uploadHallCover = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Cover image is required",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      `wedding-halls/${hall._id}/cover`
    );

    /* =========================
       DELETE OLD COVER
    ========================= */

    if (hall.coverImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(
          hall.coverImage.publicId,
          {
            resource_type: "image",
          }
        );
      } catch (deleteError) {
        console.error(
          "Old Cover Delete Error:",
          deleteError.message
        );
      }
    }

    hall.coverImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await hall.save();

    return res.status(200).json({
      success: true,
      message:
        "Hall cover image uploaded successfully",

      coverImage: hall.coverImage,
    });
  } catch (error) {
    console.error(
      "Upload Hall Cover Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   OWNER - ADD GALLERY IMAGES
========================================================= */

const addHallGalleryImages = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    if (
      !req.files ||
      req.files.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    const MAX_GALLERY_IMAGES = 20;

    if (
      hall.images.length +
        req.files.length >
      MAX_GALLERY_IMAGES
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Gallery cannot contain more than ${MAX_GALLERY_IMAGES} images`,
      });
    }

    const uploadedImages = [];

    try {
      for (const file of req.files) {
        const result =
          await uploadToCloudinary(
            file.buffer,
            `wedding-halls/${hall._id}/gallery`
          );

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          alt: hall.name,
          order:
            hall.images.length +
            uploadedImages.length,
        });
      }
    } catch (uploadError) {
      /*
        If one upload fails after previous
        images were uploaded, clean them up.
      */

      for (const image of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(
            image.publicId
          );
        } catch (cleanupError) {
          console.error(
            "Cloudinary Cleanup Error:",
            cleanupError.message
          );
        }
      }

      throw uploadError;
    }

    hall.images.push(...uploadedImages);

    await hall.save();

    return res.status(201).json({
      success: true,
      message:
        "Gallery images uploaded successfully",

      results: uploadedImages.length,

      images: hall.images,
    });
  } catch (error) {
    console.error(
      "Add Hall Gallery Images Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   OWNER - DELETE GALLERY IMAGE
========================================================= */

const deleteHallGalleryImage = async (
  req,
  res
) => {
  try {
    const {
      id,
      imageId,
    } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    const imageIndex =
      hall.images.findIndex(
        (image) =>
          image._id.toString() === imageId
      );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    const image =
      hall.images[imageIndex];

    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(
          image.publicId,
          {
            resource_type: "image",
          }
        );
      } catch (deleteError) {
        console.error(
          "Cloudinary Image Delete Error:",
          deleteError.message
        );
      }
    }

    hall.images.splice(imageIndex, 1);

    /* =========================
       REORDER IMAGES
    ========================= */

    hall.images.forEach(
      (item, index) => {
        item.order = index;
      }
    );

    await hall.save();

    return res.status(200).json({
      success: true,
      message:
        "Gallery image deleted successfully",

      images: hall.images,
    });
  } catch (error) {
    console.error(
      "Delete Hall Gallery Image Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   OWNER - DELETE COVER IMAGE
========================================================= */

const deleteHallCover = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    if (!hall.coverImage?.publicId) {
      return res.status(404).json({
        success: false,
        message: "Hall does not have a cover image",
      });
    }

    try {
      await cloudinary.uploader.destroy(
        hall.coverImage.publicId,
        {
          resource_type: "image",
        }
      );
    } catch (deleteError) {
      console.error(
        "Cloudinary Cover Delete Error:",
        deleteError.message
      );
    }

    hall.coverImage = {
      url: null,
      publicId: null,
    };

    await hall.save();

    return res.status(200).json({
      success: true,
      message:
        "Hall cover image deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Hall Cover Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   OWNER - REORDER GALLERY IMAGES
========================================================= */

const reorderHallGalleryImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageIds } = req.body;

    // =========================
    // VALIDATE HALL ID
    // =========================

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    // =========================
    // VALIDATE IMAGE IDS
    // =========================

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: "imageIds must be an array",
      });
    }

    const hall = await Hall.findOne({
      _id: id,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    // =========================
    // EMPTY GALLERY
    // =========================

    if (hall.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Hall gallery is empty",
      });
    }

    // =========================
    // SAME NUMBER OF IMAGES
    // =========================

    if (imageIds.length !== hall.images.length) {
      return res.status(400).json({
        success: false,
        message:
          "All gallery image IDs must be provided",
      });
    }

    // =========================
    // CHECK DUPLICATES
    // =========================

    const uniqueImageIds = new Set(
      imageIds.map(String)
    );

    if (
      uniqueImageIds.size !== imageIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate image IDs are not allowed",
      });
    }

    // =========================
    // CREATE IMAGE MAP
    // =========================

    const imageMap = new Map();

    hall.images.forEach((image) => {
      imageMap.set(
        image._id.toString(),
        image
      );
    });

    // =========================
    // VERIFY ALL IMAGES BELONG
    // TO THIS HALL
    // =========================

    for (const imageId of imageIds) {
      if (!imageMap.has(String(imageId))) {
        return res.status(400).json({
          success: false,
          message:
            "One or more image IDs do not belong to this hall",
        });
      }
    }

    // =========================
    // REORDER
    // =========================

    hall.images = imageIds.map(
      (imageId, index) => {
        const image =
          imageMap.get(String(imageId));

        image.order = index;

        return image;
      }
    );

    await hall.save();

    return res.status(200).json({
      success: true,
      message:
        "Gallery images reordered successfully",

      images: hall.images,
    });
  } catch (error) {
    console.error(
      "Reorder Hall Gallery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createHall,
  getMyHalls,
  getHallById,
  updateHall,
  deleteHall,
  restoreHall,

  getAllHalls,
  getAdminHallById,
  approveHall,
  rejectHall,
  suspendHall,
  activateHall,
  getPublicHalls,
  getPublicHallById,
  uploadHallCover,
  addHallGalleryImages,
  deleteHallGalleryImage,
  deleteHallCover,
  reorderHallGalleryImages,
};

