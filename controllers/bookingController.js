// const mongoose = require("mongoose");

// const Booking = require("../models/Booking");
// const Hall = require("../models/Hall");
// const Package = require("../models/Package");
// const Availability = require("../models/Availability");
// const User = require("../models/User");

// const {
//   createNotification,
// } = require("./notificationController");

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

// /*
// |--------------------------------------------------------------------------
// | Create Booking
// |--------------------------------------------------------------------------
// | POST /api/v1/bookings
// |--------------------------------------------------------------------------
// */

// const createBooking = async (req, res) => {
//   try {
//     const {
//       hallId,
//       packageId,
//       eventDate,
//       guests,
//       paymentMethod = "cash",
//       notes,
//     } = req.body;

//     /*
//     |--------------------------------------------------------------------------
//     | Validate IDs
//     |--------------------------------------------------------------------------
//     */

//     if (!hallId || !isValidObjectId(hallId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid hallId is required",
//       });
//     }

//     if (!packageId || !isValidObjectId(packageId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid packageId is required",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Validate Date
//     |--------------------------------------------------------------------------
//     */

//     const normalizedDate = normalizeDate(eventDate);

//     if (!normalizedDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid event date is required",
//       });
//     }

//     if (isPastDate(normalizedDate)) {
//       return res.status(400).json({
//         success: false,
//         message: "Event date cannot be in the past",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Validate Payment Method
//     |--------------------------------------------------------------------------
//     */

//     if (!["cash", "card", "online"].includes(paymentMethod)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid payment method",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Validate Guests
//     |--------------------------------------------------------------------------
//     */

//     const parsedGuests = Number(guests);

//     if (!Number.isInteger(parsedGuests) || parsedGuests < 1) {
//       return res.status(400).json({
//         success: false,
//         message: "Guests must be a valid positive integer",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Get Hall
//     |--------------------------------------------------------------------------
//     */

//     const hall = await Hall.findOne({
//       _id: hallId,
//       status: "approved",
//       isAvailable: true,
//       isDeleted: false,
//     }).lean();

//     if (!hall) {
//       return res.status(404).json({
//         success: false,
//         message: "Hall is not available for booking",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Get Package
//     |--------------------------------------------------------------------------
//     */

//     const packageData = await Package.findOne({
//       _id: packageId,
//       hall: hallId,
//       isActive: true,
//       isDeleted: false,
//     }).lean();

//     if (!packageData) {
//       return res.status(404).json({
//         success: false,
//         message:
//           "Package not found or is not available for this hall",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Validate Guests Against Package
//     |--------------------------------------------------------------------------
//     */

//     if (
//       parsedGuests < packageData.minGuests ||
//       parsedGuests > packageData.maxGuests
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: `Guests must be between ${packageData.minGuests} and ${packageData.maxGuests}`,
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Check Availability
//     |--------------------------------------------------------------------------
//     */

//     const availability = await Availability.findOne({
//       hall: hallId,
//       date: normalizedDate,
//     }).lean();

//     if (availability && availability.status === "blocked") {
//       return res.status(400).json({
//         success: false,
//         message: "Hall is blocked on this date",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Check Existing Booking
//     |--------------------------------------------------------------------------
//     */

//     const existingBooking = await Booking.findOne({
//       hall: hallId,
//       eventDate: normalizedDate,
//       status: {
//         $in: ["pending", "confirmed"],
//       },
//     }).lean();

//     if (existingBooking) {
//       return res.status(409).json({
//         success: false,
//         message: "Hall is already booked for this date",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Determine Price
//     |--------------------------------------------------------------------------
//     | Calendar price overrides package price if explicitly set.
//     |--------------------------------------------------------------------------
//     */

//     const packagePrice =
//       availability &&
//       availability.status === "available" &&
//       availability.price !== null
//         ? availability.price
//         : packageData.price;

//     const extraAmount = 0;
//     const discountAmount = 0;

//     const totalAmount =
//       packagePrice +
//       extraAmount -
//       discountAmount;

//     /*
//     |--------------------------------------------------------------------------
//     | Get Current Customer
//     |--------------------------------------------------------------------------
//     */

//     const customer = await User.findById(
//       req.user._id
//     ).select("name email phone");

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Create Booking
//     |--------------------------------------------------------------------------
//     */

//     try {
//       const booking = await Booking.create({
//         hall: hallId,
//         package: packageId,
//         customer: req.user._id,
//         eventDate: normalizedDate,
//         guests: parsedGuests,

//         packagePrice,
//         extraAmount,
//         discountAmount,
//         totalAmount,

//         currency: packageData.currency || "EGP",

//         customerName: customer.name,
//         customerPhone: customer.phone,
//         customerEmail: customer.email,

//         notes: notes || null,

//         status: "pending",
//         paymentStatus: "unpaid",
//         paymentMethod,
//       });

//       const populatedBooking =
//         await Booking.findById(booking._id)
//           .populate({
//             path: "hall",
//             select:
//               "name city area address phone coverImage startingPrice currency owner",
//           })
//           .populate({
//             path: "package",
//             select:
//               "name description price minGuests maxGuests durationHours features image",
//           })
//           .populate({
//             path: "customer",
//             select: "name email phone",
//           });

//       /*
//       |--------------------------------------------------------------------------
//       | Notify Hall Owner
//       |--------------------------------------------------------------------------
//       */

