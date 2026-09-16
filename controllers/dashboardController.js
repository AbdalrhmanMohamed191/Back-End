// // const mongoose = require("mongoose");

// // const Hall = require("../models/Hall");
// // const Booking = require("../models/Booking");
// // const Package = require("../models/Package");
// // const Review = require("../models/Review");
// // const User = require("../models/User");

// // /*
// // |--------------------------------------------------------------------------
// // | Owner Dashboard
// // |--------------------------------------------------------------------------
// // | GET /api/v1/dashboard/owner
// // |--------------------------------------------------------------------------
// // */

// // const getOwnerDashboard = async (req, res) => {
// //   try {
// //     const ownerId = new mongoose.Types.ObjectId(
// //       req.user._id
// //     );

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Owner Halls
// //     |--------------------------------------------------------------------------
// //     */

// //     const halls = await Hall.find({
// //       owner: req.user._id,
// //       isDeleted: false,
// //     })
// //       .select("_id name status isAvailable rating totalBookings")
// //       .lean();

// //     const hallIds = halls.map(
// //       (hall) => hall._id
// //     );

// //     /*
// //     |--------------------------------------------------------------------------
// //     | No halls
// //     |--------------------------------------------------------------------------
// //     */

// //     if (hallIds.length === 0) {
// //       return res.status(200).json({
// //         success: true,
// //         stats: {
// //           halls: {
// //             total: 0,
// //             approved: 0,
// //             pending: 0,
// //             rejected: 0,
// //             suspended: 0,
// //           },
// //           packages: {
// //             total: 0,
// //             active: 0,
// //           },
// //           bookings: {
// //             total: 0,
// //             pending: 0,
// //             confirmed: 0,
// //             completed: 0,
// //             cancelled: 0,
// //             rejected: 0,
// //             upcoming: 0,
// //           },
// //           customers: 0,
// //           revenue: 0,
// //           averageRating: 0,
// //           reviews: 0,
// //         },
// //         upcomingBookings: [],
// //         topPackages: [],
// //       });
// //     }

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Date
// //     |--------------------------------------------------------------------------
// //     */

// //     const today = new Date();

// //     today.setUTCHours(0, 0, 0, 0);

// //     const thirtyDaysAgo = new Date(today);

// //     thirtyDaysAgo.setUTCDate(
// //       thirtyDaysAgo.getUTCDate() - 30
// //     );

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Hall Statistics
// //     |--------------------------------------------------------------------------
// //     */

// //     const hallStats = await Hall.aggregate([
// //       {
// //         $match: {
// //           owner: ownerId,
// //           isDeleted: false,
// //         },
// //       },
// //       {
// //         $group: {
// //           _id: "$status",
// //           count: {
// //             $sum: 1,
// //           },
// //         },
// //       },
// //     ]);

// //     const hallStatusMap = {};

// //     hallStats.forEach((item) => {
// //       hallStatusMap[item._id] = item.count;
// //     });

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Packages
// //     |--------------------------------------------------------------------------
// //     */

// //     const packageStats =
// //       await Package.aggregate([
// //         {
// //           $match: {
// //             hall: {
// //               $in: hallIds,
// //             },
// //             isDeleted: false,
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: "$isActive",
// //             count: {
// //               $sum: 1,
// //             },
// //           },
// //         },
// //       ]);

// //     const totalPackages =
// //       packageStats.reduce(
// //         (sum, item) =>
// //           sum + item.count,
// //         0
// //       );

// //     const activePackages =
// //       packageStats.find(
// //         (item) => item._id === true
// //       )?.count || 0;

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Booking Statistics
// //     |--------------------------------------------------------------------------
// //     */

// //     const bookingStats =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             hall: {
// //               $in: hallIds,
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: "$status",
// //             count: {
// //               $sum: 1,
// //             },
// //           },
// //         },
// //       ]);

// //     const bookingStatusMap = {};

// //     bookingStats.forEach((item) => {
// //       bookingStatusMap[item._id] =
// //         item.count;
// //     });

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Revenue
// //     |--------------------------------------------------------------------------
// //     |
// //     | Only confirmed/completed bookings count as revenue.
// //     |
// //     */

// //     const revenueResult =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             hall: {
// //               $in: hallIds,
// //             },
// //             status: {
// //               $in: [
// //                 "confirmed",
// //                 "completed",
// //               ],
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: null,
// //             total: {
// //               $sum: "$totalAmount",
// //             },
// //           },
// //         },
// //       ]);

// //     const revenue =
// //       revenueResult[0]?.total || 0;

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Last 30 Days Revenue
// //     |--------------------------------------------------------------------------
// //     */

// //     const last30DaysRevenueResult =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             hall: {
// //               $in: hallIds,
// //             },
// //             status: {
// //               $in: [
// //                 "confirmed",
// //                 "completed",
// //               ],
// //             },
// //             createdAt: {
// //               $gte: thirtyDaysAgo,
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: null,
// //             total: {
// //               $sum: "$totalAmount",
// //             },
// //           },
// //         },
// //       ]);

// //     const last30DaysRevenue =
// //       last30DaysRevenueResult[0]?.total ||
// //       0;

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Upcoming Bookings
// //     |--------------------------------------------------------------------------
// //     */

// //     const upcomingBookings =
// //       await Booking.find({
// //         hall: {
// //           $in: hallIds,
// //         },
// //         eventDate: {
// //           $gte: today,
// //         },
// //         status: {
// //           $in: [
// //             "pending",
// //             "confirmed",
// //           ],
// //         },
// //       })
// //         .populate({
// //           path: "hall",
// //           select: "name city",
// //         })
// //         .populate({
// //           path: "package",
// //           select: "name price",
// //         })
// //         .populate({
// //           path: "customer",
// //           select: "name phone",
// //         })
// //         .sort({
// //           eventDate: 1,
// //         })
// //         .limit(10)
// //         .lean();

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Customers
// //     |--------------------------------------------------------------------------
// //     */

