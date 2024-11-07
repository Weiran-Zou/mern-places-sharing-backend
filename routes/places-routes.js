const express = require("express");
const router = express.Router();
const placesControllers = require("../controllers/places-controllers");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload")
const checkAuth = require('../middleware/check-auth');
const CloudinaryUpload = require("../middleware/cloudiary-upload");

router.get('/', placesControllers.getPlaces);

router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlacesByUserId);

router.use(checkAuth);

router.post('/', 
    fileUpload.single('image'),
    CloudinaryUpload,
    [
        check('title')
            .not()
            .isEmpty(), 
        check('description').isLength({ min: 5}),
        check('address')
            .not()
            .isEmpty()
    ],
    placesControllers.createPlace
);

router.patch('/:pid', 
    [
        check('title')
            .not()
            .isEmpty(), 
        check('description').isLength({ min: 5})
    ],
    placesControllers.updatePlace);

router.delete('/:pid', placesControllers.deletePlace);

router.patch('/:pid/like', placesControllers.likePlace);

module.exports = router;