//       await createNotification({
//         recipient: hall.owner,
//         type: "booking_created",
//         title: "New Booking Request 📅",
//         message: `You have a new booking request for ${hall.name} on ${normalizedDate
//           .toISOString()
//           .slice(0, 10)}.`,
//         booking: booking._id,
//         hall: hall._id,
//       });

//       /*
//       |--------------------------------------------------------------------------
//       | Return Response
//       |--------------------------------------------------------------------------
//       */

//       return res.status(201).json({
//         success: true,
//         message: "Booking created successfully",
//         booking: populatedBooking,
//       });
//     } catch (error) {
//       /*
//       |--------------------------------------------------------------------------
//       | MongoDB Duplicate Key = Double Booking Race Condition
//       |--------------------------------------------------------------------------
//       */

//       if (error.code === 11000) {
//         return res.status(409).json({
//           success: false,
//           message: "Hall is already booked for this date",
//         });
//       }

//       throw error;
//     }
//   } catch (error) {
//     console.error(
//       "Create Booking Error:",
//       error
//     );

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
// | Get My Bookings
// |--------------------------------------------------------------------------
// | GET /api/v1/bookings/my
// |--------------------------------------------------------------------------
// */

// const getMyBookings = async (req, res) => {
//   try {
//     const {
//       status,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     const parsedPage = Math.max(
//       parseInt(page, 10) || 1,
//       1
//     );

//     const parsedLimit = Math.min(
//       Math.max(
//         parseInt(limit, 10) || 20,
//         1
//       ),
//       50
//     );

//     const filter = {
//       customer: req.user._id,
//     };

//     if (status) {
//       const allowedStatuses = [
//         "pending",
//         "confirmed",
//         "rejected",
//         "cancelled",
//         "completed",
//       ];

//       if (!allowedStatuses.includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid booking status",
//         });
//       }

//       filter.status = status;
//     }

//     const total =
//       await Booking.countDocuments(filter);

//     const bookings =
//       await Booking.find(filter)
//         .populate({
//           path: "hall",
//           select:
//             "name city area address coverImage startingPrice currency",
//         })
//         .populate({
//           path: "package",
//           select:
//             "name description price minGuests maxGuests durationHours features image",
//         })
//         .sort({
//           eventDate: 1,
//           createdAt: -1,
//         })
//         .skip(
//           (parsedPage - 1) * parsedLimit
//         )
//         .limit(parsedLimit)
//         .lean();

//     return res.status(200).json({
//       success: true,
//       bookings,
//       pagination: {
//         page: parsedPage,
//         limit: parsedLimit,
//         total,
//         pages: Math.ceil(
//           total / parsedLimit
//         ),
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Get My Bookings Error:",
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
// | Get Booking By ID
// |--------------------------------------------------------------------------
// | GET /api/v1/bookings/:id
// |--------------------------------------------------------------------------
// */

// const getBookingById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID",
//       });
//     }

//     const booking =
//       await Booking.findById(id)
//         .populate({
//           path: "hall",
//           select:
//             "name description city area address phone coverImage images capacity startingPrice currency owner",
//         })
//         .populate({
//           path: "package",
//           select:
//             "name description price minGuests maxGuests durationHours features image",
//         })
//         .populate({
//           path: "customer",
//           select: "name email phone",
//         });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Access Control
//     |--------------------------------------------------------------------------
//     */

//     const isAdmin =
//       req.user.role === "admin";

//     const isCustomer =
//       String(booking.customer._id) ===
//       String(req.user._id);

//     const isHallOwner =
//       req.user.role === "hallOwner" &&
//       String(booking.hall.owner) ===
//         String(req.user._id);

//     if (
//       !isAdmin &&
//       !isCustomer &&
//       !isHallOwner
//     ) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to access this booking",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Hide owner from customer response
//     |--------------------------------------------------------------------------
//     */

//     if (!isAdmin && !isHallOwner) {
//       booking.hall.owner = undefined;
//     }

//     return res.status(200).json({
//       success: true,
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Get Booking Error:",
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
// | Cancel Booking
// |--------------------------------------------------------------------------
// | PATCH /api/v1/bookings/:id/cancel
// |--------------------------------------------------------------------------
// */

// const cancelBooking = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID",
//       });
//     }

//     const booking =
//       await Booking.findById(id)
//         .populate({
//           path: "hall",
//           select:
//             "owner name city area",
//         })
//         .populate({
//           path: "customer",
//           select:
//             "name email phone",
//         });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Only customer or admin can cancel
//     |--------------------------------------------------------------------------
//     */

//     const isCustomer =
//       String(booking.customer._id) ===
//       String(req.user._id);

//     const isAdmin =
//       req.user.role === "admin";

//     if (!isCustomer && !isAdmin) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to cancel this booking",
//       });
//     }

//     if (
//       !["pending", "confirmed"].includes(
//         booking.status
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "This booking cannot be cancelled",
//       });
//     }

//     booking.status = "cancelled";
//     booking.cancelledAt = new Date();
//     booking.cancellationReason =
//       reason ||
//       "Cancelled by customer";

//     /*
//     |--------------------------------------------------------------------------
//     | Payment Handling
//     |--------------------------------------------------------------------------
//     */

//     if (booking.paymentStatus === "paid") {
//       booking.paymentStatus = "refunded";
//     }

//     await booking.save();

//     /*
//     |--------------------------------------------------------------------------
//     | Notify Hall Owner
//     |--------------------------------------------------------------------------
//     */

