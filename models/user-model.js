// user-model.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    display_name: {
        type: String,
        required: [true, 'A user must have a display name'],
    },
    userName: {
        type: String,
        required: [true, 'A user must have a username'],
        unique: true
    },
    gender: {
        type: String,
        required: [true, 'A user must have a gender']
    },
    emailAddress: {
        type: String,
        required: [true, 'A user must have an email address'],
        unique: true
    },
    hashedPassword: {
        type: String,
        required: [true, 'A user must have a password']
    }
});

const User = mongoose.model('User', userSchema, 'users');

exports.findUserByEmail = function(emailAddress) {
    return User.findOne({ emailAddress: emailAddress });
};

exports.findUserByUsername = function(userName) {
    return User.findOne({ userName: userName });
};

exports.findUserById = function(id) {
    return User.findOne({ _id: id });
};

exports.updateUserById = function(id, updateData) {
    return User.updateOne({ _id: id }, updateData);
};

exports.createUser = function(userData) {
    return User.create(userData);
};