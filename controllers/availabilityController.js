// const mongoose = require("mongoose");

// const Availability = require("../models/Availability");
// const Hall = require("../models/Hall");
// const Booking = require("../models/Booking");

// /*
// |--------------------------------------------------------------------------
// | Helpers
// |--------------------------------------------------------------------------
// */

// const isValidObjectId = (id) => {
//   return mongoose.isValidObjectId(id);
// };

// const normalizeDate = (date) => {
//   const parsedDate = new Date(date);

//   if (Number.isNaN(parsedDate.getTime())) {
//     return null;
//   }

//   parsedDate.setUTCHours(0, 0, 0, 0);

//   return parsedDate;
// };

// const isPastDate = (date) => {
//   const today = new Date();

//   today.setUTCHours(0, 0, 0, 0);

//   return date < today;
// };

// const getDateRange = (from, to) => {
//   const range = {};

//   if (from) {
//     const fromDate = normalizeDate(from);

//     if (!fromDate) {
//       return {
//         error: "Invalid from date",
//       };
//     }

//     range.$gte = fromDate;
//   }

//   if (to) {
//     const toDate = normalizeDate(to);

//     if (!toDate) {
//       return {
//         error: "Invalid to date",
//       };
//     }

//     range.$lte = toDate;
//   }

//   if (
//     range.$gte &&
//     range.$lte &&
//     range.$gte > range.$lte
//   ) {
//     return {
//       error: "From date cannot be after to date",
//     };
//   }

//   return range;
// };

// /*
// |--------------------------------------------------------------------------
// | Create / Update Availability
// |--------------------------------------------------------------------------
// | PUT /api/v1/availability
// |--------------------------------------------------------------------------
// */

// const upsertAvailability = async (req, res) => {
//   try {
//     const {
//       hallId,
//       date,
//       status = "available",
//       price,
//       reason,
//       notes,
//     } = req.body;

//     /*
//     |--------------------------------------------------------------------------
//     | Validate hall
//     |--------------------------------------------------------------------------
//     */

//     if (!hallId || !isValidObjectId(hallId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid hallId is required",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Validate date
//     |--------------------------------------------------------------------------
//     */

//     const normalizedDate = normalizeDate(date);

//     if (!normalizedDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid date is required",
//       });
//     }

//     if (isPastDate(normalizedDate)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Cannot modify availability for a past date",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Validate status
//     |--------------------------------------------------------------------------
//     */

//     if (!["available", "blocked"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid availability status",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Owner protection
//     |--------------------------------------------------------------------------
//     */

//     const hall = await Hall.findOne({
//       _id: hallId,
//       owner: req.user._id,
//       isDeleted: false,
//     }).select(
//       "_id name owner status isAvailable isDeleted"
//     );

//     if (!hall) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Hall not found or you do not own this hall",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Do not allow blocking a booked date
//     |--------------------------------------------------------------------------
//     */

//     if (status === "blocked") {
//       const activeBooking = await Booking.findOne({
//         hall: hallId,
//         eventDate: normalizedDate,
//         status: {
//           $in: ["pending", "confirmed"],
//         },
//       }).select("_id status eventDate");

//       if (activeBooking) {
//         return res.status(409).json({
//           success: false,
//           message:
//             activeBooking.status === "confirmed"
//               ? "Cannot block this date because it already has a confirmed booking"
//               : "Cannot block this date because it has a pending booking",
//           bookingStatus: activeBooking.status,
//         });
//       }
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Price validation
//     |--------------------------------------------------------------------------
//     */

//     let normalizedPrice = null;

//     if (
//       status === "available" &&
//       price !== undefined &&
//       price !== null &&
//       price !== ""
//     ) {
//       normalizedPrice = Number(price);

//       if (
//         Number.isNaN(normalizedPrice) ||
//         normalizedPrice < 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Price must be a valid non-negative number",
//         });
//       }
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Prepare data
//     |--------------------------------------------------------------------------
//     */

//     const updateData = {
//       hall: hallId,
//       date: normalizedDate,
//       status,
//       price: normalizedPrice,

