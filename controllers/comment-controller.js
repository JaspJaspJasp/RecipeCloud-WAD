
const Comment = require('../models/comment-model');
const Recipe = require('../models/recipe-model');


exports.createComments = async (req, res) => {
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
    try {
        const commentId = String(req.params.commentId);
        const recipeId = String(req.params.recipeId);
        const comment = await Comment.retrieveByCommentId(commentId);
        const recipe = await Recipe.findRecipeById(recipeId);

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
    // Standardizing session and params as per your project rules
    const sessionUserId = String(req.session.user.id);
    const recipeId = String(req.params.id);
    const commentId = String(req.params.commentId);
    const commentText = (req.body.comment ?? "").trim();


    try {
        const updateData = {
            $set: {
                comment: commentText,
                createdAt: new Date(), 
                isEdited: true
            }
        };
        
        await Comment.editComment(commentId, updateData);
        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error("Error in Edit Comment: ", err);
        return res.render('error', { message: "Failed to save comment changes." });
    }
};

exports.deleteComment = async (req, res) => {
    const recipeId = String(req.params.id);

    try {
        await Comment.deleteComment(req.params.commentId);
        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error(err);
        return res.redirect(`/recipe/${recipeId}`);
    }
};