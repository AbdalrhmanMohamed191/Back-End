// const mongoose = require("mongoose");

// const Review = require("../models/Review");
// const Booking = require("../models/Booking");
// const Hall = require("../models/Hall");

// const isValidObjectId = (id) => {
//   return mongoose.isValidObjectId(id);
// };

// /*
// |--------------------------------------------------------------------------
// | Recalculate Hall Rating
// |--------------------------------------------------------------------------
// */

// const recalculateHallRating = async (hallId) => {
//   const result = await Review.aggregate([
//     {
//       $match: {
//         hall: new mongoose.Types.ObjectId(hallId),
//         isVisible: true,
//       },
//     },
//     {
//       $group: {
//         _id: "$hall",
//         average: {
//           $avg: "$rating",
//         },
//         count: {
//           $sum: 1,
//         },
//       },
//     },
//   ]);

//   const rating = result[0] || {
//     average: 0,
//     count: 0,
//   };

//   await Hall.findByIdAndUpdate(hallId, {
//     "rating.average": Number(
//       rating.average.toFixed(1)
//     ),
//     "rating.count": rating.count,
//   });
// };

// /*
// |--------------------------------------------------------------------------
// | Create Review
// |--------------------------------------------------------------------------
// | POST /api/v1/reviews
// |--------------------------------------------------------------------------
// */

// const createReview = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       rating,
//       comment,
//     } = req.body;

//     if (
//       !bookingId ||
//       !isValidObjectId(bookingId)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid bookingId is required",
//       });
//     }

//     const parsedRating = Number(rating);

//     if (
//       !Number.isInteger(parsedRating) ||
//       parsedRating < 1 ||
//       parsedRating > 5
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Rating must be an integer between 1 and 5",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Booking must belong to current customer
//     |--------------------------------------------------------------------------
//     */

//     const booking = await Booking.findOne({
//       _id: bookingId,
//       customer: req.user._id,
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Only completed bookings can be reviewed
//     |--------------------------------------------------------------------------
//     */

//     if (booking.status !== "completed") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "You can only review a completed booking",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Check existing review
//     |--------------------------------------------------------------------------
//     */

//     const existingReview =
//       await Review.findOne({
//         booking: booking._id,
//       });

//     if (existingReview) {
//       return res.status(409).json({
//         success: false,
//         message:
//           "You have already reviewed this booking",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Make sure Hall still exists
//     |--------------------------------------------------------------------------
//     */

//     const hall = await Hall.findOne({
//       _id: booking.hall,
//       isDeleted: false,
//     });

//     if (!hall) {
//       return res.status(404).json({
//         success: false,
//         message: "Hall not found",
//       });
//     }

//     /*
//     |--------------------------------------------------------------------------
//     | Create Review
//     |--------------------------------------------------------------------------
//     */

//     let review;

//     try {
//       review = await Review.create({
//         hall: booking.hall,
//         booking: booking._id,
//         customer: req.user._id,
//         rating: parsedRating,
//         comment: comment || "",
//       });
//     } catch (error) {
//       if (error.code === 11000) {
//         return res.status(409).json({
//           success: false,
//           message:
//             "You have already reviewed this booking",
//         });
//       }

//       throw error;
//     }

//     await recalculateHallRating(
//       booking.hall
//     );

//     const populatedReview =
//       await Review.findById(review._id)
//         .populate({
//           path: "customer",
//           select: "name",
//         })
//         .populate({
//           path: "hall",
//           select: "name city",
//         });

//     return res.status(201).json({
//       success: true,
//       message: "Review created successfully",
//       review: populatedReview,
//     });
//   } catch (error) {
//     console.error(
//       "Create Review Error:",
//       error
//     );

//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         success: false,
//         message: "Validation error",
//         errors: Object.values(
//           error.errors
//         ).map((item) => item.message),
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
// | Get Hall Reviews
// |--------------------------------------------------------------------------
// | GET /api/v1/reviews/hall/:hallId
// |--------------------------------------------------------------------------
// */

// const getHallReviews = async (req, res) => {
//   try {
//     const { hallId } = req.params;

//     const {
//       page = 1,
//       limit = 10,
//       rating,
//     } = req.query;

//     if (!isValidObjectId(hallId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid hall ID",
//       });
//     }

//     const parsedPage = Math.max(
//       parseInt(page, 10) || 1,
//       1
//     );

//     const parsedLimit = Math.min(
//       Math.max(parseInt(limit, 10) || 10, 1),
//       50
//     );

//     const hall = await Hall.findOne({
//       _id: hallId,
//       status: "approved",
//       isAvailable: true,
//       isDeleted: false,
//     }).select(
//       "_id name rating"
//     );