//       reason:
//         status === "blocked"
//           ? typeof reason === "string" &&
//             reason.trim()
//             ? reason.trim()
//             : null
//           : null,

//       notes:
//         typeof notes === "string" &&
//         notes.trim()
//           ? notes.trim()
//           : null,
//     };

//     /*
//     |--------------------------------------------------------------------------
//     | Upsert
//     |--------------------------------------------------------------------------
//     */

//     const availability =
//       await Availability.findOneAndUpdate(
//         {
//           hall: hallId,
//           date: normalizedDate,
//         },
//         updateData,
//         {
//           new: true,
//           upsert: true,
//           runValidators: true,
//           setDefaultsOnInsert: true,
//         }
//       );

//     return res.status(200).json({
//       success: true,
//       message: "Availability saved successfully",
//       availability,
//     });
//   } catch (error) {
//     console.error(
//       "Upsert Availability Error:",
//       error
//     );

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "Availability already exists for this hall and date",
//       });
//     }

//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         errors: Object.values(error.errors).map(
//           (item) => item.message
//         ),
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /*
// |--------------------------------------------------------------------------
// | Get Hall Calendar
// |--------------------------------------------------------------------------
// | GET /api/v1/availability/my/hall/:hallId
// |--------------------------------------------------------------------------
// |
// | Calendar status is calculated from:
// |
// | Booking:
// |   pending   -> pending
// |   confirmed -> booked
// |
// | Availability:
// |   blocked   -> blocked
// |
// | Otherwise:
// |   available
// |
// */

// const getMyHallCalendar = async (req, res) => {
//   try {
//     const { hallId } = req.params;
//     const { from, to } = req.query;

//     /*
//     |--------------------------------------------------------------------------
//     | Validate hall ID
//     |--------------------------------------------------------------------------
//     */

//     if (!isValidObjectId(hallId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid hall ID",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Verify ownership
//     |--------------------------------------------------------------------------
//     */

//     const hall = await Hall.findOne({
//       _id: hallId,
//       owner: req.user._id,
//       isDeleted: false,
//     }).select(
//       "_id name status isAvailable"
//     );

//     if (!hall) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Hall not found or you do not own this hall",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Date range
//     |--------------------------------------------------------------------------
//     */

//     const dateRange = getDateRange(from, to);

//     if (dateRange.error) {
//       return res.status(400).json({
//         success: false,
//         message: dateRange.error,
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Build filters
//     |--------------------------------------------------------------------------
//     */

//     const availabilityFilter = {
//       hall: hallId,
//     };

//     const bookingFilter = {
//       hall: hallId,
//       status: {
//         $in: ["pending", "confirmed"],
//       },
//     };

//     if (Object.keys(dateRange).length > 0) {
//       availabilityFilter.date = dateRange;
//       bookingFilter.eventDate = dateRange;
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Get Availability + Active Bookings
//     |--------------------------------------------------------------------------
//     */

//     const [
//       availabilityRecords,
//       bookings,
//     ] = await Promise.all([
//       Availability.find(
//         availabilityFilter
//       )
//         .select(
//           "hall date status price reason notes"
//         )
//         .sort({ date: 1 })
//         .lean(),

//       Booking.find(bookingFilter)
//         .select(
//           "hall eventDate status guests totalAmount currency customerName customerPhone package"
//         )
//         .populate({
//           path: "package",
//           select:
//             "name price durationHours",
//         })
//         .sort({ eventDate: 1 })
//         .lean(),
//     ]);

//     /*
//     |--------------------------------------------------------------------------
//     | Convert records to Maps
//     |--------------------------------------------------------------------------
//     */

//     const availabilityMap = new Map();

//     for (const item of availabilityRecords) {
//       const key = formatDate(item.date);

//       availabilityMap.set(key, item);
//     }

//     const bookingMap = new Map();

//     for (const booking of bookings) {
//       const key = formatDate(booking.eventDate);

//       bookingMap.set(key, booking);
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Merge Calendar
//     |--------------------------------------------------------------------------
//     */

