const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    recipeId: {
        type: String,
        required: true,
        unique: true
    },
    recipeComments: [{
        userId: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        isEdited: {
            type: Boolean,
            default: false
        }
    }]
});


const Comment = mongoose.model('Comment', commentSchema, 'comments');


exports.createCommentDoc = function(recipeId, newComment) {
    return Comment.create({ 
        recipeId: recipeId, 
        recipeComments: [newComment] 
    });
};

exports.retrieveByRecipeId = function(recipeId) {
    return Comment.findOne({ recipeId: recipeId });
};

exports.retrieveSpecificComment = async function(recipeId, commentId) {
    const doc = await Comment.findOne({ recipeId: recipeId });
    if (!doc) return null;

    // Standard JavaScript .find() safely compares two strings
    return doc.recipeComments.find(c => String(c._id) === String(commentId));
};

exports.updateCommentArray = function(recipeId, updatedArray) {
    return Comment.updateOne(
        { recipeId: recipeId },
        { recipeComments: updatedArray }
    );
};

exports.deleteComment = function(recipeId, commentId, userId) {
    const targetId = new mongoose.Types.ObjectId(commentId);

    return Comment.updateOne(
        { recipeId: recipeId },
        { 
            $pull: { 
                recipeComments: { _id: targetId, userId: userId }
            } 
        }
    );
};

exports.findLatest = async function() {
    const result = await Comment.aggregate([
        { $unwind: "$recipeComments" }, // Spreads out all comments into a flat list
        { $sort: { "recipeComments.createdAt": -1 } }, // Sorts by newest
        { $limit: 1 } // Grabs the top result
    ]);
    return result[0] ? result[0].recipeComments : null; // Return the object or null if database is empty
};