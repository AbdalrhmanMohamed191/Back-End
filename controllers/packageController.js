const mongoose = require("mongoose");
const Package = require("../models/Package");
const Hall = require("../models/Hall");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

const normalizeFeatures = (features) => {
  if (!Array.isArray(features)) {
    return [];
  }

  return [
    ...new Set(
      features
        .map((feature) => String(feature).trim())
        .filter(Boolean)
    ),
  ];
};

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  return defaultValue;
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const canPublishPackage = (hall) => {
  return (
    hall &&
    hall.isDeleted === false &&
    hall.status === "approved" &&
    hall.isAvailable === true
  );
};

/*
|--------------------------------------------------------------------------
| Create Package
|--------------------------------------------------------------------------
| POST /api/v1/packages
|--------------------------------------------------------------------------
*/

const createPackage = async (req, res) => {
  try {
    const {
      hallId,
      name,
      description,
      price,
      currency,
      minGuests,
      maxGuests,
      durationHours,
      features,
      sortOrder,
      isActive,
    } = req.body;

    if (!hallId || !isValidObjectId(hallId)) {
      return res.status(400).json({
        success: false,
        message: "Valid hallId is required",
      });
    }

    const hall = await Hall.findOne({
      _id: hallId,
      owner: req.user._id,
      isDeleted: false,
    }).select(
      "_id name owner status isAvailable isDeleted"
    );

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found or you do not own this hall",
      });
    }

    const parsedPrice = parseNumber(price);
    const parsedMinGuests = parseNumber(minGuests);
    const parsedMaxGuests = parseNumber(maxGuests);

    if (parsedPrice === null || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid package price is required",
      });
    }

    if (
      parsedMinGuests === null ||
      !Number.isInteger(parsedMinGuests) ||
      parsedMinGuests < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum guests must be a positive integer",
      });
    }

    if (
      parsedMaxGuests === null ||
      !Number.isInteger(parsedMaxGuests) ||
      parsedMaxGuests < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum guests must be a positive integer",
      });
    }

    if (parsedMinGuests > parsedMaxGuests) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum guests cannot be greater than maximum guests",
      });
    }

    let parsedDurationHours = null;

    if (
      durationHours !== undefined &&
      durationHours !== null &&
      durationHours !== ""
    ) {
      parsedDurationHours = parseNumber(durationHours);

      if (
        parsedDurationHours === null ||
        parsedDurationHours < 0.5 ||
        parsedDurationHours > 24
      ) {
        return res.status(400).json({
          success: false,
          message: "Duration must be between 0.5 and 24 hours",
        });
      }
    }

    let parsedSortOrder = 0;

    if (
      sortOrder !== undefined &&
      sortOrder !== null &&
      sortOrder !== ""
    ) {
      parsedSortOrder = parseNumber(sortOrder);

      if (
        parsedSortOrder === null ||
        !Number.isInteger(parsedSortOrder) ||
        parsedSortOrder < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Sort order must be a non-negative integer",
        });
      }
    }

    const requestedIsActive = parseBoolean(isActive, true);

    const finalIsActive = canPublishPackage(hall)
      ? requestedIsActive
      : false;

    const newPackage = await Package.create({
      hall: hallId,
      name,
      description,
      price: parsedPrice,
      currency: currency || "EGP",
      minGuests: parsedMinGuests,
      maxGuests: parsedMaxGuests,
      durationHours: parsedDurationHours,
      features: normalizeFeatures(features),
      sortOrder: parsedSortOrder,
      isActive: finalIsActive,
    });

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      package: newPackage,
    });
  } catch (error) {
    console.error("Create Package Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get My Packages
|--------------------------------------------------------------------------
| GET /api/v1/packages/my
|--------------------------------------------------------------------------
*/

const getMyPackages = async (req, res) => {
  try {
    const {
      hallId,
      active,
      includeDeleted,
      page = 1,
      limit = 20,
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      50
    );

    const hallFilter = {
      owner: req.user._id,
    };

    if (includeDeleted !== "true") {
      hallFilter.isDeleted = false;
    }

    if (hallId) {
      if (!isValidObjectId(hallId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hallId",
        });
      }

      hallFilter._id = hallId;
    }

    const halls = await Hall.find(hallFilter)
      .select("_id name status isAvailable isDeleted")
      .lean();

    const hallIds = halls.map((hall) => hall._id);

    if (hallIds.length === 0) {
      return res.status(200).json({
        success: true,
        packages: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          pages: 0,
        },
      });
    }

    const filter = {
      hall: { $in: hallIds },
    };

    if (includeDeleted !== "true") {
      filter.isDeleted = false;
    }

    if (active === "true") {
      filter.isActive = true;
    }

    if (active === "false") {
      filter.isActive = false;
    }

    const total = await Package.countDocuments(filter);

    const packages = await Package.find(filter)
      .populate({
        path: "hall",
        select: "name status isAvailable isDeleted",
      })
      .sort({
        hall: 1,
        sortOrder: 1,
        createdAt: -1,
      })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .lean();

    return res.status(200).json({
      success: true,
      packages,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Get My Packages Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Package By ID
|--------------------------------------------------------------------------
| GET /api/v1/packages/:id
|--------------------------------------------------------------------------
*/

const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const packageData = await Package.findOne({
      _id: id,
      isDeleted: false,
    }).populate({
      path: "hall",
      select:
        "name description owner phone secondaryPhone address city area capacity startingPrice currency status isAvailable isDeleted",
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (
      req.user.role === "hallOwner" &&
      String(packageData.hall.owner) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this package",
      });
    }

    return res.status(200).json({
      success: true,
      package: packageData,
    });
  } catch (error) {
    console.error("Get Package Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Update Package
|--------------------------------------------------------------------------
| PATCH /api/v1/packages/:id
|--------------------------------------------------------------------------
*/

const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const packageData = await Package.findOne({
      _id: id,
      isDeleted: false,
    }).populate({
      path: "hall",
      select: "_id owner status isAvailable isDeleted",
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (
      req.user.role === "hallOwner" &&
      String(packageData.hall.owner) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this package",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "currency",
      "minGuests",
      "maxGuests",
      "durationHours",
      "sortOrder",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        packageData[field] = req.body[field];
      }
    });

    if (req.body.features !== undefined) {
      packageData.features = normalizeFeatures(req.body.features);
    }

    if (req.body.price !== undefined) {
      const parsedPrice = parseNumber(req.body.price);

      if (parsedPrice === null || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Valid package price is required",
        });
      }

      packageData.price = parsedPrice;
    }

    if (
      req.body.minGuests !== undefined ||
      req.body.maxGuests !== undefined
    ) {
      const minGuests = parseNumber(
        req.body.minGuests !== undefined
          ? req.body.minGuests
          : packageData.minGuests
      );

      const maxGuests = parseNumber(
        req.body.maxGuests !== undefined
          ? req.body.maxGuests
          : packageData.maxGuests
      );

      if (
        minGuests === null ||
        !Number.isInteger(minGuests) ||
        minGuests < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum guests must be a positive integer",
        });
      }

      if (
        maxGuests === null ||
        !Number.isInteger(maxGuests) ||
        maxGuests < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum guests must be a positive integer",
        });
      }

      if (minGuests > maxGuests) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum guests cannot be greater than maximum guests",
        });
      }

      packageData.minGuests = minGuests;
      packageData.maxGuests = maxGuests;
    }

    if (req.body.durationHours !== undefined) {
      if (
        req.body.durationHours === "" ||
        req.body.durationHours === null
      ) {
        packageData.durationHours = null;
      } else {
        const parsedDuration = parseNumber(
          req.body.durationHours
        );

        if (
          parsedDuration === null ||
          parsedDuration < 0.5 ||
          parsedDuration > 24
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Duration must be between 0.5 and 24 hours",
          });
        }

        packageData.durationHours = parsedDuration;
      }
    }

    if (req.body.sortOrder !== undefined) {
      if (
        req.body.sortOrder === "" ||
        req.body.sortOrder === null
      ) {
        packageData.sortOrder = 0;
      } else {
        const parsedSortOrder = parseNumber(
          req.body.sortOrder
        );

        if (
          parsedSortOrder === null ||
          !Number.isInteger(parsedSortOrder) ||
          parsedSortOrder < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Sort order must be a non-negative integer",
          });
        }

        packageData.sortOrder = parsedSortOrder;
      }
    }

    if (req.body.isActive !== undefined) {
      const requestedIsActive = parseBoolean(
        req.body.isActive,
        packageData.isActive
      );

      if (
        requestedIsActive &&
        !canPublishPackage(packageData.hall)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot activate a package while its hall is not approved and available",
        });
      }

      packageData.isActive = requestedIsActive;
    }

    await packageData.save();

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      package: packageData,
    });
  } catch (error) {
    console.error("Update Package Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Delete Package
|--------------------------------------------------------------------------
| DELETE /api/v1/packages/:id
|--------------------------------------------------------------------------
*/

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const packageData = await Package.findOne({
      _id: id,
      isDeleted: false,
    }).populate({
      path: "hall",
      select: "owner",
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (
      req.user.role === "hallOwner" &&
      String(packageData.hall.owner) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete this package",
      });
    }

    packageData.isDeleted = true;
    packageData.deletedAt = new Date();
    packageData.isActive = false;

    await packageData.save();

    return res.status(200).json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("Delete Package Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Restore Package
|--------------------------------------------------------------------------
| PATCH /api/v1/packages/:id/restore
|--------------------------------------------------------------------------
*/

const restorePackage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const packageData = await Package.findOne({
      _id: id,
      isDeleted: true,
    }).populate({
      path: "hall",
      select:
        "owner isDeleted status isAvailable",
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Deleted package not found",
      });
    }

    if (
      req.user.role === "hallOwner" &&
      String(packageData.hall.owner) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to restore this package",
      });
    }

    if (packageData.hall.isDeleted) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot restore a package belonging to a deleted hall",
      });
    }

    packageData.isDeleted = false;
    packageData.deletedAt = null;

    packageData.isActive = canPublishPackage(
      packageData.hall
    );

    await packageData.save();

    return res.status(200).json({
      success: true,
      message: "Package restored successfully",
      package: packageData,
    });
  } catch (error) {
    console.error("Restore Package Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Get Public Hall Packages
|--------------------------------------------------------------------------
| GET /api/v1/packages/public/hall/:hallId
|--------------------------------------------------------------------------
*/

const getPublicHallPackages = async (req, res) => {
  try {
    const { hallId } = req.params;

    if (!isValidObjectId(hallId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: hallId,
      status: "approved",
      isAvailable: true,
      isDeleted: false,
    })
      .select("_id name status isAvailable")
      .lean();

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    const packages = await Package.find({
      hall: hallId,
      isActive: true,
      isDeleted: false,
    })
      .select(
        "name description price currency minGuests maxGuests durationHours features image sortOrder"
      )
      .sort({
        sortOrder: 1,
        price: 1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      hall,
      packages,
    });
  } catch (error) {
    console.error(
      "Get Public Hall Packages Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Toggle Package Active Status
|--------------------------------------------------------------------------
| PATCH /api/v1/packages/:id/toggle-active
|--------------------------------------------------------------------------
*/

const togglePackageActive = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const packageData = await Package.findOne({
      _id: id,
      isDeleted: false,
    }).populate({
      path: "hall",
      select:
        "owner isDeleted status isAvailable",
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    if (
      req.user.role === "hallOwner" &&
      String(packageData.hall.owner) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to change this package",
      });
    }

    if (packageData.hall.isDeleted) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot activate a package from a deleted hall",
      });
    }

    if (!packageData.isActive) {
      if (!canPublishPackage(packageData.hall)) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot activate this package because its hall is not approved and available",
        });
      }

      packageData.isActive = true;
    } else {
      packageData.isActive = false;
    }

    await packageData.save();

    return res.status(200).json({
      success: true,
      message: packageData.isActive
        ? "Package activated successfully"
        : "Package deactivated successfully",
      package: packageData,
    });
  } catch (error) {
    console.error(
      "Toggle Package Active Error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createPackage,
  getMyPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  restorePackage,
  getPublicHallPackages,
  togglePackageActive,
};