// //     const customersResult =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             hall: {
// //               $in: hallIds,
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: "$customer",
// //           },
// //         },
// //         {
// //           $count: "total",
// //         },
// //       ]);

// //     const customers =
// //       customersResult[0]?.total || 0;

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Reviews
// //     |--------------------------------------------------------------------------
// //     */

// //     const reviewStats =
// //       await Review.aggregate([
// //         {
// //           $match: {
// //             hall: {
// //               $in: hallIds,
// //             },
// //             isVisible: true,
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: null,
// //             average: {
// //               $avg: "$rating",
// //             },
// //             count: {
// //               $sum: 1,
// //             },
// //           },
// //         },
// //       ]);

// //     const averageRating = Number(
// //       (
// //         reviewStats[0]?.average || 0
// //       ).toFixed(1)
// //     );

// //     const reviews =
// //       reviewStats[0]?.count || 0;

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Top Packages
// //     |--------------------------------------------------------------------------
// //     */

// //     const topPackages =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             hall: {
// //               $in: hallIds,
// //             },
// //             status: {
// //               $in: [
// //                 "confirmed",
// //                 "completed",
// //               ],
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: "$package",
// //             bookings: {
// //               $sum: 1,
// //             },
// //             revenue: {
// //               $sum: "$totalAmount",
// //             },
// //           },
// //         },
// //         {
// //           $sort: {
// //             bookings: -1,
// //           },
// //         },
// //         {
// //           $limit: 5,
// //         },
// //         {
// //           $lookup: {
// //             from: "packages",
// //             localField: "_id",
// //             foreignField: "_id",
// //             as: "package",
// //           },
// //         },
// //         {
// //           $unwind: {
// //             path: "$package",
// //             preserveNullAndEmptyArrays: true,
// //           },
// //         },
// //         {
// //           $project: {
// //             _id: 1,
// //             bookings: 1,
// //             revenue: 1,
// //             name: "$package.name",
// //             price: "$package.price",
// //           },
// //         },
// //       ]);

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Response
// //     |--------------------------------------------------------------------------
// //     */

// //     return res.status(200).json({
// //       success: true,

// //       stats: {
// //         halls: {
// //           total: halls.length,
// //           approved:
// //             hallStatusMap.approved || 0,
// //           pending:
// //             hallStatusMap.pending || 0,
// //           rejected:
// //             hallStatusMap.rejected || 0,
// //           suspended:
// //             hallStatusMap.suspended || 0,
// //         },

// //         packages: {
// //           total: totalPackages,
// //           active: activePackages,
// //         },

// //         bookings: {
// //           total: Object.values(
// //             bookingStatusMap
// //           ).reduce(
// //             (sum, count) =>
// //               sum + count,
// //             0
// //           ),

// //           pending:
// //             bookingStatusMap.pending || 0,

// //           confirmed:
// //             bookingStatusMap.confirmed || 0,

// //           completed:
// //             bookingStatusMap.completed || 0,

// //           cancelled:
// //             bookingStatusMap.cancelled || 0,

// //           rejected:
// //             bookingStatusMap.rejected || 0,

// //           upcoming:
// //             upcomingBookings.length,
// //         },

// //         customers,

// //         revenue,

// //         last30DaysRevenue,

// //         averageRating,

// //         reviews,
// //       },

// //       halls,

// //       upcomingBookings,

// //       topPackages,
// //     });
// //   } catch (error) {
// //     console.error(
// //       "Owner Dashboard Error:",
// //       error
// //     );

// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error",
// //     });
// //   }
// // };

// // /*
// // |--------------------------------------------------------------------------
// // | Admin Dashboard
// // |--------------------------------------------------------------------------
// // | GET /api/v1/dashboard/admin
// // |--------------------------------------------------------------------------
// // */

// // const getAdminDashboard = async (
// //   req,
// //   res
// // ) => {
// //   try {
// //     const today = new Date();

// //     today.setUTCHours(0, 0, 0, 0);

// //     const thirtyDaysAgo = new Date(
// //       today
// //     );

// //     thirtyDaysAgo.setUTCDate(
// //       thirtyDaysAgo.getUTCDate() - 30
// //     );

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Users
// //     |--------------------------------------------------------------------------
// //     */

// //     const userStats =
// //       await User.aggregate([
// //         {
// //           $group: {
// //             _id: "$role",
// //             count: {
// //               $sum: 1,
// //             },
// //           },
// //         },
// //       ]);

// //     const usersByRole = {};

// //     userStats.forEach((item) => {
// //       usersByRole[item._id] =
// //         item.count;
// //     });

// //     const totalUsers =
// //       await User.countDocuments();

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Halls
// //     |--------------------------------------------------------------------------
// //     */

// //     const hallStats =
// //       await Hall.aggregate([
// //         {
// //           $match: {
// //             isDeleted: false,
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: "$status",
// //             count: {
// //               $sum: 1,
// //             },
// //           },
// //         },
// //       ]);

// //     const hallsByStatus = {};

// //     hallStats.forEach((item) => {
// //       hallsByStatus[item._id] =
// //         item.count;
// //     });

// //     const totalHalls =
// //       await Hall.countDocuments({
// //         isDeleted: false,
// //       });

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Bookings
// //     |--------------------------------------------------------------------------
// //     */

// //     const bookingStats =
// //       await Booking.aggregate([
// //         {
// //           $group: {
// //             _id: "$status",
// //             count: {
// //               $sum: 1,
// //             },
// //           },
// //         },
// //       ]);

// //     const bookingsByStatus = {};

// //     bookingStats.forEach((item) => {
// //       bookingsByStatus[item._id] =
// //         item.count;
// //     });