//     await createNotification({
//       recipient: booking.hall.owner,
//       type: "booking_cancelled",
//       title: "Booking Cancelled",
//       message: `The booking at ${booking.hall.name} on ${booking.eventDate
//         .toISOString()
//         .slice(0, 10)} has been cancelled.`,
//       booking: booking._id,
//       hall: booking.hall._id,
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | If Admin Cancelled
//     |--------------------------------------------------------------------------
//     */

//     if (isAdmin) {
//       await createNotification({
//         recipient: booking.customer._id,
//         type: "booking_cancelled",
//         title: "Booking Cancelled",
//         message: `Your booking at ${booking.hall.name} on ${booking.eventDate
//           .toISOString()
//           .slice(0, 10)} has been cancelled.`,
//         booking: booking._id,
//         hall: booking.hall._id,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Booking cancelled successfully",
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Cancel Booking Error:",
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
// | Get Hall Owner Bookings
// |--------------------------------------------------------------------------
// | GET /api/v1/bookings/owner
// |--------------------------------------------------------------------------
// */

// const getOwnerBookings = async (req, res) => {
//   try {
//     const {
//       hallId,
//       status,
//       from,
//       to,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     const parsedPage = Math.max(
//       parseInt(page, 10) || 1,
//       1
//     );

//     const parsedLimit = Math.min(
//       Math.max(
//         parseInt(limit, 10) || 20,
//         1
//       ),
//       50
//     );

//     /*
//     |--------------------------------------------------------------------------
//     | Find Owner's Halls
//     |--------------------------------------------------------------------------
//     */

//     const halls =
//       await Hall.find({
//         owner: req.user._id,
//         isDeleted: false,
//       }).select("_id name");

//     const hallIds = halls.map(
//       (hall) => hall._id
//     );

//     if (hallIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         bookings: [],
//         pagination: {
//           page: parsedPage,
//           limit: parsedLimit,
//           total: 0,
//           pages: 0,
//         },
//       });
//     }

//     const filter = {
//       hall: {
//         $in: hallIds,
//       },
//     };

//     if (hallId) {
//       if (!isValidObjectId(hallId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid hallId",
//         });
//       }

//       if (
//         !hallIds.some(
//           (id) =>
//             String(id) ===
//             String(hallId)
//         )
//       ) {
//         return res.status(403).json({
//           success: false,
//           message:
//             "You do not own this hall",
//         });
//       }

//       filter.hall = hallId;
//     }

//     if (status) {
//       const allowedStatuses = [
//         "pending",
//         "confirmed",
//         "rejected",
//         "cancelled",
//         "completed",
//       ];

//       if (
//         !allowedStatuses.includes(
//           status
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid booking status",
//         });
//       }

//       filter.status = status;
//     }

//     if (from || to) {
//       filter.eventDate = {};

//       if (from) {
//         const fromDate =
//           normalizeDate(from);

//         if (!fromDate) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid from date",
//           });
//         }

//         filter.eventDate.$gte =
//           fromDate;
//       }

//       if (to) {
//         const toDate =
//           normalizeDate(to);

//         if (!toDate) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid to date",
//           });
//         }

//         filter.eventDate.$lte =
//           toDate;
//       }
//     }

//     const total =
//       await Booking.countDocuments(
//         filter
//       );

//     const bookings =
//       await Booking.find(filter)
//         .populate({
//           path: "hall",
//           select:
//             "name city area address",
//         })
//         .populate({
//           path: "package",
//           select:
//             "name price minGuests maxGuests",
//         })
//         .populate({
//           path: "customer",
//           select:
//             "name email phone",
//         })
//         .sort({
//           eventDate: 1,
//           createdAt: -1,
//         })
//         .skip(
//           (parsedPage - 1) *
//             parsedLimit
//         )
//         .limit(parsedLimit)
//         .lean();

//     return res.status(200).json({
//       success: true,
//       bookings,
//       pagination: {
//         page: parsedPage,
//         limit: parsedLimit,
//         total,
//         pages: Math.ceil(
//           total / parsedLimit
//         ),
//       },
//     });
//   } catch (error) {
//     console.error(
//       "Get Owner Bookings Error:",
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
// | Update Booking Status
// |--------------------------------------------------------------------------
// | PATCH /api/v1/bookings/:id/status
// |--------------------------------------------------------------------------
// */

// const updateBookingStatus = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } = req.params;

//     const {
//       status,
//       rejectionReason,
//     } = req.body;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID",
//       });
//     }

//     const allowedStatuses = [
//       "confirmed",
//       "rejected",
//       "completed",
//     ];

//     if (
//       !allowedStatuses.includes(
//         status
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid status. Allowed: confirmed, rejected, completed",
//       });
//     }

//     const booking =
//       await Booking.findById(id)
//         .populate({
//           path: "hall",
//           select:
//             "owner name isAvailable isDeleted",
//         })
//         .populate({
//           path: "customer",
//           select:
//             "name email phone",
//         });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Access Control
//     |--------------------------------------------------------------------------
//     */

//     const isAdmin =
//       req.user.role === "admin";

//     const isOwner =
//       req.user.role === "hallOwner" &&
//       String(booking.hall.owner) ===
//         String(req.user._id);

//     if (!isAdmin && !isOwner) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to update this booking",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Status Transition Rules
//     |--------------------------------------------------------------------------
//     */

//     if (
//       status === "confirmed" &&
//       booking.status !== "pending"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only pending bookings can be confirmed",
//       });
//     }

//     if (
//       status === "rejected" &&
//       booking.status !== "pending"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only pending bookings can be rejected",
//       });
//     }

