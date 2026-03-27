const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    recipeId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    recipeName: {
        type: String,
        required: true
    },
    tags: [String],
    notes: {
        type: String,
        default: ""
    },
    ingredients: {
        type: Array, default: [] 
    }
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

exports.updateFavourite = function(id, updateData) {
    return Favourite.updateOne ({_id:id},updateData);
};

exports.deleteFavourite = function(id) {
    return Favourite.deleteOne({_id:id});
};

exports.findOneFavourite = function(query) {
    return Favourite.findOne(query);
};