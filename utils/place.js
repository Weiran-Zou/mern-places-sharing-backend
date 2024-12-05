const mongoose = require("mongoose");
const Place = require('../models/place')

// get places with likes using aggregation to indicate weather the current user liked each place
const getPlacesWithLikes = async (currentUser, match = {}) => {
    let places = await Place.aggregate([
        // filter places
        {
            $match: {
                $or: [match || {}]
            }
        },
        // left join places with likes collection and filter by place id and current user
        {
            $lookup: {
                from: "likes", 
                let: { placeId: "$_id" }, 
                pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                            { $eq: ["$place", "$$placeId"] },
                            { $eq: ["$user", new mongoose.Types.ObjectId(currentUser)] }, // check if the place is liked by current user
                            ],
                        },
                    },
                },
                ],
                as: "likes", 
            }
        },
        // Add isLiked boolean field based on if this place is liked by the current user
        {
          $addFields: {
            isLiked: { $gt: [{ $size: "$likes" }, 0] },
          }
        },
        // Remove likes array
        {
          $project: {
            likes: 0,
          }
        },
        {
            $sort: { createdAt: -1 },
        }
      ])
    places = await Place.populate(places, {path: 'creator', select: ['name', 'image']})
    return places;
}

module.exports = getPlacesWithLikes;