// //     const totalBookings =
// //       await Booking.countDocuments();

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Revenue
// //     |--------------------------------------------------------------------------
// //     */

// //     const revenueResult =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             status: {
// //               $in: [
// //                 "confirmed",
// //                 "completed",
// //               ],
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: null,
// //             total: {
// //               $sum: "$totalAmount",
// //             },
// //           },
// //         },
// //       ]);

// //     const revenue =
// //       revenueResult[0]?.total || 0;

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Last 30 Days Revenue
// //     |--------------------------------------------------------------------------
// //     */

// //     const last30DaysRevenueResult =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             status: {
// //               $in: [
// //                 "confirmed",
// //                 "completed",
// //               ],
// //             },
// //             createdAt: {
// //               $gte: thirtyDaysAgo,
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: null,
// //             total: {
// //               $sum: "$totalAmount",
// //             },
// //           },
// //         },
// //       ]);

// //     const last30DaysRevenue =
// //       last30DaysRevenueResult[0]?.total ||
// //       0;

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Pending Halls
// //     |--------------------------------------------------------------------------
// //     */

// //     const pendingHalls =
// //       await Hall.find({
// //         status: "pending",
// //         isDeleted: false,
// //       })
// //         .populate({
// //           path: "owner",
// //           select: "name email phone",
// //         })
// //         .select(
// //           "name city area startingPrice coverImage createdAt owner"
// //         )
// //         .sort({
// //           createdAt: -1,
// //         })
// //         .limit(10)
// //         .lean();

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Pending Bookings
// //     |--------------------------------------------------------------------------
// //     */

// //     const pendingBookings =
// //       await Booking.find({
// //         status: "pending",
// //       })
// //         .populate({
// //           path: "hall",
// //           select: "name city",
// //         })
// //         .populate({
// //           path: "package",
// //           select: "name price",
// //         })
// //         .populate({
// //           path: "customer",
// //           select: "name phone email",
// //         })
// //         .sort({
// //           createdAt: -1,
// //         })
// //         .limit(10)
// //         .lean();

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Recent Bookings
// //     |--------------------------------------------------------------------------
// //     */

// //     const recentBookings =
// //       await Booking.find({})
// //         .populate({
// //           path: "hall",
// //           select: "name city",
// //         })
// //         .populate({
// //           path: "customer",
// //           select: "name",
// //         })
// //         .sort({
// //           createdAt: -1,
// //         })
// //         .limit(10)
// //         .lean();

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Popular Halls
// //     |--------------------------------------------------------------------------
// //     */

// //     const popularHalls =
// //       await Booking.aggregate([
// //         {
// //           $match: {
// //             status: {
// //               $in: [
// //                 "confirmed",
// //                 "completed",
// //               ],
// //             },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: "$hall",
// //             bookings: {
// //               $sum: 1,
// //             },
// //             revenue: {
// //               $sum: "$totalAmount",
// //             },
// //           },
// //         },
// //         {
// //           $sort: {
// //             bookings: -1,
// //           },
// //         },
// //         {
// //           $limit: 5,
// //         },
// //         {
// //           $lookup: {
// //             from: "halls",
// //             localField: "_id",
// //             foreignField: "_id",
// //             as: "hall",
// //           },
// //         },
// //         {
// //           $unwind: {
// //             path: "$hall",
// //             preserveNullAndEmptyArrays: true,
// //           },
// //         },
// //         {
// //           $project: {
// //             _id: 1,
// //             bookings: 1,
// //             revenue: 1,
// //             name: "$hall.name",
// //             city: "$hall.city",
// //             rating: "$hall.rating",
// //           },
// //         },
// //       ]);

// //     /*
// //     |--------------------------------------------------------------------------
// //     | Response
// //     |--------------------------------------------------------------------------
// //     */

// //     return res.status(200).json({
// //       success: true,

// //       stats: {
// //         users: {
// //           total: totalUsers,

// //           customers:
// //             usersByRole.user || 0,

// //           hallOwners:
// //             usersByRole.hallOwner || 0,

// //           admins:
// //             usersByRole.admin || 0,
// //         },

// //         halls: {
// //           total: totalHalls,

// //           approved:
// //             hallsByStatus.approved || 0,

// //           pending:
// //             hallsByStatus.pending || 0,

// //           rejected:
// //             hallsByStatus.rejected || 0,

// //           suspended:
// //             hallsByStatus.suspended || 0,
// //         },

// //         bookings: {
// //           total: totalBookings,

// //           pending:
// //             bookingsByStatus.pending || 0,

// //           confirmed:
// //             bookingsByStatus.confirmed || 0,

// //           completed:
// //             bookingsByStatus.completed || 0,

// //           cancelled:
// //             bookingsByStatus.cancelled || 0,

// //           rejected:
// //             bookingsByStatus.rejected || 0,
// //         },

// //         revenue,

// //         last30DaysRevenue,
// //       },

// //       pendingHalls,

// //       pendingBookings,

// //       recentBookings,

// //       popularHalls,
// //     });
// //   } catch (error) {
// //     console.error(
// //       "Admin Dashboard Error:",
// //       error
// //     );

// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error",
// //     });
// //   }
// // };

// // module.exports = {
// //   getOwnerDashboard,
// //   getAdminDashboard,
// // };



// const mongoose = require("mongoose");
// const Hall = require("../models/Hall");
// const Booking = require("../models/Booking");
// const Package = require("../models/Package");
// const Review = require("../models/Review");
// const User = require("../models/User");

// /*
// |--------------------------------------------------------------------------
// | Helpers
// |--------------------------------------------------------------------------
// */

// const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// const getUtcStartOfToday = () => {
//   const date = new Date();

//   date.setUTCHours(0, 0, 0, 0);

//   return date;
// };

