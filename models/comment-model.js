const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    recipeId: {
        type: String,
        required: true
    },
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
});

const Comment = mongoose.model('Comment', commentSchema, 'comments');

exports.retrieveAll = function() {
    return Comment.find();
};

exports.createComments = function(commentData) {
    return Comment.create(commentData);
};

exports.retrieveByRecipeId = function(recipeId) {
    return Comment.find({ recipeId: recipeId });
};

exports.editComment = function(id, updateData) {
    return Comment.updateOne({ _id: id }, updateData);
};

exports.deleteComment = function(id) {
    return Comment.deleteOne({ _id: id });
};

exports.findLatest = function() {
    return Comment.findOne().sort({ createdAt: -1 });
}