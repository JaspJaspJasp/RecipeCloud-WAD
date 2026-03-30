const mongoose = require('mongoose');
const Recipe = require('./recipe-model');

const favouriteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unqiue: true
    },
    userName: {
        type: String,
        required: true
    },
    savedRecipes:[{

        recipeId: {
            type:String,
            required: true
        },

        dateSaved: {
            type: Date,
            default: Date.now
        }
    }]
});

favouriteSchema.index({ user:1, recipe:1}, {unique: true});

module.exports = mongoose.model('Favourite', favouriteSchema, 'favourites');
const Favourite = mongoose.model('Favourite', favouriteSchema);

exports.createFavourite = function(favData) {
    return Favourite.create(favData);
};

exports.findFavouritesByUser = function(userID) {
    return Favourite.find({userID: userID});
};

exports.addRecipeToList = function(userId, recipeId) {
    return Favourite.updateOne({
        userId: userId,
        $push: {savedRecipes: {recipeId: recipeId}}
    });
};

exports.deleteRecipeFromList = function(userId, recipeId) {
    return Favourite.updateOne(
        { userId: userId },
        { $pull: { savedRecipes: { recipeId: recipeId } } }
    );
};

exports.findOneFavourite = function(query) {
    return Favourite.findOne(query);
};