//     const dates = new Set([
//       ...availabilityMap.keys(),
//       ...bookingMap.keys(),
//     ]);

//     const calendar = Array.from(dates)
//       .sort()
//       .map((date) => {
//         const availability =
//           availabilityMap.get(date);

//         const booking =
//           bookingMap.get(date);

//         /*
//         |--------------------------------------------------------------------------
//         | Booking always wins over availability
//         |--------------------------------------------------------------------------
//         */

//         if (booking) {
//           return {
//             date,

//             status: "booked",

//             availability: availability || null,

//             booking: {
//               _id: booking._id,
//               status: booking.status,
//               guests: booking.guests,
//               totalAmount:
//                 booking.totalAmount,
//               currency:
//                 booking.currency,
//               customerName:
//                 booking.customerName,
//               customerPhone:
//                 booking.customerPhone,
//               package:
//                 booking.package || null,
//             },
//           };
//         }

//         /*
//         |--------------------------------------------------------------------------
//         | Blocked
//         |--------------------------------------------------------------------------
//         */

//         if (
//           availability &&
//           availability.status === "blocked"
//         ) {
//           return {
//             date,
//             status: "blocked",

//             availability: {
//               _id: availability._id,
//               status:
//                 availability.status,
//               price: availability.price,
//               reason: availability.reason,
//               notes: availability.notes,
//             },

//             booking: null,
//           };
//         }

//         /*
//         |--------------------------------------------------------------------------
//         | Available
//         |--------------------------------------------------------------------------
//         */

//         return {
//           date,
//           status: "available",

//           availability: availability
//             ? {
//                 _id: availability._id,
//                 status:
//                   availability.status,
//                 price: availability.price,
//                 reason: availability.reason,
//                 notes: availability.notes,
//               }
//             : null,

//           booking: null,
//         };
//       });

//     return res.status(200).json({
//       success: true,

//       hall,

//       calendar,

//       summary: {
//         available: calendar.filter(
//           (item) =>
//             item.status === "available"
//         ).length,

//         blocked: calendar.filter(
//           (item) =>
//             item.status === "blocked"
//         ).length,

//         pending: calendar.filter(
//           (item) =>
//             item.status === "pending"
//         ).length,

//         booked: calendar.filter(
//           (item) =>
//             item.status === "booked"
//         ).length,
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Get My Hall Calendar Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /*
// |--------------------------------------------------------------------------
// | Delete Availability
// |--------------------------------------------------------------------------
// | DELETE /api/v1/availability/:id
// |--------------------------------------------------------------------------
// |
// | Deleting an availability record means:
// | the date returns to its default state:
// | Available
// |
// */

// const deleteAvailability = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid availability ID",
//       });
//     }

//     const availability =
//       await Availability.findById(id);

//     if (!availability) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Availability record not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Verify hall ownership
//     |--------------------------------------------------------------------------
//     */

//     const hall = await Hall.findOne({
//       _id: availability.hall,
//       owner: req.user._id,
//       isDeleted: false,
//     }).select("_id owner");

//     if (!hall) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to delete this record",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Do not delete a blocked record if an active booking appeared
//     |--------------------------------------------------------------------------
//     */

//     const activeBooking =
//       await Booking.findOne({
//         hall: availability.hall,
//         eventDate: availability.date,
//         status: {
//           $in: ["pending", "confirmed"],
//         },
//       }).select("_id status");

//     if (activeBooking) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "This date has an active booking and cannot be changed",
//         bookingStatus:
//           activeBooking.status,
//       });
//     }

//     await Availability.deleteOne({
//       _id: availability._id,
//     });

//     return res.status(200).json({
//       success: true,
//       message:
//         "Availability record deleted successfully",
//     });
//   } catch (error) {
//     console.error(
//       "Delete Availability Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /*
// |--------------------------------------------------------------------------
// | Get Public Hall Calendar
// |--------------------------------------------------------------------------
// | GET /api/v1/availability/public/hall/:hallId
// |--------------------------------------------------------------------------
// */

