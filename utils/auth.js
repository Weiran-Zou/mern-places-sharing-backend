const jwt = require('jsonwebtoken');

// attempt to get the userId from token
const getCurrentUserId = (req) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
       
        if (token) {
            const decodeToken = jwt.verify(token, 'supersecret_dont_share');
            return decodeToken.userId
        } else {
            return null
        }
    } catch (err) {
        return null
    }
}

module.exports = getCurrentUserId;