//     if (
//       status === "completed" &&
//       booking.status !== "confirmed"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only confirmed bookings can be completed",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Confirm
//     |--------------------------------------------------------------------------
//     */

//     if (status === "confirmed") {
//       booking.status = "confirmed";
//       booking.confirmedAt =
//         new Date();
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Reject
//     |--------------------------------------------------------------------------
//     */

//     if (status === "rejected") {
//       booking.status = "rejected";

//       booking.cancellationReason =
//         rejectionReason ||
//         "Booking rejected by hall management";
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Complete
//     |--------------------------------------------------------------------------
//     */

//     if (status === "completed") {
//       booking.status = "completed";
//       booking.completedAt =
//         new Date();
//     }

//     await booking.save();

//     /*
//     |--------------------------------------------------------------------------
//     | Customer Notifications
//     |--------------------------------------------------------------------------
//     */

//     if (status === "confirmed") {
//       await createNotification({
//         recipient:
//           booking.customer._id,
//         type: "booking_confirmed",
//         title:
//           "Booking Confirmed 🎉",
//         message: `Your booking at ${booking.hall.name} on ${booking.eventDate
//           .toISOString()
//           .slice(
//             0,
//             10
//           )} has been confirmed.`,
//         booking: booking._id,
//         hall: booking.hall._id,
//       });
//     }

//     if (status === "rejected") {
//       await createNotification({
//         recipient:
//           booking.customer._id,
//         type: "booking_rejected",
//         title:
//           "Booking Rejected",
//         message: `Your booking at ${booking.hall.name} on ${booking.eventDate
//           .toISOString()
//           .slice(
//             0,
//             10
//           )} was rejected. Reason: ${
//           booking.cancellationReason
//         }`,
//         booking: booking._id,
//         hall: booking.hall._id,
//       });
//     }

//     if (status === "completed") {
//       await createNotification({
//         recipient:
//           booking.customer._id,
//         type: "booking_completed",
//         title:
//           "Booking Completed",
//         message: `Your booking at ${booking.hall.name} has been completed. We hope you had a wonderful experience!`,
//         booking: booking._id,
//         hall: booking.hall._id,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message:
//         `Booking ${status} successfully`,
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Update Booking Status Error:",
//       error
//     );

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "Another active booking already exists for this hall and date",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// module.exports = {
//   createBooking,
//   getMyBookings,
//   getBookingById,
//   cancelBooking,
//   getOwnerBookings,
//   updateBookingStatus,
// };

const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Hall = require("../models/Hall");
const Package = require("../models/Package");
const Availability = require("../models/Availability");
const User = require("../models/User");

const {
  createNotification,
} = require("./notificationController");

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

const formatDate = (date) => {
  return new Date(date)
    .toISOString()
    .slice(0, 10);
};

const populateBooking = async (bookingId) => {
  return Booking.findById(bookingId)
    .populate({
      path: "hall",
      select:
        "name description city area address phone coverImage images capacity startingPrice currency owner",
    })
    .populate({
      path: "package",
      select:
        "name description price minGuests maxGuests durationHours features image",
    })
    .populate({
      path: "customer",
      select: "name email phone",
    });
};

/*
|--------------------------------------------------------------------------
| Create Booking
|--------------------------------------------------------------------------
| POST /api/v1/bookings
|--------------------------------------------------------------------------
*/

