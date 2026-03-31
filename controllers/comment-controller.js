
const Comment = require('../models/comment-model');
const Recipe = require('../models/recipe-model');


exports.createComments = async (req, res) => {
    if (!req.session.user) {
            return res.redirect('/login');
        }

    const recipeId = String(req.params.id);

    try {
         // Make sure only logged-in users can post comments
        // If not logged in, redirect them to the login page
        
        // Get recipe ID from the route parameter
        // Example route: POST /recipe/:id/comment

        const comment = (req.body.comment ?? "").trim();
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

        return res.redirect(`/recipe/${recipeId}?status=success`);

    } catch (error) {
        console.error(error);
        return res.redirect(`/recipe/${req.params.id}?status=error`);
    }
};

exports.renderEditForm = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const commentId = String(req.params.commentId);
        const recipeId = String(req.params.recipeId);
        const comment = await Comment.findOne({_id: commentId});
        const recipe = await Recipe.findOne({_id: recipeId});

        if (!comment || !recipe ) {
            return res.redirect(`/recipe/${recipeId}`);
        }

        return res.render('edit-comment', { comment, recipe });
    }
    catch (err) {
        console.error(err);
        return res.redirect(`/recipe/${req.params.id}`);
    }
};

exports.editComment = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const recipeId = String(req.params.id);
    
    try {
        const commentId = String(req.params.commentId);
        const commentText = (req.body.comment ?? "").trim();

            const updateData = {
            $set: {
                comment: commentText,
                createdAt: new Date(), 
                isEdited: true
            }
        };
        
        await Comment.editComment(commentId, comment);
        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error(err);
        return res.redirect(`/recipe/${recipeId}`);
    }
};

exports.deleteComment = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const recipeId = String(req.params.id);

    try {
        await Comment.deleteComment(req.params.commentId);
        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error(err);
        return res.redirect(`/recipe/${recipeId}`);
    }
};