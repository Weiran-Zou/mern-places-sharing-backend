const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const likeSchema = new Schema({
    place: { type: mongoose.Types.ObjectId, required: true, ref: 'Place' },
    user: {type: mongoose.Types.ObjectId, required: true, ref: 'User' }
})

module.exports = mongoose.model('Like', likeSchema);