// const getPublicHallCalendar = async (req, res) => {
//   try {
//     const { hallId } = req.params;
//     const { from, to } = req.query;

//     if (!isValidObjectId(hallId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid hall ID",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Only approved + available halls
//     |--------------------------------------------------------------------------
//     */

//     const hall = await Hall.findOne({
//       _id: hallId,
//       status: "approved",
//       isAvailable: true,
//       isDeleted: false,
//     }).select(
//       "_id name startingPrice currency"
//     );

//     if (!hall) {
//       return res.status(404).json({
//         success: false,
//         message: "Hall not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Date range
//     |--------------------------------------------------------------------------
//     */

//     const dateRange = getDateRange(from, to);

//     if (dateRange.error) {
//       return res.status(400).json({
//         success: false,
//         message: dateRange.error,
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Availability
//     |--------------------------------------------------------------------------
//     */

//     const availabilityFilter = {
//       hall: hallId,
//     };

//     if (Object.keys(dateRange).length > 0) {
//       availabilityFilter.date = dateRange;
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Active bookings
//     |--------------------------------------------------------------------------
//     */

//     const bookingFilter = {
//       hall: hallId,
//       status: {
//         $in: ["pending", "confirmed"],
//       },
//     };

//     if (Object.keys(dateRange).length > 0) {
//       bookingFilter.eventDate = dateRange;
//     }

//     const [
//       availabilityRecords,
//       bookings,
//     ] = await Promise.all([
//       Availability.find(
//         availabilityFilter
//       )
//         .select(
//           "date status price reason"
//         )
//         .sort({ date: 1 })
//         .lean(),

//       Booking.find(bookingFilter)
//         .select(
//           "eventDate status"
//         )
//         .sort({ eventDate: 1 })
//         .lean(),
//     ]);

//     /*
//     |--------------------------------------------------------------------------
//     | Build maps
//     |--------------------------------------------------------------------------
//     */

//     const availabilityMap = new Map();

//     for (const item of availabilityRecords) {
//       availabilityMap.set(
//         formatDate(item.date),
//         item
//       );
//     }

//     const bookingMap = new Map();

//     for (const booking of bookings) {
//       bookingMap.set(
//         formatDate(booking.eventDate),
//         booking
//       );
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Merge public calendar
//     |--------------------------------------------------------------------------
//     */

//     const dates = new Set([
//       ...availabilityMap.keys(),
//       ...bookingMap.keys(),
//     ]);

//     const calendar = Array.from(dates)
//       .sort()
//       .map((date) => {
//         const availability =
//           availabilityMap.get(date);

//         const booking =
//           bookingMap.get(date);

//         /*
//         |--------------------------------------------------------------------------
//         | Do not expose customer information publicly
//         |--------------------------------------------------------------------------
//         */

//         if (booking) {
//           return {
//             date,

//             status:
//               booking.status === "confirmed"
//                 ? "booked"
//                 : "pending",

//             price:
//               availability &&
//               availability.price !== null
//                 ? availability.price
//                 : null,
//           };
//         }

//         if (
//           availability &&
//           availability.status === "blocked"
//         ) {
//           return {
//             date,
//             status: "blocked",
//             price: null,
//           };
//         }

//         return {
//           date,
//           status: "available",
//           price:
//             availability &&
//             availability.price !== null
//               ? availability.price
//               : null,
//         };
//       });

//     return res.status(200).json({
//       success: true,
//       hall,
//       calendar,
//     });
//   } catch (error) {
//     console.error(
//       "Get Public Hall Calendar Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /*
// |--------------------------------------------------------------------------
// | Format Date
// |--------------------------------------------------------------------------
// */

// const formatDate = (date) => {
//   return new Date(date)
//     .toISOString()
//     .slice(0, 10);
// };

// /*
// |--------------------------------------------------------------------------
// | Exports
// |--------------------------------------------------------------------------
// */

// module.exports = {
//   upsertAvailability,
//   getMyHallCalendar,
//   deleteAvailability,
//   getPublicHallCalendar,
// };


