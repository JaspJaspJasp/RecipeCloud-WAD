const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    recipe_name: String,
    cuisine: String,
    tag: [String],
    serving: Number,
    approx_cooking_time: String,
    difficulty_level: String,
    instructions: String,
    ingredients: [{
        name: String,
        amount: String
    }],
    rating: {
        type: Number,
        default : 0
    },
    rating_count: {
        type: Number,
        default: 0
    },
    total_rating_score: {
        type: Number,
        default: 0
    },
    ratings: [
        {
            userId: String, 
            value: Number
        }
    ],
    image: {
        type: String,
        default: '' 
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    }
});

const Recipe = mongoose.model('Recipe', recipeSchema, 'recipes');

exports.retrieveAllData = function() {
    return Recipe.find();
};

exports.findQuery = function(query) {
    return Recipe.findOne(query);
};

exports.searchRecipes = function(query) {
    return Recipe.find(query);
};

exports.createRecipe = function(recipeData) {
    return Recipe.create(recipeData); 
};

exports.findRecipeById = function(id) {
    return Recipe.findOne({ _id: id }); 
};

exports.updateRecipe = function(id, updateData) {
    return Recipe.updateOne({ _id: id }, updateData);
};

exports.deleteRecipe = function(id) {
    return Recipe.deleteOne({ _id: id });
};