const HttpError = require("../models/http-error");
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    try {
        const token = req.headers.authorization.split(' ')[1];
            
        if (!token) {
            throw new Error("Autentication failed!");
        }
        const decodeToken = jwt.verify(token, 'supersecret_dont_share');
        req.userData = {userId: decodeToken.userId};
        next();

    } catch (err) {
        const error = new HttpError("Autentication failed!", 403);
        return next(error);
    }
   

}