// const getUtcDateDaysAgo = (days) => {
//   const date = getUtcStartOfToday();

//   date.setUTCDate(date.getUTCDate() - days);

//   return date;
// };

// const emptyOwnerDashboard = () => ({
//   stats: {
//     halls: {
//       total: 0,
//       approved: 0,
//       pending: 0,
//       rejected: 0,
//       suspended: 0,
//     },

//     packages: {
//       total: 0,
//       active: 0,
//     },

//     bookings: {
//       total: 0,
//       pending: 0,
//       confirmed: 0,
//       rejected: 0,
//       cancelled: 0,
//       completed: 0,
//       upcoming: 0,
//     },

//     customers: 0,

//     revenue: 0,
//     paidRevenue: 0,
//     last30DaysRevenue: 0,

//     averageRating: 0,
//     reviews: 0,
//   },

//   halls: [],
//   upcomingBookings: [],
//   topPackages: [],
// });

// /*
// |--------------------------------------------------------------------------
// | OWNER DASHBOARD
// |--------------------------------------------------------------------------
// */

// const getOwnerDashboard = async (req, res) => {
//   try {
//     const ownerId = toObjectId(req.user._id);

//     /*
//     |--------------------------------------------------------------------------
//     | Get owner's halls
//     |--------------------------------------------------------------------------
//     */

//     const halls = await Hall.find({
//       owner: ownerId,
//       isDeleted: false,
//     })
//       .select(
//         "_id name status isAvailable rating totalBookings startingPrice currency coverImage"
//       )
//       .sort({ createdAt: -1 })
//       .lean();

//     if (!halls.length) {
//       return res.status(200).json({
//         success: true,
//         data: emptyOwnerDashboard(),
//       });
//     }

//     const hallIds = halls.map((hall) => hall._id);

//     const today = getUtcStartOfToday();
//     const thirtyDaysAgo = getUtcDateDaysAgo(30);

//     /*
//     |--------------------------------------------------------------------------
//     | Run independent aggregations in parallel
//     |--------------------------------------------------------------------------
//     */

//     const [
//       hallStatusStats,
//       packageStats,
//       bookingStatusStats,
//       revenueStats,
//       last30DaysRevenueStats,
//       paidRevenueStats,
//       upcomingBookings,
//       customerStats,
//       reviewStats,
//       topPackages,
//     ] = await Promise.all([
//       /*
//       |--------------------------------------------------------------------------
//       | Hall status
//       |--------------------------------------------------------------------------
//       */

//       Hall.aggregate([
//         {
//           $match: {
//             owner: ownerId,
//             isDeleted: false,
//           },
//         },
//         {
//           $group: {
//             _id: "$status",
//             count: { $sum: 1 },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Packages
//       |--------------------------------------------------------------------------
//       */

//       Package.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//             isDeleted: false,
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: 1 },
//             active: {
//               $sum: {
//                 $cond: [{ $eq: ["$isActive", true] }, 1, 0],
//               },
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Booking status
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//           },
//         },
//         {
//           $group: {
//             _id: "$status",
//             count: { $sum: 1 },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Total booking value
//       |
//       | Confirmed + completed bookings
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Last 30 days booking value
//       |
//       | Uses confirmation/completion dates instead of createdAt.
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//             $or: [
//               {
//                 confirmedAt: {
//                   $gte: thirtyDaysAgo,
//                 },
//               },
//               {
//                 completedAt: {
//                   $gte: thirtyDaysAgo,
//                 },
//               },
//             ],
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Paid revenue
//       |
//       | We count only money that is actually paid.
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//             paymentStatus: "paid",
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Upcoming bookings
//       |--------------------------------------------------------------------------
//       */

//       Booking.find({
//         hall: { $in: hallIds },
//         eventDate: {
//           $gte: today,
//         },
//         status: {
//           $in: ["pending", "confirmed"],
//         },
//       })
//         .populate({
//           path: "hall",
//           select: "name city area address coverImage",
//         })
//         .populate({
//           path: "package",
//           select:
//             "name description price minGuests maxGuests durationHours features image",
//         })
//         .populate({
//           path: "customer",
//           select: "name email phone",
//         })
//         .sort({
//           eventDate: 1,
//         })
//         .limit(10)
//         .lean(),

//       /*
//       |--------------------------------------------------------------------------
//       | Unique customers
//       |
//       | Ignore rejected/cancelled bookings.
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//             status: {
//               $in: ["pending", "confirmed", "completed"],
//             },
//           },
//         },
//         {
//           $group: {
//             _id: "$customer",
//           },
//         },
//         {
//           $count: "total",
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Reviews
//       |--------------------------------------------------------------------------
//       */

