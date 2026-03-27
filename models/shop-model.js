const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    userid:{
        type:String,
        required: true
    },
    userName:{
        type:String,
        required: true
    },

    personalitems:[{
        name:String,
        amount:String
    }],

    recipes:[{

        recipeId: {
            type:String,
            required: true
        },

        recipeName:{
            type:String,
            required:true
        },

        ingredients: [{
            name: { type: String, required: true },
            amount: { type: String },
            isBought: { type: Boolean, default: false }
        }],
    }],

    updatedAt: {
    type: Date,
    default: Date.now
    }
});

const Shop = mongoose.model("Shop", shopSchema, "shopping-list")


// no changes needed here actually — findUserById already returns a Mongoose document
// Shop.findOne() returns a full Mongoose document that supports .save()

exports.retrieveAllitems = function() {
    return Shop.find()
} 
exports.findUserById = function(userid) {
    return Shop.findOne({userid:userid})
}

exports.addItem = function(newItem) {
    return Shop.create(newItem);
}

exports.editItemById = function(userid, updatedList, options = {}) {
    return Shop.updateOne({ userid: userid }, updatedList, options);
}

exports.deleteItemById = function(userid) {
    return Shop.deleteOne({userid:userid});   
}


