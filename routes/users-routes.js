const express = require("express");
const router = express.Router();
const usersControllers = require("../controllers/users-controllers");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload")
const CloudinaryUpload = require("../middleware/cloudiary-upload");

router.get('/', usersControllers.getUsers);

router.post('/signup', 
    fileUpload.single('image'),
    CloudinaryUpload,
    [
        check('name')
            .not()
            .isEmpty(),
        check('email')
            .normalizeEmail()
            .isEmail(),
        check('password').isLength({ min: 6 })
        
    ],
    usersControllers.signup);

router.post('/login', usersControllers.login);

module.exports = router;