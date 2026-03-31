const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    tag: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now 
    },

    replies: [{
        username: { 
            type: String, 
            required: true 
        },
        content: { 
            type: String, 
            required: true 
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        }
    }]
});

const Forum = mongoose.model('Forum', forumSchema, 'forum');

exports.findAllPosts = function() {
    return Forum.find().sort({ createdAt: -1 }); 
}

exports.findPostById = function(id) {
    return Forum.findOne({ _id: id });
}

exports.createPost = function(dataObject) {
    return Forum.create(dataObject);
}

exports.updatePostById = function(id, updatedData) {
    return Forum.updateOne({ _id: id }, updatedData);
}

exports.deletePostById = function(id) {
    return Forum.deleteOne({ _id: id });
}