//     if (!hall) {
//       return res.status(404).json({
//         success: false,
//         message: "Hall not found",
//       });
//     }

//     const filter = {
//       hall: hallId,
//       isVisible: true,
//     };

//     if (rating !== undefined) {
//       const parsedRating = Number(rating);

//       if (
//         !Number.isInteger(parsedRating) ||
//         parsedRating < 1 ||
//         parsedRating > 5
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid rating filter",
//         });
//       }

//       filter.rating = parsedRating;
//     }

//     const total =
//       await Review.countDocuments(filter);

//     const reviews = await Review.find(filter)
//       .populate({
//         path: "customer",
//         select: "name",
//       })
//       .select(
//         "rating comment customer createdAt updatedAt"
//       )
//       .sort({
//         createdAt: -1,
//       })
//       .skip(
//         (parsedPage - 1) * parsedLimit
//       )
//       .limit(parsedLimit)
//       .lean();

//     return res.status(200).json({
//       success: true,
//       hall,
//       reviews,
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
//       "Get Hall Reviews Error:",
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
// | Get My Reviews
// |--------------------------------------------------------------------------
// | GET /api/v1/reviews/my
// |--------------------------------------------------------------------------
// */

// const getMyReviews = async (req, res) => {
//   try {
//     const reviews = await Review.find({
//       customer: req.user._id,
//     })
//       .populate({
//         path: "hall",
//         select:
//           "name city area coverImage rating",
//       })
//       .populate({
//         path: "booking",
//         select:
//           "eventDate guests totalAmount status",
//       })
//       .sort({
//         createdAt: -1,
//       })
//       .lean();

//     return res.status(200).json({
//       success: true,
//       reviews,
//     });
//   } catch (error) {
//     console.error(
//       "Get My Reviews Error:",
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
// | Update Review
// |--------------------------------------------------------------------------
// | PATCH /api/v1/reviews/:id
// |--------------------------------------------------------------------------
// */

// const updateReview = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { rating, comment } = req.body;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid review ID",
//       });
//     }

//     const review = await Review.findOne({
//       _id: id,
//       customer: req.user._id,
//     });

//     if (!review) {
//       return res.status(404).json({
//         success: false,
//         message: "Review not found",
//       });
//     }

//     if (rating !== undefined) {
//       const parsedRating = Number(rating);

//       if (
//         !Number.isInteger(parsedRating) ||
//         parsedRating < 1 ||
//         parsedRating > 5
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Rating must be an integer between 1 and 5",
//         });
//       }

//       review.rating = parsedRating;
//     }

//     if (comment !== undefined) {
//       review.comment = String(comment).trim();
//     }

//     await review.save();

//     await recalculateHallRating(
//       review.hall
//     );

//     const updatedReview =
//       await Review.findById(review._id)
//         .populate({
//           path: "customer",
//           select: "name",
//         })
//         .populate({
//           path: "hall",
//           select: "name city",
//         });

//     return res.status(200).json({
//       success: true,
//       message: "Review updated successfully",
//       review: updatedReview,
//     });
//   } catch (error) {
//     console.error(
//       "Update Review Error:",
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
// | Delete Review
// |--------------------------------------------------------------------------
// | DELETE /api/v1/reviews/:id
// |--------------------------------------------------------------------------
// */

// const deleteReview = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid review ID",
//       });
//     }

//     const review = await Review.findOne({
//       _id: id,
//       customer: req.user._id,
//     });

//     if (!review) {
//       return res.status(404).json({
//         success: false,
//         message: "Review not found",
//       });
//     }

//     const hallId = review.hall;

//     await Review.deleteOne({
//       _id: review._id,
//     });

//     await recalculateHallRating(
//       hallId
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Review deleted successfully",
//     });
//   } catch (error) {
//     console.error(
//       "Delete Review Error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// module.exports = {
//   createReview,
//   getHallReviews,
//   getMyReviews,
//   updateReview,
//   deleteReview,
// };




const mongoose = require("mongoose");

const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Hall = require("../models/Hall");

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const parsePagination = (page, limit) => {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

  const parsedLimit = Math.min(
    Math.max(parseInt(limit, 10) || 10, 1),
    50
  );

  return {
    page: parsedPage,
    limit: parsedLimit,
  };
};

const validateRating = (rating) => {
  const parsedRating = Number(rating);

  if (
    !Number.isInteger(parsedRating) ||
    parsedRating < 1 ||
    parsedRating > 5
  ) {
    return null;
  }

  return parsedRating;
};

