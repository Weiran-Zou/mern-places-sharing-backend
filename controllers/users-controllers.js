const { v4: uuidv4 } = require('uuid');
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator')
const User = require('../models/user');
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getUser = async (req, res, next) => {
    let userId = req.params.uid;
    let user;
    try {
        user = await User.findById(userId, 'image name').exec();
    } catch(err) {
        const error = new HttpError("Could not get users, please try agian later.", 500);
        return next(error);
    }

    res.json({user: user.toObject( {getters: true} )});
}


const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new HttpError("Invalid input passed, please check your input data.", 422);
        return next(error); 
    }
    const {name, email, password} = req.body;
    
    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
    } catch(err) {
        const error = new HttpError("Sign up fail, please try agian later.", 500);
        return next(error);
    }
    if (existingUser) {
        const error = new HttpError("user already exists, please try agian.", 422);
        return next(error);
    }
    
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch(err) {
        const error = new HttpError("Sign up fail, please try agian later.", 500);
        return next(error);
    }
   

    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        image: req.imageUrl,
        places: []
    })
    try {
        await createdUser.save();
    } catch(err) {
        const error = new HttpError("Sign up fail, please try agian later.", 500);
        return next(error);
    }
    
    let token;
    try {
        token = jwt.sign(
            {userId: createdUser.id, email: createdUser.email}, 
            process.env.JWT_KEY, 
            {expiresIn: '1h'}
        );
    } catch(err) {
        const error = new HttpError("Sign up fail, please try agian later.", 500);
        return next(error);
    }
    

    res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token});
}

const login = async (req, res, next) => {
    const { email, password} = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
        console.log(existingUser)
    } catch(err) {
        const error = new HttpError("Log in fail, please try agian later.", 500);
        return next(error);
    }
    
    if (!existingUser) {
        const error = new HttpError("User doesn't exist, could not log in.", 403);
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError("Log in fail, please try agian later.", 500);
        return next(error);
    }
    
    if (!isValidPassword) {
        const error = new HttpError("Invalid credentials, could not log in.", 403);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            {userId: existingUser.id, email: existingUser.email}, 
            process.env.JWT_KEY, 
            {expiresIn: '1h'}
        );
    } catch(err) {
        const error = new HttpError("Log in fail, please try agian later.", 500);
        return next(error);
    }
    console.log( existingUser.id)
    res.json({userId: existingUser.id, email: existingUser.email, userImage: existingUser.image, token: token});
}

// exports.getUsers = getUsers;
exports.getUser = getUser;
exports.signup = signup;
exports.login = login;