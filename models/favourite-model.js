const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true
    },
    savedRecipes:[{
        recipeId: {
            type: String,
            required: true
        },
        dateSaved: {
            type: Date,
            default: Date.now
        }
    }]
});

const Favourite = mongoose.model('Favourite', favouriteSchema);

exports.createFavourite = function(favData) {
    return Favourite.create(favData);
};

exports.findFavouriteByUserId = function(userId) {
    return Favourite.findOne({userId: userId});
};

exports.addRecipeToList = function(userId, recipeId) {
    return Favourite.updateOne(
        { userId: userId },
        { $push: { savedRecipes: { recipeId: recipeId, dateSaved: new Date() } } }
    );
};

exports.deleteRecipeFromList = function(userId, recipeId) {
    return Favourite.updateOne(
        { userId: userId },
        { $pull: { savedRecipes: { recipeId: recipeId } } }
    );
};

exports.updateFavourite = function(userId, updateData) {
    return Favourite.updateOne({ userId: userId }, updateData);
};