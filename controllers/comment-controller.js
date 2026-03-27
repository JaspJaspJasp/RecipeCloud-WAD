
const Comment = require('../models/comment-model');
const Recipe = require('../models/recipe-model');


exports.createComments = async (req, res) => {
    try {
         // Make sure only logged-in users can post comments
        // If not logged in, redirect them to the login page
        if (!req.session.user) {
            return res.redirect('/login');
        }
        // Get recipe ID from the route parameter
        // Example route: POST /recipe/:id/comment

        const recipeId = req.params.id;
        const comment = req.body.comment.trim();
        const userId = String(req.session.user.id);
        const username = req.session.user.userName;

        if (!comment) {
            return res.redirect(`/recipe/${recipeId}?status=error`);
        }
        
        const newCommentData = {
        recipeId: recipeId,
        userId: userId,
        username: username,
        comment: comment
        };

        await Comment.createComments(newCommentData);

        res.redirect(`/recipe/${recipeId}?status=success`);

    } catch (error) {
        console.error(error);
        res.redirect(`/recipe/${req.params.id}?status=error`);
    }
};

exports.renderEditForm = async (req, res) => {
    try {
        const commentId = req.param.commentId;
        const recipeId = req.param.recipeId;
        const comment = await Comment.findOne({_id: commentId});
        const recipe = await Recipe.findOne({_id: recipeId});
        res.render('edit-comment', { comment, recipe });
    }
    catch (err) {
        console.error(err);
        res.redirect(`/recipe/${req.params.id}`);
    }
};

exports.editComment = async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const comment = req.body.comment.trim();
        await Comment.editComment(commentId, comment);
        res.redirect(`/recipe/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/recipe/${req.params.id}`);
    }
};

exports.deleteComment = async (req, res) => {
    try {
        await Comment.deleteComment(req.params.commentId);
        res.redirect(`/recipe/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/recipe/${req.params.id}`);
    }
};