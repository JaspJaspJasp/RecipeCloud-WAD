const mongoose = require('mongoose');
const Recipe = require('./recipe-model');

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
            type:String,
            required: true
        },
// one document per user, many recipe inside the array savedRecipes, each recipe has its own recipeId and dateSaved
        dateSaved: {
            type: Date,
            default: Date.now
        }
    }],
    tags: [String],

    notes: {
        type: String,
        default: ""
    },

    ingredients: {
        type: Array, 
        default: []
    }
});

favouriteSchema.index({ userId:1, 'savedRecipes.recipeId':1}, {unique: true});

const Favourite = mongoose.model('Favourite', favouriteSchema, 'favourites');

exports.findFavouriteByUserId = function(userId){
    return Favourite.findOne({userId: userId});
}

exports.createFavourite = function(favData) {
    return Favourite.create(favData);
};

exports.addRecipeToList = function(userId, recipeId) {
    return Favourite.updateOne(
        { userId: userId },
        { $push: {savedRecipes: {recipeId: recipeId}} }
    );
};

exports.deleteRecipeFromList = function(userId, recipeId) {
    return Favourite.updateOne(
        { userId: userId },
        { $pull: { savedRecipes: { recipeId: recipeId } } }
    );
};

exports.updateFavourite = function(userId, updateData) {
    return Favourite.findOneAndUpdate(
        { userId: userId },
        { $set: {
            notes: updateData.notes || "",
            tags: updateData.tags ? updateData.tags.split(',').map(tag => tag.trim()) : [],
            ingredients: updateData.ingredients ? updateData.ingredients.split(',').map(ingredient => ingredient.trim()) : []
        }},
        { new: true }
    );
};
