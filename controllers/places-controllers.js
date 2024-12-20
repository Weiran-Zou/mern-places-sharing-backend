const HttpError = require("../models/http-error");
const mongoose = require("mongoose");
const { validationResult } = require('express-validator');
const getCoordsForAddress = require("../utils/location");
const Place = require("../models/place");
const User = require("../models/user");
const Like = require("../models/like");
const getCurrentUserId = require("../utils/auth");
const getPlacesWithLikes = require("../utils/place");


const getPlaces = async (req, res, next) => {
    const currentUserId = getCurrentUserId(req);
    console.log("currentUserId: " + currentUserId)
    let places;

    // logged-in user
    if (currentUserId) {
        places = await getPlacesWithLikes(currentUser = currentUserId);
        res.json({places: places});
    } else {
        try {
            places = await Place.find({}).sort({createdAt: -1}).populate('creator', 'name image');
            res.json({places: places.map((p) => p.toObject({getters: true}))});
        } catch(err) {
            const error = new HttpError("Could not get users, please try agian later.", 500);
            return next(error);
        }
    }
}

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator', 'name image').exec();
    } catch(err) {
        const error = new HttpError("Something went wrong, could not find a place", 500)
        return next(error);
    } 
    
    if (!place) {
        const error = new HttpError("Could not find a place for the provided id.", 404);
        return next(error);
    }

    res.json({place: place.toObject( {getters: true} )});
}

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let places;
    const currentUserId = getCurrentUserId(req);
    // get places indicating if the current user has liked them
    if (currentUserId) {
        places = await getPlacesWithLikes(currentUserId, {creator: new mongoose.Types.ObjectId(userId)})
        res.json({places: places});
    } else {
        try {
            // userWithPlaces = await User.findById(userId).popluate('places');
            places = await Place.find({creator: userId}).sort({createdAt: -1}).populate('creator', 'name image');       
        } catch(err) {
            const error = new HttpError("Something went wrong, could not find places", 500)
            return next(error);
        }
       
    
        if (!places || places.length === 0) {
            return next(
                new HttpError("Could not find a place for the provided user id.", 404)
            );
        }
        res.json({places: places.map((p) => p.toObject({getters: true}))});
    }
    
    
}

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new HttpError("Invalid input passed, please check your input data.", 422);
        return next(error);
    }
    
    const { title, description, address } = req.body;
    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        console.log(error);
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        location: coordinates,
        address,
        image: req.imageUrl,
        creator: req.userData.userId
    });

    let user;
    console.log("createdPlace: ");
    console.log(createPlace);

    try {
        user = await User.findById(req.userData.userId);
        
    } catch(err) {
        const error = new HttpError("Creating place failed, please try again.", 500);
        return next(error);
    }
    console.log("user : ");
    console.log(user);
    if (!user) {
        const error = new HttpError("Could not find the user by id.", 500);
        return next(error);
    }
    const session = await mongoose.startSession();
    try {
        // all the operations of the transaction succeed within the session, docs will be updated
        await session.withTransaction(async () => {
            await createdPlace.save( {session} );
            user.places.push(createdPlace);
            await user.save( {session} );
        });
        console.log("transaction succeed ");
        res.status(201).json({place: createdPlace});
    } catch(err) {
        const error = new HttpError("Creating place failed, please try again.", 500);
        return next(error);
    } finally {
        session.endSession();
    }
    
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new HttpError("Invalid input passed, please check your input data.", 422);
        return next(error);
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId);
    } catch(err) {
        const error = new HttpError("Something went wrong, could not update a place", 500)
        return next(error);
    } 

    if (place.creator.toString() !== req.userData.userId) {
        const error = new HttpError("You are not allowed to update this place", 401)
        return next(error);
    }
    place.title = title;
    place.description = description;
    
    try {
        await place.save();
    } catch (err) {
        const error = new HttpError("Something went wrong, could not update a place", 500)
        return next(error);
    }

    res.status(200).json({place: place.toObject({getters: true})});
}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch(err) {
        const error = new HttpError("Something went wrong, could not delete a place", 500)
        return next(error);
    }
    if (!place) {
        const error = new HttpError("Could not find place by this id", 404)
        return next(error);
    }

    if (place.creator.id !== req.userData.userId) {
        const error = new HttpError("You are not allowed to delete this place", 403)
        return next(error);
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await place.deleteOne( {session} );
            place.creator.places.pull(place);
            await place.creator.save( {session} );
            await session.commitTransaction();
        });
        res.status(200).json({message: "Deleted place!"});
    } catch(err) {
        const error = new HttpError("Something went wrong, could not delete a place", 500)
        return next(error);
    } finally {
        session.endSession();
    }
    
    
}

const likePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId);
    } catch(err) {
        const error = new HttpError("Something went wrong, could not like a place", 500)
        return next(error);
    } 
    try {
        // find out if the place is already liked by the user
        like = await Like.findOne( {place: placeId, user: req.userData.userId} )
    } catch(err) {
        
        const error = new HttpError("Something went wrong, could not like a place", 500)
        return next(error);
    }
    const session = await mongoose.startSession();
    try {
        if (!like) {
            await session.withTransaction(async () => {
                place.likeCount++;
                let newLike = new Like({
                    place: placeId,
                    user: req.userData.userId
                })
                await newLike.save( {session} );
                await place.save( {session} );
                await session.commitTransaction();
            });
            res.status(200).json({message: "Liked place!"});
        } else {
            await session.withTransaction(async () => {
                place.likeCount--;
                await place.save( {session} );
                await like.deleteOne( {session} );
                await session.commitTransaction();
            });
            res.status(200).json({message: "Unliked place!"});
        }
     
    } catch(err) {
        const error = new HttpError("Something went wrong, could not like a place", 500)
        return next(error);
    } finally {
        session.endSession();
    }
}

const getPlacesLikedByUser = async (req, res, next) => {
    const uid = req.params.uid;
    let places = await Like.find({user: uid}).populate('place');
    places = places.map(p => p.place);
    places = await Place.populate(places, ['creator', 'name image']);
    places = places.map(p => p.toObject({getters: true}))
    res.status(200).json({places});
}

exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
exports.likePlace = likePlace;
exports.getPlacesLikedByUser = getPlacesLikedByUser;