const mongoose = require("mongoose");

const Availability = require("../models/Availability");
const Hall = require("../models/Hall");
const Booking = require("../models/Booking");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

const normalizeDate = (date) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setUTCHours(0, 0, 0, 0);

  return parsedDate;
};

const isPastDate = (date) => {
  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);

  return date < today;
};

const getDateRange = (from, to) => {
  const range = {};

  if (from) {
    const fromDate = normalizeDate(from);

    if (!fromDate) {
      return {
        error: "Invalid from date",
      };
    }

    range.$gte = fromDate;
  }

  if (to) {
    const toDate = normalizeDate(to);

    if (!toDate) {
      return {
        error: "Invalid to date",
      };
    }

    range.$lte = toDate;
  }

  if (
    range.$gte &&
    range.$lte &&
    range.$gte > range.$lte
  ) {
    return {
      error: "From date cannot be after to date",
    };
  }

  return range;
};

const formatDate = (date) => {
  return new Date(date)
    .toISOString()
    .slice(0, 10);
};

/*
|--------------------------------------------------------------------------
| Create / Update Availability
|--------------------------------------------------------------------------
| PUT /api/v1/availability
|--------------------------------------------------------------------------
*/

const upsertAvailability = async (req, res) => {
  try {
    const {
      hallId,
      date,
      status = "available",
      price,
      reason,
      notes,
    } = req.body;

    if (!hallId || !isValidObjectId(hallId)) {
      return res.status(400).json({
        success: false,
        message: "Valid hallId is required",
      });
    }

    const normalizedDate = normalizeDate(date);

    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required",
      });
    }

    if (isPastDate(normalizedDate)) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot modify availability for a past date",
      });
    }

    if (!["available", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability status",
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
        message:
          "Hall not found or you do not own this hall",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Do not allow blocking an already booked date
    |--------------------------------------------------------------------------
    */

    if (status === "blocked") {
      const activeBooking = await Booking.findOne({
        hall: hallId,
        eventDate: normalizedDate,
        status: {
          $in: ["pending", "confirmed"],
        },
      }).select("_id status eventDate");

      if (activeBooking) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot block this date because it already has an active booking",
          bookingStatus: activeBooking.status,
        });
      }
    }

    let normalizedPrice = null;

    if (
      status === "available" &&
      price !== undefined &&
      price !== null &&
      price !== ""
    ) {
      normalizedPrice = Number(price);

      if (
        Number.isNaN(normalizedPrice) ||
        normalizedPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price must be a valid non-negative number",
        });
      }
    }

    const updateData = {
      hall: hallId,
      date: normalizedDate,
      status,
      price: normalizedPrice,

      reason:
        status === "blocked"
          ? typeof reason === "string" &&
            reason.trim()
            ? reason.trim()
            : null
          : null,

      notes:
        typeof notes === "string" &&
        notes.trim()
          ? notes.trim()
          : null,
    };

    const availability =
      await Availability.findOneAndUpdate(
        {
          hall: hallId,
          date: normalizedDate,
        },
        updateData,
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Availability saved successfully",
      availability,
    });
  } catch (error) {
    console.error(
      "Upsert Availability Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Availability already exists for this hall and date",
      });
    }

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
| Get Owner Hall Calendar
|--------------------------------------------------------------------------
| GET /api/v1/availability/my/hall/:hallId
|--------------------------------------------------------------------------
|
| ACTIVE BOOKING:
|
| pending   -> booked
| confirmed -> booked
|
| Payment status has NO effect on availability.
|
| completed / cancelled / rejected
| do NOT occupy the date.
|--------------------------------------------------------------------------
*/

