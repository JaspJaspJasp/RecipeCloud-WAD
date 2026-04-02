const mongoose = require('mongoose');

const ratingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true 
    },
     userName: {
            type: String, 
            required: true
        },

    ratings: [{
        recipeId: {
            type: String, 
            required: true
        },

        ratingValue: {
            type: Number, 
            required: true, 
            min: 1,
            max: 5
        },

        isEdited: {
            type: Boolean,
            default: false
        },

        dateSaved: {
            type: Date, 
            default: Date.now
        },
    }], 
});

const Ratings = mongoose.model('Ratings', ratingsSchema, 'ratings');

// Create a new rating
exports.createRating = function(ratingData) {
    return Ratings.create(ratingData);
};

// Retrieve all ratings for a recipe
exports.retrieveByRecipeId = function(recipeId) {
    return Ratings.find({ "ratings.recipeId": recipeId });
};



// Find a specific rating for a user and recipe
exports.findUserRating = function(userId, recipeId) {
    return Ratings.findOne({ 
        userId: userId, 
        "ratings.recipeId": recipeId 
    });
};

// Find a user's entire ratings document (all ratings for that user)
exports.findUserRatingsDoc = function(userId) {
    return Ratings.findOne({ userId: userId });
};

// Add a new rating to a user's existing ratings array
exports.addRatingToUser = function(userId, recipeId, ratingValue) {
    return Ratings.updateOne(
        { userId: userId },
        { $push: { ratings: { recipeId: recipeId, ratingValue: ratingValue, isEdited: false, dateSaved: new Date() } } }
    );
};

// update a rating in the list of ratings for a user
exports.updateRatingList = function(userId, recipeId, ratingValue) {
    return Ratings.updateOne(
        { userId: userId, "ratings.recipeId": recipeId },
        { $set: { "ratings.$.ratingValue": ratingValue, "ratings.$.isEdited": true, "ratings.$.dateSaved": new Date() } }
    );
};

// Delete a rating
exports.deleteRatingFromList = function (userId, recipeId){
    return Ratings.updateOne(
        { userId: userId, "ratings.recipeId": recipeId },
        { $pull: { ratings: { recipeId: recipeId }}}
    )
};

// Find latest update
exports.findLatest = async function() {
    const result = await Ratings.aggregate([
        { $unwind: "$ratings" }, 
        { $sort: { "ratings.dateSaved": -1 } }, 
        { $limit: 1 } 
    ]);

    if (result.length > 0) {
        const latest = result[0];
        return {
            username: latest.userName,                  
            ratingValue: latest.ratings.ratingValue,   
            createdAt: latest.ratings.dateSaved         
        };
    }
    return null; 
};