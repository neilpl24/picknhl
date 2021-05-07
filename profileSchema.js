const mongoose = require('mongoose');
const profileSchema = new mongoose.Schema({
    username: {type: String, require: true, unique: true},
    password: {type: String},
    wins: {type: Number, default: 0},
    losses: {type: Number, default: 0},
    picks: {type: [], default: []},
    loggedIn: {type: Boolean, default: false}
});

const model = mongoose.model('ProfileModels', profileSchema);

module.exports = model;