//       Review.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//             isVisible: true,
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             averageRating: {
//               $avg: "$rating",
//             },
//             total: {
//               $sum: 1,
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Top packages
//       |
//       | Revenue comes from Booking.totalAmount.
//       | This avoids using the current Package.price for old bookings.
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             hall: { $in: hallIds },
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//             package: {
//               $ne: null,
//             },
//           },
//         },
//         {
//           $group: {
//             _id: "$package",

//             bookings: {
//               $sum: 1,
//             },

//             revenue: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//         {
//           $sort: {
//             bookings: -1,
//             revenue: -1,
//           },
//         },
//         {
//           $limit: 5,
//         },
//         {
//           $lookup: {
//             from: "packages",
//             localField: "_id",
//             foreignField: "_id",
//             as: "package",
//           },
//         },
//         {
//           $unwind: {
//             path: "$package",
//             preserveNullAndEmptyArrays: true,
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             bookings: 1,
//             revenue: 1,

//             package: {
//               _id: "$package._id",
//               name: "$package.name",
//               price: "$package.price",
//               isActive: "$package.isActive",
//               isDeleted: "$package.isDeleted",
//               image: "$package.image",
//               hall: "$package.hall",
//             },
//           },
//         },
//       ]),
//     ]);

//     /*
//     |--------------------------------------------------------------------------
//     | Format hall stats
//     |--------------------------------------------------------------------------
//     */

//     const hallStats = {
//       total: halls.length,
//       approved: 0,
//       pending: 0,
//       rejected: 0,
//       suspended: 0,
//     };

//     hallStatusStats.forEach((item) => {
//       if (Object.prototype.hasOwnProperty.call(hallStats, item._id)) {
//         hallStats[item._id] = item.count;
//       }
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | Format package stats
//     |--------------------------------------------------------------------------
//     */

//     const packageStatsData = packageStats[0] || {
//       total: 0,
//       active: 0,
//     };

//     /*
//     |--------------------------------------------------------------------------
//     | Format booking stats
//     |--------------------------------------------------------------------------
//     */

//     const bookingStats = {
//       total: 0,
//       pending: 0,
//       confirmed: 0,
//       rejected: 0,
//       cancelled: 0,
//       completed: 0,
//       upcoming: upcomingBookings.length,
//     };

//     bookingStatusStats.forEach((item) => {
//       if (
//         Object.prototype.hasOwnProperty.call(
//           bookingStats,
//           item._id
//         )
//       ) {
//         bookingStats[item._id] = item.count;
//         bookingStats.total += item.count;
//       }
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | Revenue
//     |--------------------------------------------------------------------------
//     */

//     const revenue =
//       revenueStats[0]?.total || 0;

//     const paidRevenue =
//       paidRevenueStats[0]?.total || 0;

//     const last30DaysRevenue =
//       last30DaysRevenueStats[0]?.total || 0;

//     /*
//     |--------------------------------------------------------------------------
//     | Customers
//     |--------------------------------------------------------------------------
//     */

//     const customers =
//       customerStats[0]?.total || 0;

//     /*
//     |--------------------------------------------------------------------------
//     | Reviews
//     |--------------------------------------------------------------------------
//     */

//     const averageRating = reviewStats[0]?.averageRating
//       ? Number(reviewStats[0].averageRating.toFixed(2))
//       : 0;

//     const reviews = reviewStats[0]?.total || 0;

//     /*
//     |--------------------------------------------------------------------------
//     | Response
//     |--------------------------------------------------------------------------
//     */

//     return res.status(200).json({
//       success: true,

//       data: {
//         stats: {
//           halls: hallStats,

//           packages: {
//             total: packageStatsData.total,
//             active: packageStatsData.active,
//           },

//           bookings: bookingStats,

//           customers,

//           revenue,

//           paidRevenue,

//           last30DaysRevenue,

//           averageRating,

//           reviews,
//         },

//         halls,

//         upcomingBookings,

//         topPackages,
//       },
//     });
//   } catch (error) {
//     console.error("Get owner dashboard error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load owner dashboard",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// /*
// |--------------------------------------------------------------------------
// | ADMIN DASHBOARD
// |--------------------------------------------------------------------------
// */

// const getAdminDashboard = async (req, res) => {
//   try {
//     const today = getUtcStartOfToday();
//     const thirtyDaysAgo = getUtcDateDaysAgo(30);

//     /*
//     |--------------------------------------------------------------------------
//     | Run independent queries in parallel
//     |--------------------------------------------------------------------------
//     */

//     const [
//       userStats,
//       hallStats,
//       bookingStats,
//       revenueStats,
//       paidRevenueStats,
//       last30DaysRevenueStats,
//       pendingHalls,
//       pendingBookings,
//       recentBookings,
//       popularHalls,
//     ] = await Promise.all([
//       /*
//       |--------------------------------------------------------------------------
//       | Users
//       |--------------------------------------------------------------------------
//       */

//       User.aggregate([
//         {
//           $group: {
//             _id: "$role",
//             count: {
//               $sum: 1,
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Halls
//       |--------------------------------------------------------------------------
//       */

//       Hall.aggregate([
//         {
//           $match: {
//             isDeleted: false,
//           },
//         },
//         {
//           $group: {
//             _id: "$status",
//             count: {
//               $sum: 1,
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Bookings
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $group: {
//             _id: "$status",
//             count: {
//               $sum: 1,
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Total booking value
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Paid revenue
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//             paymentStatus: "paid",
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Last 30 days booking value
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//             $or: [
//               {
//                 confirmedAt: {
//                   $gte: thirtyDaysAgo,
//                 },
//               },
//               {
//                 completedAt: {
//                   $gte: thirtyDaysAgo,
//                 },
//               },
//             ],
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//       ]),

//       /*
//       |--------------------------------------------------------------------------
//       | Pending halls
//       |--------------------------------------------------------------------------
//       */

//       Hall.find({
//         status: "pending",
//         isDeleted: false,
//       })
//         .populate({
//           path: "owner",
//           select: "name email phone",
//         })
//         .sort({
//           createdAt: -1,
//         })
//         .limit(10)
//         .lean(),

//       /*
//       |--------------------------------------------------------------------------
//       | Pending bookings
//       |--------------------------------------------------------------------------
//       */

//       Booking.find({
//         status: "pending",
//       })
//         .populate({
//           path: "hall",
//           select: "name city area owner",
//         })
//         .populate({
//           path: "package",
//           select: "name price",
//         })
//         .populate({
//           path: "customer",
//           select: "name email phone",
//         })
//         .sort({
//           createdAt: -1,
//         })
//         .limit(10)
//         .lean(),

//       /*
//       |--------------------------------------------------------------------------
//       | Recent bookings
//       |--------------------------------------------------------------------------
//       */

//       Booking.find({})
//         .populate({
//           path: "hall",
//           select: "name city area",
//         })
//         .populate({
//           path: "package",
//           select: "name price",
//         })
//         .populate({
//           path: "customer",
//           select: "name email phone",
//         })
//         .sort({
//           createdAt: -1,
//         })
//         .limit(10)
//         .lean(),

//       /*
//       |--------------------------------------------------------------------------
//       | Popular halls
//       |--------------------------------------------------------------------------
//       */

//       Booking.aggregate([
//         {
//           $match: {
//             status: {
//               $in: ["confirmed", "completed"],
//             },
//           },
//         },
//         {
//           $group: {
//             _id: "$hall",

//             bookings: {
//               $sum: 1,
//             },

//             revenue: {
//               $sum: {
//                 $ifNull: ["$totalAmount", 0],
//               },
//             },
//           },
//         },
//         {
//           $sort: {
//             bookings: -1,
//             revenue: -1,
//           },
//         },
//         {
//           $limit: 10,
//         },
//         {
//           $lookup: {
//             from: "halls",
//             localField: "_id",
//             foreignField: "_id",
//             as: "hall",
//           },
//         },
//         {
//           $unwind: {
//             path: "$hall",
//             preserveNullAndEmptyArrays: false,
//           },
//         },
//         {
//           $match: {
//             "hall.isDeleted": false,
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             bookings: 1,
//             revenue: 1,

//             hall: {
//               _id: "$hall._id",
//               name: "$hall.name",
//               city: "$hall.city",
//               area: "$hall.area",
//               status: "$hall.status",
//               isAvailable: "$hall.isAvailable",
//               coverImage: "$hall.coverImage",
//               rating: "$hall.rating",
//             },
//           },
//         },
//       ]),
//     ]);

//     /*
//     |--------------------------------------------------------------------------
//     | Format user stats
//     |--------------------------------------------------------------------------
//     */

//     const users = {
//       total: 0,
//       user: 0,
//       hallOwner: 0,
//       admin: 0,
//     };

//     userStats.forEach((item) => {
//       users.total += item.count;

//       if (
//         Object.prototype.hasOwnProperty.call(users, item._id)
//       ) {
//         users[item._id] = item.count;
//       }
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | Format hall stats
//     |--------------------------------------------------------------------------
//     */

//     const halls = {
//       total: 0,
//       pending: 0,
//       approved: 0,
//       rejected: 0,
//       suspended: 0,
//     };

//     hallStats.forEach((item) => {
//       halls.total += item.count;

//       if (
//         Object.prototype.hasOwnProperty.call(halls, item._id)
//       ) {
//         halls[item._id] = item.count;
//       }
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | Format booking stats
//     |--------------------------------------------------------------------------
//     */

//     const bookings = {
//       total: 0,
//       pending: 0,
//       confirmed: 0,
//       rejected: 0,
//       cancelled: 0,
//       completed: 0,
//     };

//     bookingStats.forEach((item) => {
//       bookings.total += item.count;

//       if (
//         Object.prototype.hasOwnProperty.call(
//           bookings,
//           item._id
//         )
//       ) {
//         bookings[item._id] = item.count;
//       }
//     });

//     /*
//     |--------------------------------------------------------------------------
//     | Revenue
//     |--------------------------------------------------------------------------
//     */

//     const revenue =
//       revenueStats[0]?.total || 0;

//     const paidRevenue =
//       paidRevenueStats[0]?.total || 0;

//     const last30DaysRevenue =
//       last30DaysRevenueStats[0]?.total || 0;

//     /*
//     |--------------------------------------------------------------------------
//     | Response
//     |--------------------------------------------------------------------------
//     */

//     return res.status(200).json({
//       success: true,

//       data: {
//         users,

//         halls,

//         bookings,

//         revenue,

//         paidRevenue,

//         last30DaysRevenue,

//         upcomingBookingsCount: await Booking.countDocuments({
//           eventDate: {
//             $gte: today,
//           },
//           status: {
//             $in: ["pending", "confirmed"],
//           },
//         }),

//         pendingHalls,

//         pendingBookings,

//         recentBookings,

//         popularHalls,
//       },
//     });
//   } catch (error) {
//     console.error("Get admin dashboard error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load admin dashboard",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : undefined,
//     });
//   }
// };

// module.exports = {
//   getOwnerDashboard,
//   getAdminDashboard,
// };


const mongoose = require("mongoose");
const Hall = require("../models/Hall");
const Booking = require("../models/Booking");
const Package = require("../models/Package");
const Review = require("../models/Review");
const User = require("../models/User");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const getUtcStartOfToday = () => {
  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);

  return date;
};

const getUtcDateDaysAgo = (days) => {
  const date = getUtcStartOfToday();

  date.setUTCDate(date.getUTCDate() - days);

  return date;
};

const emptyOwnerDashboard = () => ({
  stats: {
    halls: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
    },

    packages: {
      total: 0,
      active: 0,
    },

    bookings: {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0,
      upcoming: 0,
    },

    customers: 0,

    revenue: 0,
    paidRevenue: 0,
    last30DaysRevenue: 0,

    averageRating: 0,
    reviews: 0,
  },

  halls: [],
  upcomingBookings: [],
  topPackages: [],
});