const createBooking = async (req, res) => {
  try {
    const {
      hallId,
      packageId,
      eventDate,
      guests,
      paymentMethod = "cash",
      notes,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate IDs
    |--------------------------------------------------------------------------
    */

    if (!hallId || !isValidObjectId(hallId)) {
      return res.status(400).json({
        success: false,
        message: "Valid hallId is required",
      });
    }

    if (!packageId || !isValidObjectId(packageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid packageId is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Date
    |--------------------------------------------------------------------------
    */

    const normalizedDate = normalizeDate(eventDate);

    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid event date is required",
      });
    }

    if (isPastDate(normalizedDate)) {
      return res.status(400).json({
        success: false,
        message: "Event date cannot be in the past",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Payment Method
    |--------------------------------------------------------------------------
    */

    if (!["cash", "card", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Guests
    |--------------------------------------------------------------------------
    */

    const parsedGuests = Number(guests);

    if (!Number.isInteger(parsedGuests) || parsedGuests < 1) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a valid positive integer",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Get Hall
    |--------------------------------------------------------------------------
    */

    const hall = await Hall.findOne({
      _id: hallId,
      status: "approved",
      isAvailable: true,
      isDeleted: false,
    }).lean();

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall is not available for booking",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Get Package
    |--------------------------------------------------------------------------
    */

    const packageData = await Package.findOne({
      _id: packageId,
      hall: hallId,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message:
          "Package not found or is not available for this hall",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Guests Against Package
    |--------------------------------------------------------------------------
    */

    if (
      parsedGuests < packageData.minGuests ||
      parsedGuests > packageData.maxGuests
    ) {
      return res.status(400).json({
        success: false,
        message: `Guests must be between ${packageData.minGuests} and ${packageData.maxGuests}`,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Availability
    |--------------------------------------------------------------------------
    */

    const availability = await Availability.findOne({
      hall: hallId,
      date: normalizedDate,
    }).lean();

    if (availability && availability.status === "blocked") {
      return res.status(400).json({
        success: false,
        message: "Hall is blocked on this date",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing Booking
    |--------------------------------------------------------------------------
    */

    const existingBooking = await Booking.findOne({
      hall: hallId,
      eventDate: normalizedDate,
      status: {
        $in: ["pending", "confirmed"],
      },
    }).lean();

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "Hall is already booked for this date",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Determine Price
    |--------------------------------------------------------------------------
    | Calendar price overrides package price if explicitly set.
    |--------------------------------------------------------------------------
    */

    const packagePrice =
      availability &&
      availability.status === "available" &&
      availability.price !== null
        ? availability.price
        : packageData.price;

    const extraAmount = 0;
    const discountAmount = 0;

    const totalAmount =
      packagePrice +
      extraAmount -
      discountAmount;

    /*
    |--------------------------------------------------------------------------
    | Get Current Customer
    |--------------------------------------------------------------------------
    */

    const customer = await User.findById(
      req.user._id
    ).select("name email phone");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Booking
    |--------------------------------------------------------------------------
    */

    try {
      const booking = await Booking.create({
        hall: hallId,
        package: packageId,
        customer: req.user._id,
        eventDate: normalizedDate,
        guests: parsedGuests,

        packagePrice,
        extraAmount,
        discountAmount,
        totalAmount,

        currency: packageData.currency || "EGP",

        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,

        notes:
          typeof notes === "string"
            ? notes.trim() || null
            : null,

        status: "pending",
        paymentStatus: "unpaid",
        paymentMethod,
      });

      const populatedBooking =
        await populateBooking(booking._id);

      /*
      |--------------------------------------------------------------------------
      | Notify Hall Owner
      |--------------------------------------------------------------------------
      */

      await createNotification({
        recipient: hall.owner,
        type: "booking_created",
        title: "New Booking Request 📅",
        message: `You have a new booking request for ${hall.name} on ${formatDate(
          normalizedDate
        )}.`,
        booking: booking._id,
        hall: hall._id,
      });

      /*
      |--------------------------------------------------------------------------
      | Return Response
      |--------------------------------------------------------------------------
      */

      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking: populatedBooking,
      });
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | MongoDB Duplicate Key = Double Booking Race Condition
      |--------------------------------------------------------------------------
      */

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Hall is already booked for this date",
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Create Booking Error:", error);

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
| Get My Bookings
|--------------------------------------------------------------------------
| GET /api/v1/bookings/my
|--------------------------------------------------------------------------
*/

const getMyBookings = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const parsedPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const parsedLimit = Math.min(
      Math.max(
        parseInt(limit, 10) || 20,
        1
      ),
      50
    );

    const filter = {
      customer: req.user._id,
    };

    if (status) {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status",
        });
      }

      filter.status = status;
    }

    const total =
      await Booking.countDocuments(filter);

    const bookings =
      await Booking.find(filter)
        .populate({
          path: "hall",
          select:
            "name city area address coverImage startingPrice currency",
        })
        .populate({
          path: "package",
          select:
            "name description price minGuests maxGuests durationHours features image",
        })
        .sort({
          eventDate: 1,
          createdAt: -1,
        })
        .skip(
          (parsedPage - 1) * parsedLimit
        )
        .limit(parsedLimit)
        .lean();

    return res.status(200).json({
      success: true,
      bookings,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(
          total / parsedLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get My Bookings Error:",
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
| Get Booking By ID
|--------------------------------------------------------------------------
| GET /api/v1/bookings/:id
|--------------------------------------------------------------------------
*/

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking =
      await populateBooking(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Access Control
    |--------------------------------------------------------------------------
    */

    const isAdmin =
      req.user.role === "admin";

    const isCustomer =
      booking.customer &&
      String(booking.customer._id) ===
        String(req.user._id);

    const isHallOwner =
      req.user.role === "hallOwner" &&
      booking.hall &&
      String(booking.hall.owner) ===
        String(req.user._id);

    if (
      !isAdmin &&
      !isCustomer &&
      !isHallOwner
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this booking",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hide Owner From Customer Response
    |--------------------------------------------------------------------------
    */

    if (
      !isAdmin &&
      !isHallOwner &&
      booking.hall
    ) {
      booking.hall.owner = undefined;
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error(
      "Get Booking Error:",
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
| Cancel Booking
|--------------------------------------------------------------------------
| PATCH /api/v1/bookings/:id/cancel
|--------------------------------------------------------------------------
*/

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const rawReason = req.body?.reason;

    /*
    |--------------------------------------------------------------------------
    | Validate Booking ID
    |--------------------------------------------------------------------------
    */

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Reason
    |--------------------------------------------------------------------------
    */

    let reason = null;

    if (rawReason !== undefined && rawReason !== null) {
      if (typeof rawReason !== "string") {
        return res.status(400).json({
          success: false,
          message: "Cancellation reason must be text",
        });
      }

      reason = rawReason.trim();

      if (reason.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Cancellation reason cannot exceed 500 characters",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Get Booking
    |--------------------------------------------------------------------------
    */

    const booking =
      await Booking.findById(id)
        .populate({
          path: "hall",
          select:
            "owner name city area address",
        })
        .populate({
          path: "customer",
          select:
            "name email phone",
        });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Access Control
    |--------------------------------------------------------------------------
    */

    const isCustomer =
      booking.customer &&
      String(booking.customer._id) ===
        String(req.user._id);

    const isAdmin =
      req.user.role === "admin";

    if (!isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to cancel this booking",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Status Rules
    |--------------------------------------------------------------------------
    */

    if (
      !["pending", "confirmed"].includes(
        booking.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending or confirmed bookings can be cancelled",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Cancellation After Event Date
    |--------------------------------------------------------------------------
    */

    const eventDate = normalizeDate(
      booking.eventDate
    );

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        message:
          "Booking has an invalid event date",
      });
    }

    if (isPastDate(eventDate)) {
      return res.status(400).json({
        success: false,
        message:
          "A booking cannot be cancelled after its event date",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Booking
    |--------------------------------------------------------------------------
    */

    booking.status = "cancelled";
    booking.cancelledAt = new Date();

    if (reason) {
      booking.cancellationReason = reason;
    } else if (isAdmin) {
      booking.cancellationReason =
        "Cancelled by administrator";
    } else {
      booking.cancellationReason =
        "Cancelled by customer";
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Handling
    |--------------------------------------------------------------------------
    | This only updates the booking payment state.
    | Actual refund processing will be handled by the
    | payment gateway when online payments are integrated.
    |--------------------------------------------------------------------------
    */

    if (booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded";
    }

    await booking.save();

    /*
    |--------------------------------------------------------------------------
    | Notify Hall Owner
    |--------------------------------------------------------------------------
    */

    await createNotification({
      recipient: booking.hall.owner,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `The booking at ${
        booking.hall.name
      } on ${formatDate(
        booking.eventDate
      )} has been cancelled.`,
      booking: booking._id,
      hall: booking.hall._id,
    });

    /*
    |--------------------------------------------------------------------------
    | Notify Customer If Admin Cancelled
    |--------------------------------------------------------------------------
    */

    if (isAdmin) {
      await createNotification({
        recipient: booking.customer._id,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: `Your booking at ${
          booking.hall.name
        } on ${formatDate(
          booking.eventDate
        )} has been cancelled.`,
        booking: booking._id,
        hall: booking.hall._id,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Return Updated Booking
    |--------------------------------------------------------------------------
    */

    const updatedBooking =
      await populateBooking(
        booking._id
      );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error(
      "Cancel Booking Error:",
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
| Get Hall Owner Bookings
|--------------------------------------------------------------------------
| GET /api/v1/bookings/owner
|--------------------------------------------------------------------------
*/

const getOwnerBookings = async (req, res) => {
  try {
    const {
      hallId,
      status,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const parsedPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const parsedLimit = Math.min(
      Math.max(
        parseInt(limit, 10) || 20,
        1
      ),
      50
    );

    /*
    |--------------------------------------------------------------------------
    | Find Owner's Halls
    |--------------------------------------------------------------------------
    */

    const halls =
      await Hall.find({
        owner: req.user._id,
        isDeleted: false,
      }).select("_id name");

    const hallIds = halls.map(
      (hall) => hall._id
    );

    if (hallIds.length === 0) {
      return res.status(200).json({
        success: true,
        bookings: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          pages: 0,
        },
      });
    }

    const filter = {
      hall: {
        $in: hallIds,
      },
    };

    if (hallId) {
      if (!isValidObjectId(hallId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hallId",
        });
      }

      if (
        !hallIds.some(
          (id) =>
            String(id) ===
            String(hallId)
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not own this hall",
        });
      }

      filter.hall = hallId;
    }

    if (status) {
      const allowedStatuses = [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status",
        });
      }

      filter.status = status;
    }

    if (from || to) {
      filter.eventDate = {};

      if (from) {
        const fromDate =
          normalizeDate(from);

        if (!fromDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid from date",
          });
        }

        filter.eventDate.$gte =
          fromDate;
      }

      if (to) {
        const toDate =
          normalizeDate(to);

        if (!toDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid to date",
          });
        }

        filter.eventDate.$lte =
          toDate;
      }
    }

    const total =
      await Booking.countDocuments(
        filter
      );

    const bookings =
      await Booking.find(filter)
        .populate({
          path: "hall",
          select:
            "name city area address",
        })
        .populate({
          path: "package",
          select:
            "name price minGuests maxGuests",
        })
        .populate({
          path: "customer",
          select:
            "name email phone",
        })
        .sort({
          eventDate: 1,
          createdAt: -1,
        })
        .skip(
          (parsedPage - 1) *
            parsedLimit
        )
        .limit(parsedLimit)
        .lean();

    return res.status(200).json({
      success: true,
      bookings,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(
          total / parsedLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get Owner Bookings Error:",
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
| Update Booking Status
|--------------------------------------------------------------------------
| PATCH /api/v1/bookings/:id/status
|--------------------------------------------------------------------------
*/

// const updateBookingStatus = async (
//   req,
//   res
// ) => {
//   try {
//     const { id } = req.params;

//     const {
//       status,
//       rejectionReason,
//     } = req.body;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid booking ID",
//       });
//     }

//     const allowedStatuses = [
//       "confirmed",
//       "rejected",
//       "completed",
//     ];

//     if (
//       !allowedStatuses.includes(
//         status
//       )
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid status. Allowed: confirmed, rejected, completed",
//       });
//     }

//     const booking =
//       await Booking.findById(id)
//         .populate({
//           path: "hall",
//           select:
//             "owner name isAvailable isDeleted",
//         })
//         .populate({
//           path: "customer",
//           select:
//             "name email phone",
//         });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Access Control
//     |--------------------------------------------------------------------------
//     */

//     const isAdmin =
//       req.user.role === "admin";

//     const isOwner =
//       req.user.role === "hallOwner" &&
//       String(booking.hall.owner) ===
//         String(req.user._id);

//     if (!isAdmin && !isOwner) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You do not have permission to update this booking",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Status Transition Rules
//     |--------------------------------------------------------------------------
//     */

//     if (
//       status === "confirmed" &&
//       booking.status !== "pending"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only pending bookings can be confirmed",
//       });
//     }

//     if (
//       status === "rejected" &&
//       booking.status !== "pending"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only pending bookings can be rejected",
//       });
//     }

//     if (
//       status === "completed" &&
//       booking.status !== "confirmed"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Only confirmed bookings can be completed",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Confirm
//     |--------------------------------------------------------------------------
//     */

//     if (status === "confirmed") {
//       booking.status = "confirmed";
//       booking.confirmedAt = new Date();
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Reject
//     |--------------------------------------------------------------------------
//     */

//     if (status === "rejected") {
//       booking.status = "rejected";

//       booking.cancellationReason =
//         typeof rejectionReason === "string" &&
//         rejectionReason.trim()
//           ? rejectionReason.trim()
//           : "Booking rejected by hall management";
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Complete
//     |--------------------------------------------------------------------------
//     */

//     if (status === "completed") {
//       booking.status = "completed";
//       booking.completedAt = new Date();
//     }

//     await booking.save();

//     /*
//     |--------------------------------------------------------------------------
//     | Customer Notifications
//     |--------------------------------------------------------------------------
//     */

//     if (status === "confirmed") {
//       await createNotification({
//         recipient: booking.customer._id,
//         type: "booking_confirmed",
//         title: "Booking Confirmed 🎉",
//         message: `Your booking at ${
//           booking.hall.name
//         } on ${formatDate(
//           booking.eventDate
//         )} has been confirmed.`,
//         booking: booking._id,
//         hall: booking.hall._id,
//       });
//     }

//     if (status === "rejected") {
//       await createNotification({
//         recipient: booking.customer._id,
//         type: "booking_rejected",
//         title: "Booking Rejected",
//         message: `Your booking at ${
//           booking.hall.name
//         } on ${formatDate(
//           booking.eventDate
//         )} was rejected. Reason: ${
//           booking.cancellationReason
//         }`,
//         booking: booking._id,
//         hall: booking.hall._id,
//       });
//     }

//     if (status === "completed") {
//       await createNotification({
//         recipient: booking.customer._id,
//         type: "booking_completed",
//         title: "Booking Completed",
//         message: `Your booking at ${booking.hall.name} has been completed. We hope you had a wonderful experience!`,
//         booking: booking._id,
//         hall: booking.hall._id,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message:
//         `Booking ${status} successfully`,
//       booking,
//     });
//   } catch (error) {
//     console.error(
//       "Update Booking Status Error:",
//       error
//     );

//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "Another active booking already exists for this hall and date",
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };


const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { status, rejectionReason } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Booking ID
    |--------------------------------------------------------------------------
    */

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Status
    |--------------------------------------------------------------------------
    */

    const allowedStatuses = [
      "confirmed",
      "rejected",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be confirmed, rejected, or completed",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Booking
    |--------------------------------------------------------------------------
    */

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Access Control
    |--------------------------------------------------------------------------
    */

    const isAdmin =
      req.user.role === "admin";

    const isOwner =
      req.user.role === "hallOwner" &&
      booking.hall;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this booking",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Hall Ownership
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "hallOwner") {
      const hall = await Hall.findById(
        booking.hall
      ).select("owner isDeleted");

      if (!hall) {
        return res.status(404).json({
          success: false,
          message: "Hall not found",
        });
      }

      if (hall.isDeleted) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot update a booking for a deleted hall",
        });
      }

      if (
        String(hall.owner) !==
        String(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not the owner of this hall",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Status Transitions
    |--------------------------------------------------------------------------
    */

    if (
      status === "confirmed" &&
      booking.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending bookings can be confirmed",
      });
    }

    if (
      status === "rejected" &&
      booking.status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending bookings can be rejected",
      });
    }

    if (
      status === "completed" &&
      booking.status !== "confirmed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only confirmed bookings can be completed",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Rejection Reason
    |--------------------------------------------------------------------------
    */

    if (status === "rejected") {
      const reason =
        typeof rejectionReason === "string"
          ? rejectionReason.trim()
          : "";

      booking.cancellationReason =
        reason ||
        "Booking rejected by hall owner";
    }

    /*
    |--------------------------------------------------------------------------
    | Update Status
    |--------------------------------------------------------------------------
    */

    booking.status = status;

    /*
    |--------------------------------------------------------------------------
    | Confirmed
    |--------------------------------------------------------------------------
    */

    if (status === "confirmed") {
      booking.confirmedAt = new Date();
    }

    /*
    |--------------------------------------------------------------------------
    | Completed
    |--------------------------------------------------------------------------
    |
    | Payment handling:
    |
    | 1. Cash:
    |    Completing the booking means the
    |    payment has been received.
    |
    | 2. Card / Online:
    |    Don't blindly change the payment
    |    status. Keep the real payment state.
    |
    */

    if (status === "completed") {
      booking.completedAt = new Date();

      if (
        booking.paymentMethod === "cash" &&
        booking.paymentStatus !== "refunded"
      ) {
        booking.paymentStatus = "paid";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Rejected Payment Handling
    |--------------------------------------------------------------------------
    */

    if (status === "rejected") {
      if (
        booking.paymentStatus !== "paid" &&
        booking.paymentStatus !== "refunded"
      ) {
        booking.paymentStatus = "unpaid";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await booking.save();

    /*
    |--------------------------------------------------------------------------
    | Populate Updated Booking
    |--------------------------------------------------------------------------
    */

    const updatedBooking =
      await Booking.findById(booking._id)
        .populate({
          path: "hall",
          select:
            "name city area address phone coverImage startingPrice currency owner",
        })
        .populate({
          path: "package",
          select:
            "name description price minGuests maxGuests durationHours features image",
        })
        .populate({
          path: "customer",
          select:
            "name email phone",
        });

    /*
    |--------------------------------------------------------------------------
    | Notify Customer
    |--------------------------------------------------------------------------
    */

    let notificationTitle = "";
    let notificationMessage = "";

    if (status === "confirmed") {
      notificationTitle =
        "Booking Confirmed";

      notificationMessage =
        `Your booking at ${
          updatedBooking.hall?.name ||
          "the hall"
        } has been confirmed.`;
    }

    if (status === "rejected") {
      notificationTitle =
        "Booking Rejected";

      notificationMessage =
        `Your booking at ${
          updatedBooking.hall?.name ||
          "the hall"
        } has been rejected.`;
    }

    if (status === "completed") {
      notificationTitle =
        "Booking Completed";

      notificationMessage =
        `Your booking at ${
          updatedBooking.hall?.name ||
          "the hall"
        } has been completed.`;
    }

    if (notificationTitle) {
      try {
        await createNotification({
          userId: updatedBooking.customer?._id,
          title: notificationTitle,
          message: notificationMessage,
          type: "booking",
          relatedId: updatedBooking._id,
        });
      } catch (notificationError) {
        console.error(
          "Booking notification error:",
          notificationError
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message:
        `Booking ${status} successfully`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error(
      "Update booking status error:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | Duplicate Key
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This booking conflicts with another booking",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update booking status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};


/*
|--------------------------------------------------------------------------
| Get All Bookings - Admin
|--------------------------------------------------------------------------
| GET /api/v1/bookings/admin
|--------------------------------------------------------------------------
*/

const getAdminBookings = async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      hallId,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const parsedPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const parsedLimit = Math.min(
      Math.max(
        parseInt(limit, 10) || 20,
        1
      ),
      100
    );

    const filter = {};

    /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

    const allowedStatuses = [
      "pending",
      "confirmed",
      "rejected",
      "cancelled",
      "completed",
    ];

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status",
        });
      }

      filter.status = status;
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Status Filter
    |--------------------------------------------------------------------------
    */

    const allowedPaymentStatuses = [
      "unpaid",
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (paymentStatus) {
      if (
        !allowedPaymentStatuses.includes(
          paymentStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      filter.paymentStatus = paymentStatus;
    }

    /*
    |--------------------------------------------------------------------------
    | Hall Filter
    |--------------------------------------------------------------------------
    */

    if (hallId) {
      if (!isValidObjectId(hallId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hallId",
        });
      }

      filter.hall = hallId;
    }

    /*
    |--------------------------------------------------------------------------
    | Date Filter
    |--------------------------------------------------------------------------
    */

    if (from || to) {
      filter.eventDate = {};

      if (from) {
        const fromDate = normalizeDate(from);

        if (!fromDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid from date",
          });
        }

        filter.eventDate.$gte = fromDate;
      }

      if (to) {
        const toDate = normalizeDate(to);

        if (!toDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid to date",
          });
        }

        filter.eventDate.$lte = toDate;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    | Search customer name / email / phone.
    |--------------------------------------------------------------------------
    */

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      const searchTerm = search.trim();

      filter.$or = [
        {
          customerName: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          customerEmail: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          customerPhone: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Count
    |--------------------------------------------------------------------------
    */

    const total =
      await Booking.countDocuments(filter);

    /*
    |--------------------------------------------------------------------------
    | Bookings
    |--------------------------------------------------------------------------
    */

    const bookings =
      await Booking.find(filter)
        .populate({
          path: "hall",
          select:
            "name city area address phone coverImage startingPrice currency owner status isAvailable",
          populate: {
            path: "owner",
            select: "name email phone",
          },
        })
        .populate({
          path: "package",
          select:
            "name description price minGuests maxGuests durationHours features image",
        })
        .populate({
          path: "customer",
          select: "name email phone",
        })
        .sort({
          eventDate: 1,
          createdAt: -1,
        })
        .skip(
          (parsedPage - 1) * parsedLimit
        )
        .limit(parsedLimit)
        .lean();

    /*
    |--------------------------------------------------------------------------
    | Stats
    |--------------------------------------------------------------------------
    */

    const [
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      rejectedCount,
      paidCount,
    ] = await Promise.all([
      Booking.countDocuments({
        ...filter,
        status: "pending",
      }),

      Booking.countDocuments({
        ...filter,
        status: "confirmed",
      }),

      Booking.countDocuments({
        ...filter,
        status: "completed",
      }),

      Booking.countDocuments({
        ...filter,
        status: "cancelled",
      }),

      Booking.countDocuments({
        ...filter,
        status: "rejected",
      }),

      Booking.countDocuments({
        ...filter,
        paymentStatus: "paid",
      }),
    ]);

    return res.status(200).json({
      success: true,
      bookings,
      stats: {
        total,
        pending: pendingCount,
        confirmed: confirmedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        rejected: rejectedCount,
        paid: paidCount,
      },
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(
          total / parsedLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get Admin Bookings Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
  updateBookingStatus,
  getAdminBookings,
};
