const mongoose = require('mongoose');

const ratingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true 
    },

    recipeId: {
        type: String, 
        required: true
    },

    username: {
        type: String, 
        required: true
    },

    ratingValue: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    createdAt: { 
        type: Date, 
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }, 

    isEdited: {
        type: Boolean,
        default: false
    }
});

const Ratings = mongoose.model('Ratings', ratingsSchema, 'ratings');

// Retrieve all ratings for a recipe
exports.retrieveByRecipeId = function(recipeId) {
    return Ratings.find({ recipeId: recipeId });
};

// Find a user's rating for a specific recipe (returns ONE document, not array)
// findOne will give the first matching document return type is just one document { userId: "...", recipeId: "...", rating: 5}
// find() will give an array [{ userId: "...", recipeId: "...", rating: 5}]
exports.findUserRating = function(userId, recipeId) {
    return Ratings.findOne({ 
        userId: userId, 
        recipeId: recipeId 
    });
};

// Create a new rating
exports.createRating = function(ratingData) {
    return Ratings.create(ratingData);
};

// Update an existing rating
exports.updateRating = function(ratingId, updateData) {
    return Ratings.updateOne({ _id: ratingId }, updateData);
};

// Delete a rating
exports.deleteRating = function(ratingId) {
    return Ratings.deleteOne({ _id: ratingId });
};

// Get all ratings (for admin, optional)
exports.retrieveAll = function() {
    return Ratings.find();
};

exports.findLatest = function() {
    return Ratings.findOne().sort({ createdAt: -1 });
}