/*
|--------------------------------------------------------------------------
| OWNER DASHBOARD
|--------------------------------------------------------------------------
*/

const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = toObjectId(req.user._id);

    /*
    |--------------------------------------------------------------------------
    | Get owner's halls
    |--------------------------------------------------------------------------
    */

    const halls = await Hall.find({
      owner: ownerId,
      isDeleted: false,
    })
      .select(
        "_id name status isAvailable rating totalBookings startingPrice currency coverImage"
      )
      .sort({ createdAt: -1 })
      .lean();

    if (!halls.length) {
      return res.status(200).json({
        success: true,
        data: emptyOwnerDashboard(),
      });
    }

    const hallIds = halls.map((hall) => hall._id);

    const today = getUtcStartOfToday();
    const thirtyDaysAgo = getUtcDateDaysAgo(30);

    /*
    |--------------------------------------------------------------------------
    | Run independent aggregations in parallel
    |--------------------------------------------------------------------------
    */

    const [
      hallStatusStats,
      packageStats,
      bookingStatusStats,
      revenueStats,
      last30DaysRevenueStats,
      paidRevenueStats,
      upcomingBookings,
      customerStats,
      reviewStats,
      topPackages,
    ] = await Promise.all([
      /*
      |--------------------------------------------------------------------------
      | Hall status
      |--------------------------------------------------------------------------
      */

      Hall.aggregate([
        {
          $match: {
            owner: ownerId,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Packages
      |--------------------------------------------------------------------------
      */

      Package.aggregate([
        {
          $match: {
            hall: { $in: hallIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ["$isActive", true] }, 1, 0],
              },
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Booking status
      |--------------------------------------------------------------------------
      */

      Booking.aggregate([
        {
          $match: {
            hall: { $in: hallIds },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | PAID REVENUE
      |--------------------------------------------------------------------------
      |
      | Only bookings that are actually paid count as revenue.
      |
      | confirmed + unpaid    => NOT counted
      | completed + unpaid   => NOT counted
      | confirmed + paid     => counted
      | completed + paid     => counted
      | refunded             => NOT counted because paymentStatus != paid
      |
      */

      Booking.aggregate([
        {
          $match: {
            hall: { $in: hallIds },

            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | PAID REVENUE - LAST 30 DAYS
      |--------------------------------------------------------------------------
      |
      | Only paid bookings are included.
      |
      */

      Booking.aggregate([
        {
          $match: {
            hall: { $in: hallIds },

            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",

            $or: [
              {
                confirmedAt: {
                  $gte: thirtyDaysAgo,
                },
              },
              {
                completedAt: {
                  $gte: thirtyDaysAgo,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Paid Revenue
      |--------------------------------------------------------------------------
      |
      | Kept separately for compatibility.
      |
      */

      Booking.aggregate([
        {
          $match: {
            hall: { $in: hallIds },

            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Upcoming bookings
      |--------------------------------------------------------------------------
      */

      Booking.find({
        hall: { $in: hallIds },

        eventDate: {
          $gte: today,
        },

        status: {
          $in: ["pending", "confirmed"],
        },
      })
        .populate({
          path: "hall",
          select: "name city area address coverImage",
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
        })
        .limit(10)
        .lean(),

      /*
      |--------------------------------------------------------------------------
      | Unique customers
      |--------------------------------------------------------------------------
      */

      Booking.aggregate([
        {
          $match: {
            hall: { $in: hallIds },

            status: {
              $in: [
                "pending",
                "confirmed",
                "completed",
              ],
            },
          },
        },
        {
          $group: {
            _id: "$customer",
          },
        },
        {
          $count: "total",
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Reviews
      |--------------------------------------------------------------------------
      */

      Review.aggregate([
        {
          $match: {
            hall: { $in: hallIds },
            isVisible: true,
          },
        },
        {
          $group: {
            _id: null,

            averageRating: {
              $avg: "$rating",
            },

            total: {
              $sum: 1,
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Top Packages
      |--------------------------------------------------------------------------
      |
      | Only PAID bookings contribute to package revenue.
      |
      */

      Booking.aggregate([
        {
          $match: {
            hall: { $in: hallIds },

            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",

            package: {
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$package",

            bookings: {
              $sum: 1,
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
        {
          $sort: {
            bookings: -1,
            revenue: -1,
          },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "packages",
            localField: "_id",
            foreignField: "_id",
            as: "package",
          },
        },
        {
          $unwind: {
            path: "$package",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,

            bookings: 1,

            revenue: 1,

            package: {
              _id: "$package._id",
              name: "$package.name",
              price: "$package.price",
              isActive: "$package.isActive",
              isDeleted: "$package.isDeleted",
              image: "$package.image",
              hall: "$package.hall",
            },
          },
        },
      ]),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Format hall stats
    |--------------------------------------------------------------------------
    */

    const hallStats = {
      total: halls.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
    };

    hallStatusStats.forEach((item) => {
      if (
        Object.prototype.hasOwnProperty.call(
          hallStats,
          item._id
        )
      ) {
        hallStats[item._id] = item.count;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Format package stats
    |--------------------------------------------------------------------------
    */

    const packageStatsData = packageStats[0] || {
      total: 0,
      active: 0,
    };

    /*
    |--------------------------------------------------------------------------
    | Format booking stats
    |--------------------------------------------------------------------------
    */

    const bookingStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0,
      upcoming: upcomingBookings.length,
    };

    bookingStatusStats.forEach((item) => {
      if (
        Object.prototype.hasOwnProperty.call(
          bookingStats,
          item._id
        )
      ) {
        bookingStats[item._id] = item.count;
        bookingStats.total += item.count;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Revenue
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | revenue is now PAID ONLY.
    |
    */

    const revenue =
      revenueStats[0]?.total || 0;

    const paidRevenue =
      paidRevenueStats[0]?.total || 0;

    const last30DaysRevenue =
      last30DaysRevenueStats[0]?.total || 0;

    /*
    |--------------------------------------------------------------------------
    | Customers
    |--------------------------------------------------------------------------
    */

    const customers =
      customerStats[0]?.total || 0;

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    */

    const averageRating =
      reviewStats[0]?.averageRating
        ? Number(
            reviewStats[0].averageRating.toFixed(2)
          )
        : 0;

    const reviews =
      reviewStats[0]?.total || 0;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data: {
        stats: {
          halls: hallStats,

          packages: {
            total: packageStatsData.total,
            active: packageStatsData.active,
          },

          bookings: bookingStats,

          customers,

          revenue,

          paidRevenue,

          last30DaysRevenue,

          averageRating,

          reviews,
        },

        halls,

        upcomingBookings,

        topPackages,
      },
    });
  } catch (error) {
    console.error(
      "Get owner dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load owner dashboard",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

const getAdminDashboard = async (req, res) => {
  try {
    const today = getUtcStartOfToday();
    const thirtyDaysAgo = getUtcDateDaysAgo(30);

    /*
    |--------------------------------------------------------------------------
    | Run independent queries in parallel
    |--------------------------------------------------------------------------
    */

    const [
      userStats,
      hallStats,
      bookingStats,
      revenueStats,
      paidRevenueStats,
      last30DaysRevenueStats,
      pendingHalls,
      pendingBookings,
      recentBookings,
      popularHalls,
    ] = await Promise.all([
      /*
      |--------------------------------------------------------------------------
      | Users
      |--------------------------------------------------------------------------
      */

      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Halls
      |--------------------------------------------------------------------------
      */

      Hall.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Bookings
      |--------------------------------------------------------------------------
      */

      Booking.aggregate([
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | PAID REVENUE
      |--------------------------------------------------------------------------
      |
      | Only paid bookings count.
      |
      */

      Booking.aggregate([
        {
          $match: {
            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Paid Revenue
      |--------------------------------------------------------------------------
      |
      | Kept for compatibility.
      |
      */

      Booking.aggregate([
        {
          $match: {
            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | PAID REVENUE - LAST 30 DAYS
      |--------------------------------------------------------------------------
      */

      Booking.aggregate([
        {
          $match: {
            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",

            $or: [
              {
                confirmedAt: {
                  $gte: thirtyDaysAgo,
                },
              },
              {
                completedAt: {
                  $gte: thirtyDaysAgo,
                },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
      ]),

      /*
      |--------------------------------------------------------------------------
      | Pending halls
      |--------------------------------------------------------------------------
      */

      Hall.find({
        status: "pending",
        isDeleted: false,
      })
        .populate({
          path: "owner",
          select: "name email phone",
        })
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      /*
      |--------------------------------------------------------------------------
      | Pending bookings
      |--------------------------------------------------------------------------
      */

      Booking.find({
        status: "pending",
      })
        .populate({
          path: "hall",
          select: "name city area owner",
        })
        .populate({
          path: "package",
          select: "name price",
        })
        .populate({
          path: "customer",
          select: "name email phone",
        })
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      /*
      |--------------------------------------------------------------------------
      | Recent bookings
      |--------------------------------------------------------------------------
      */

      Booking.find({})
        .populate({
          path: "hall",
          select: "name city area",
        })
        .populate({
          path: "package",
          select: "name price",
        })
        .populate({
          path: "customer",
          select: "name email phone",
        })
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      /*
      |--------------------------------------------------------------------------
      | Popular halls
      |--------------------------------------------------------------------------
      |
      | Revenue is calculated from PAID bookings only.
      |
      */

      Booking.aggregate([
        {
          $match: {
            status: {
              $in: ["confirmed", "completed"],
            },

            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: "$hall",

            bookings: {
              $sum: 1,
            },

            revenue: {
              $sum: {
                $ifNull: ["$totalAmount", 0],
              },
            },
          },
        },
        {
          $sort: {
            bookings: -1,
            revenue: -1,
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "halls",
            localField: "_id",
            foreignField: "_id",
            as: "hall",
          },
        },
        {
          $unwind: {
            path: "$hall",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: {
            "hall.isDeleted": false,
          },
        },
        {
          $project: {
            _id: 1,

            bookings: 1,

            revenue: 1,

            hall: {
              _id: "$hall._id",
              name: "$hall.name",
              city: "$hall.city",
              area: "$hall.area",
              status: "$hall.status",
              isAvailable: "$hall.isAvailable",
              coverImage: "$hall.coverImage",
              rating: "$hall.rating",
            },
          },
        },
      ]),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Format user stats
    |--------------------------------------------------------------------------
    */

    const users = {
      total: 0,
      user: 0,
      hallOwner: 0,
      admin: 0,
    };

    userStats.forEach((item) => {
      users.total += item.count;

      if (
        Object.prototype.hasOwnProperty.call(
          users,
          item._id
        )
      ) {
        users[item._id] = item.count;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Format hall stats
    |--------------------------------------------------------------------------
    */

    const halls = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    };

    hallStats.forEach((item) => {
      halls.total += item.count;

      if (
        Object.prototype.hasOwnProperty.call(
          halls,
          item._id
        )
      ) {
        halls[item._id] = item.count;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Format booking stats
    |--------------------------------------------------------------------------
    */

    const bookings = {
      total: 0,
      pending: 0,
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0,
    };

    bookingStats.forEach((item) => {
      bookings.total += item.count;

      if (
        Object.prototype.hasOwnProperty.call(
          bookings,
          item._id
        )
      ) {
        bookings[item._id] = item.count;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Revenue
    |--------------------------------------------------------------------------
    */

    const revenue =
      revenueStats[0]?.total || 0;

    const paidRevenue =
      paidRevenueStats[0]?.total || 0;

    const last30DaysRevenue =
      last30DaysRevenueStats[0]?.total || 0;

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data: {
        users,

        halls,

        bookings,

        revenue,

        paidRevenue,

        last30DaysRevenue,

        upcomingBookingsCount:
          await Booking.countDocuments({
            eventDate: {
              $gte: today,
            },

            status: {
              $in: ["pending", "confirmed"],
            },
          }),

        pendingHalls,

        pendingBookings,

        recentBookings,

        popularHalls,
      },
    });
  } catch (error) {
    console.error(
      "Get admin dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

module.exports = {
  getOwnerDashboard,
  getAdminDashboard,
};