const getMyHallCalendar = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { from, to } = req.query;

    if (!isValidObjectId(hallId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const hall = await Hall.findOne({
      _id: hallId,
      owner: req.user._id,
      isDeleted: false,
    }).select(
      "_id name status isAvailable"
    );

    if (!hall) {
      return res.status(404).json({
        success: false,
        message:
          "Hall not found or you do not own this hall",
      });
    }

    const dateRange = getDateRange(from, to);

    if (dateRange.error) {
      return res.status(400).json({
        success: false,
        message: dateRange.error,
      });
    }

    const availabilityFilter = {
      hall: hallId,
    };

    const bookingFilter = {
      hall: hallId,

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      | Any pending OR confirmed booking occupies the date.
      | paymentStatus is intentionally NOT checked.
      |--------------------------------------------------------------------------
      */

      status: {
        $in: ["pending", "confirmed"],
      },
    };

    if (Object.keys(dateRange).length > 0) {
      availabilityFilter.date = dateRange;
      bookingFilter.eventDate = dateRange;
    }

    const [
      availabilityRecords,
      bookings,
    ] = await Promise.all([
      Availability.find(
        availabilityFilter
      )
        .select(
          "hall date status price reason notes"
        )
        .sort({ date: 1 })
        .lean(),

      Booking.find(bookingFilter)
        .select(
          "hall eventDate status guests totalAmount currency customerName customerPhone package"
        )
        .populate({
          path: "package",
          select:
            "name price durationHours",
        })
        .sort({ eventDate: 1 })
        .lean(),
    ]);

    const availabilityMap = new Map();

    for (const item of availabilityRecords) {
      const key = formatDate(item.date);

      availabilityMap.set(key, item);
    }

    const bookingMap = new Map();

    for (const booking of bookings) {
      const key = formatDate(
        booking.eventDate
      );

      bookingMap.set(key, booking);
    }

    const dates = new Set([
      ...availabilityMap.keys(),
      ...bookingMap.keys(),
    ]);

    const calendar = Array.from(dates)
      .sort()
      .map((date) => {
        const availability =
          availabilityMap.get(date);

        const booking =
          bookingMap.get(date);

        /*
        |--------------------------------------------------------------------------
        | ACTIVE BOOKING ALWAYS WINS
        |--------------------------------------------------------------------------
        */

        if (booking) {
          return {
            date,

            /*
            |--------------------------------------------------------------------------
            | pending + confirmed = BOOKED
            |--------------------------------------------------------------------------
            */

            status: "booked",

            availability:
              availability || null,

            booking: {
              _id: booking._id,

              /*
              | Keep the real booking status
              | for owner details.
              */

              status: booking.status,

              guests: booking.guests,

              totalAmount:
                booking.totalAmount,

              currency:
                booking.currency,

              customerName:
                booking.customerName,

              customerPhone:
                booking.customerPhone,

              package:
                booking.package || null,
            },
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Hall manually blocked
        |--------------------------------------------------------------------------
        */

        if (
          availability &&
          availability.status === "blocked"
        ) {
          return {
            date,
            status: "blocked",

            availability: {
              _id: availability._id,
              status:
                availability.status,
              price: availability.price,
              reason: availability.reason,
              notes: availability.notes,
            },

            booking: null,
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Available
        |--------------------------------------------------------------------------
        */

        return {
          date,
          status: "available",

          availability:
            availability
              ? {
                  _id:
                    availability._id,
                  status:
                    availability.status,
                  price:
                    availability.price,
                  reason:
                    availability.reason,
                  notes:
                    availability.notes,
                }
              : null,

          booking: null,
        };
      });

    return res.status(200).json({
      success: true,

      hall,

      calendar,

      summary: {
        available: calendar.filter(
          (item) =>
            item.status === "available"
        ).length,

        blocked: calendar.filter(
          (item) =>
            item.status === "blocked"
        ).length,

        pending: 0,

        /*
        |--------------------------------------------------------------------------
        | Both pending and confirmed bookings
        | are counted as booked.
        |--------------------------------------------------------------------------
        */

        booked: calendar.filter(
          (item) =>
            item.status === "booked"
        ).length,
      },
    });
  } catch (error) {
    console.error(
      "Get My Hall Calendar Error:",
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
| Delete Availability
|--------------------------------------------------------------------------
| DELETE /api/v1/availability/:id
|--------------------------------------------------------------------------
*/

const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability ID",
      });
    }

    const availability =
      await Availability.findById(id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message:
          "Availability record not found",
      });
    }

    const hall = await Hall.findOne({
      _id: availability.hall,
      owner: req.user._id,
      isDeleted: false,
    }).select("_id owner");

    if (!hall) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete this record",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Cannot unblock a date with an active booking
    |--------------------------------------------------------------------------
    */

    const activeBooking =
      await Booking.findOne({
        hall: availability.hall,
        eventDate: availability.date,
        status: {
          $in: ["pending", "confirmed"],
        },
      }).select("_id status");

    if (activeBooking) {
      return res.status(409).json({
        success: false,
        message:
          "This date has an active booking and cannot be changed",
        bookingStatus:
          activeBooking.status,
      });
    }

    await Availability.deleteOne({
      _id: availability._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Availability record deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Availability Error:",
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
| Get Public Hall Calendar
|--------------------------------------------------------------------------
| GET /api/v1/availability/public/hall/:hallId
|--------------------------------------------------------------------------
|
| pending   -> booked
| confirmed -> booked
|
| Payment status does NOT matter.
|--------------------------------------------------------------------------
*/

const getPublicHallCalendar = async (req, res) => {
  try {
    const { hallId } = req.params;
    const { from, to } = req.query;

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
    }).select(
      "_id name startingPrice currency"
    );

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    const dateRange = getDateRange(from, to);

    if (dateRange.error) {
      return res.status(400).json({
        success: false,
        message: dateRange.error,
      });
    }

    const availabilityFilter = {
      hall: hallId,
    };

    const bookingFilter = {
      hall: hallId,

      /*
      |--------------------------------------------------------------------------
      | Any active booking blocks the date.
      |--------------------------------------------------------------------------
      */

      status: {
        $in: ["pending", "confirmed"],
      },
    };

    if (Object.keys(dateRange).length > 0) {
      availabilityFilter.date = dateRange;
      bookingFilter.eventDate = dateRange;
    }

    const [
      availabilityRecords,
      bookings,
    ] = await Promise.all([
      Availability.find(
        availabilityFilter
      )
        .select(
          "date status price reason"
        )
        .sort({ date: 1 })
        .lean(),

      Booking.find(bookingFilter)
        .select(
          "eventDate status"
        )
        .sort({ eventDate: 1 })
        .lean(),
    ]);

    const availabilityMap = new Map();

    for (const item of availabilityRecords) {
      availabilityMap.set(
        formatDate(item.date),
        item
      );
    }

    const bookingMap = new Map();

    for (const booking of bookings) {
      bookingMap.set(
        formatDate(booking.eventDate),
        booking
      );
    }

    const dates = new Set([
      ...availabilityMap.keys(),
      ...bookingMap.keys(),
    ]);

    const calendar = Array.from(dates)
      .sort()
      .map((date) => {
        const availability =
          availabilityMap.get(date);

        const booking =
          bookingMap.get(date);

        /*
        |--------------------------------------------------------------------------
        | BOOKING ALWAYS WINS
        |--------------------------------------------------------------------------
        */

        if (booking) {
          return {
            date,

            /*
            |--------------------------------------------------------------------------
            | pending + confirmed = booked
            |--------------------------------------------------------------------------
            */

            status: "booked",

            price:
              availability &&
              availability.price !== null
                ? availability.price
                : null,
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Manually blocked
        |--------------------------------------------------------------------------
        */

        if (
          availability &&
          availability.status === "blocked"
        ) {
          return {
            date,
            status: "blocked",
            price: null,
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Available
        |--------------------------------------------------------------------------
        */

        return {
          date,
          status: "available",

          price:
            availability &&
            availability.price !== null
              ? availability.price
              : null,
        };
      });

    return res.status(200).json({
      success: true,
      hall,
      calendar,
    });
  } catch (error) {
    console.error(
      "Get Public Hall Calendar Error:",
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
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  upsertAvailability,
  getMyHallCalendar,
  deleteAvailability,
  getPublicHallCalendar,
};