const normalizeComment = (comment) => {
  if (comment === undefined || comment === null) {
    return "";
  }

  return String(comment).trim();
};

/*
|--------------------------------------------------------------------------
| Recalculate Hall Rating
|--------------------------------------------------------------------------
*/

const recalculateHallRating = async (hallId) => {
  if (!isValidObjectId(hallId)) {
    return;
  }

  const result = await Review.aggregate([
    {
      $match: {
        hall: new mongoose.Types.ObjectId(hallId),
        isVisible: true,
      },
    },
    {
      $group: {
        _id: "$hall",
        average: {
          $avg: "$rating",
        },
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const rating = result[0] || {
    average: 0,
    count: 0,
  };

  await Hall.findByIdAndUpdate(hallId, {
    "rating.average": Number(
      Number(rating.average || 0).toFixed(1)
    ),
    "rating.count": rating.count || 0,
  });
};

/*
|--------------------------------------------------------------------------
| Create Review
|--------------------------------------------------------------------------
| POST /api/v1/reviews
|--------------------------------------------------------------------------
*/

const createReview = async (req, res) => {
  try {
    const {
      bookingId,
      rating,
      comment,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate bookingId
    |--------------------------------------------------------------------------
    */

    if (
      !bookingId ||
      !isValidObjectId(bookingId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate rating
    |--------------------------------------------------------------------------
    */

    const parsedRating = validateRating(rating);

    if (!parsedRating) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be an integer between 1 and 5",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate comment
    |--------------------------------------------------------------------------
    */

    const normalizedComment =
      normalizeComment(comment);

    if (normalizedComment.length > 2000) {
      return res.status(400).json({
        success: false,
        message:
          "Comment cannot exceed 2000 characters",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find Customer Booking
    |--------------------------------------------------------------------------
    */

    const booking = await Booking.findOne({
      _id: bookingId,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Only Completed Bookings
    |--------------------------------------------------------------------------
    */

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "You can only review a completed booking",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing Review
    |--------------------------------------------------------------------------
    */

    const existingReview =
      await Review.findOne({
        booking: booking._id,
      });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message:
          "You have already reviewed this booking",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Make Sure Hall Exists
    |--------------------------------------------------------------------------
    */

    const hall = await Hall.findOne({
      _id: booking.hall,
      isDeleted: false,
    });

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Review
    |--------------------------------------------------------------------------
    */

    let review;

    try {
      review = await Review.create({
        hall: booking.hall,
        booking: booking._id,
        customer: req.user._id,
        rating: parsedRating,
        comment: normalizedComment,
        isVisible: true,
      });
    } catch (error) {
      /*
      |----------------------------------------------------------------------
      | Unique booking index protection
      |----------------------------------------------------------------------
      */

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "You have already reviewed this booking",
        });
      }

      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Recalculate Hall Rating
    |--------------------------------------------------------------------------
    */

    await recalculateHallRating(
      booking.hall
    );

    /*
    |--------------------------------------------------------------------------
    | Populate Response
    |--------------------------------------------------------------------------
    */

    const populatedReview =
      await Review.findById(review._id)
        .populate({
          path: "customer",
          select: "name",
        })
        .populate({
          path: "hall",
          select: "name city",
        });

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error(
      "Create Review Error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(
          error.errors
        ).map((item) => item.message),
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
| Get Hall Reviews
|--------------------------------------------------------------------------
| GET /api/v1/reviews/hall/:hallId
|--------------------------------------------------------------------------
*/

const getHallReviews = async (req, res) => {
  try {
    const { hallId } = req.params;

    const {
      page = 1,
      limit = 10,
      rating,
    } = req.query;

    if (!isValidObjectId(hallId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hall ID",
      });
    }

    const pagination = parsePagination(
      page,
      limit
    );

    /*
    |--------------------------------------------------------------------------
    | Public Hall Check
    |--------------------------------------------------------------------------
    */

    const hall = await Hall.findOne({
      _id: hallId,
      status: "approved",
      isAvailable: true,
      isDeleted: false,
    }).select("_id name rating");

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Review Filter
    |--------------------------------------------------------------------------
    */

    const filter = {
      hall: hallId,
      isVisible: true,
    };

    if (rating !== undefined) {
      const parsedRating =
        validateRating(rating);

      if (!parsedRating) {
        return res.status(400).json({
          success: false,
          message: "Invalid rating filter",
        });
      }

      filter.rating = parsedRating;
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const total =
      await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate({
        path: "customer",
        select: "name",
      })
      .select(
        "rating comment customer createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      })
      .skip(
        (pagination.page - 1) *
          pagination.limit
      )
      .limit(pagination.limit)
      .lean();

    return res.status(200).json({
      success: true,
      hall,
      reviews,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(
          total / pagination.limit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get Hall Reviews Error:",
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
| Get My Reviews
|--------------------------------------------------------------------------
| GET /api/v1/reviews/my
|--------------------------------------------------------------------------
*/

const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      customer: req.user._id,
    })
      .populate({
        path: "hall",
        select:
          "name city area coverImage rating",
      })
      .populate({
        path: "booking",
        select:
          "eventDate guests totalAmount status",
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error(
      "Get My Reviews Error:",
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
| Update Review
|--------------------------------------------------------------------------
| PATCH /api/v1/reviews/:id
|--------------------------------------------------------------------------
*/

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      rating,
      comment,
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Customer Ownership
    |--------------------------------------------------------------------------
    */

    const review = await Review.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Rating
    |--------------------------------------------------------------------------
    */

    if (rating !== undefined) {
      const parsedRating =
        validateRating(rating);

      if (!parsedRating) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be an integer between 1 and 5",
        });
      }

      review.rating = parsedRating;
    }

    /*
    |--------------------------------------------------------------------------
    | Update Comment
    |--------------------------------------------------------------------------
    */

    if (comment !== undefined) {
      const normalizedComment =
        normalizeComment(comment);

      if (normalizedComment.length > 2000) {
        return res.status(400).json({
          success: false,
          message:
            "Comment cannot exceed 2000 characters",
        });
      }

      review.comment = normalizedComment;
    }

    await review.save();

    /*
    |--------------------------------------------------------------------------
    | Recalculate Rating
    |--------------------------------------------------------------------------
    */

    await recalculateHallRating(
      review.hall
    );

    /*
    |--------------------------------------------------------------------------
    | Populate Updated Review
    |--------------------------------------------------------------------------
    */

    const updatedReview =
      await Review.findById(review._id)
        .populate({
          path: "customer",
          select: "name",
        })
        .populate({
          path: "hall",
          select: "name city",
        });

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error(
      "Update Review Error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(
          error.errors
        ).map((item) => item.message),
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
| Delete Review
|--------------------------------------------------------------------------
| DELETE /api/v1/reviews/:id
|--------------------------------------------------------------------------
*/

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const hallId = review.hall;

    await Review.deleteOne({
      _id: review._id,
    });

    await recalculateHallRating(
      hallId
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Review Error:",
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
| Admin - Get All Reviews
|--------------------------------------------------------------------------
| GET /api/v1/reviews/admin
|--------------------------------------------------------------------------
*/

const getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      rating,
      isVisible,
      hallId,
    } = req.query;

    const pagination = parsePagination(
      page,
      limit
    );

    const filter = {};

    /*
    |--------------------------------------------------------------------------
    | Rating Filter
    |--------------------------------------------------------------------------
    */

    if (rating !== undefined) {
      const parsedRating =
        validateRating(rating);

      if (!parsedRating) {
        return res.status(400).json({
          success: false,
          message: "Invalid rating filter",
        });
      }

      filter.rating = parsedRating;
    }

    /*
    |--------------------------------------------------------------------------
    | Visibility Filter
    |--------------------------------------------------------------------------
    */

    if (isVisible !== undefined) {
      if (
        isVisible !== "true" &&
        isVisible !== "false"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isVisible must be true or false",
        });
      }

      filter.isVisible =
        isVisible === "true";
    }

    /*
    |--------------------------------------------------------------------------
    | Hall Filter
    |--------------------------------------------------------------------------
    */

    if (hallId !== undefined) {
      if (!isValidObjectId(hallId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hall ID",
        });
      }

      filter.hall = hallId;
    }

    const total =
      await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate({
        path: "customer",
        select: "name email phone",
      })
      .populate({
        path: "hall",
        select:
          "name city area status isAvailable isDeleted",
      })
      .populate({
        path: "booking",
        select:
          "eventDate guests totalAmount status paymentStatus",
      })
      .sort({
        createdAt: -1,
      })
      .skip(
        (pagination.page - 1) *
          pagination.limit
      )
      .limit(pagination.limit)
      .lean();

    return res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(
          total / pagination.limit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get All Reviews Error:",
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
| Admin - Toggle Review Visibility
|--------------------------------------------------------------------------
| PATCH /api/v1/reviews/admin/:id/visibility
|--------------------------------------------------------------------------
*/

const toggleReviewVisibility = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review =
      await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.isVisible =
      !review.isVisible;

    await review.save();

    /*
    |--------------------------------------------------------------------------
    | Recalculate Hall Rating
    |--------------------------------------------------------------------------
    */

    await recalculateHallRating(
      review.hall
    );

    return res.status(200).json({
      success: true,
      message: review.isVisible
        ? "Review is now visible"
        : "Review is now hidden",
      review: {
        _id: review._id,
        hall: review.hall,
        rating: review.rating,
        isVisible: review.isVisible,
      },
    });
  } catch (error) {
    console.error(
      "Toggle Review Visibility Error:",
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
| Admin - Delete Review
|--------------------------------------------------------------------------
| DELETE /api/v1/reviews/admin/:id
|--------------------------------------------------------------------------
*/

const adminDeleteReview = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review =
      await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const hallId = review.hall;

    await Review.deleteOne({
      _id: review._id,
    });

    await recalculateHallRating(
      hallId
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error(
      "Admin Delete Review Error:",
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
| Hall Owner - Get My Reviews
|--------------------------------------------------------------------------
| GET /api/v1/reviews/owner
|--------------------------------------------------------------------------
*/

const getOwnerReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      rating,
      hallId,
    } = req.query;

    const pagination = parsePagination(
      page,
      limit
    );

    /*
    |--------------------------------------------------------------------------
    | Get Owner Halls
    |--------------------------------------------------------------------------
    */

    const ownerHalls = await Hall.find({
      owner: req.user._id,
      isDeleted: false,
    }).select("_id name city area rating");

    if (!ownerHalls.length) {
      return res.status(200).json({
        success: true,
        reviews: [],
        halls: [],
        stats: {
          total: 0,
          visible: 0,
          hidden: 0,
          averageRating: 0,
        },
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          pages: 0,
        },
      });
    }

    const ownerHallIds = ownerHalls.map(
      (hall) => hall._id
    );

    /*
    |--------------------------------------------------------------------------
    | Hall Filter
    |--------------------------------------------------------------------------
    */

    let hallFilter = ownerHallIds;

    if (hallId !== undefined) {
      if (!isValidObjectId(hallId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid hall ID",
        });
      }

      const ownsHall = ownerHallIds.some(
        (ownerHallId) =>
          ownerHallId.toString() === hallId.toString()
      );

      if (!ownsHall) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this hall",
        });
      }

      hallFilter = [hallId];
    }

    /*
    |--------------------------------------------------------------------------
    | Base Filter
    |--------------------------------------------------------------------------
    */

    const filter = {
      hall: {
        $in: hallFilter,
      },
    };

    /*
    |--------------------------------------------------------------------------
    | Rating Filter
    |--------------------------------------------------------------------------
    */

    if (rating !== undefined) {
      const parsedRating =
        validateRating(rating);

      if (!parsedRating) {
        return res.status(400).json({
          success: false,
          message: "Invalid rating filter",
        });
      }

      filter.rating = parsedRating;
    }

    /*
    |--------------------------------------------------------------------------
    | Stats
    |--------------------------------------------------------------------------
    */

    const statsResult =
      await Review.aggregate([
        {
          $match: {
            hall: {
              $in: hallFilter.map(
                (id) =>
                  new mongoose.Types.ObjectId(id)
              ),
            },
          },
        },
        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            visible: {
              $sum: {
                $cond: [
                  "$isVisible",
                  1,
                  0,
                ],
              },
            },

            hidden: {
              $sum: {
                $cond: [
                  "$isVisible",
                  0,
                  1,
                ],
              },
            },

            averageRating: {
              $avg: "$rating",
            },
          },
        },
      ]);

    const stats = statsResult[0] || {
      total: 0,
      visible: 0,
      hidden: 0,
      averageRating: 0,
    };

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    */

    const total =
      await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate({
        path: "customer",
        select: "name email phone",
      })
      .populate({
        path: "hall",
        select:
          "name city area coverImage rating",
      })
      .populate({
        path: "booking",
        select:
          "eventDate guests totalAmount status paymentStatus",
      })
      .sort({
        createdAt: -1,
      })
      .skip(
        (pagination.page - 1) *
          pagination.limit
      )
      .limit(pagination.limit)
      .lean();

    return res.status(200).json({
      success: true,

      reviews,

      halls: ownerHalls,

      stats: {
        total: stats.total || 0,
        visible: stats.visible || 0,
        hidden: stats.hidden || 0,
        averageRating: Number(
          Number(
            stats.averageRating || 0
          ).toFixed(1)
        ),
      },

      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(
          total / pagination.limit
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get Owner Reviews Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createReview,
  getHallReviews,
  getMyReviews,
  updateReview,
  deleteReview,

  // Admin
  getAllReviews,
  toggleReviewVisibility,
  adminDeleteReview,
  // Hall Owner
  getOwnerReviews,
};

