
const Comment = require('../models/comment-model');
const Recipe = require('../models/recipe-model');


exports.createComments = async (req, res) => {
    const recipeId = String(req.params.id);
    const sessionUserId = String(req.session.user.id);
    const sessionUserName = req.session.user.userName || req.session.user.username;
    const commentText = (req.body.comment ?? "").trim();

    if (!commentText) return res.redirect(`/recipe/${recipeId}`);

    try {
        const newComment = {
            userId: sessionUserId,
            username: sessionUserName,
            comment: commentText
        };

        const commentDoc = await Comment.retrieveByRecipeId(recipeId);

        if (!commentDoc) {
            await Comment.createCommentDoc(recipeId, newComment);
        } else {
            commentDoc.recipeComments.push(newComment);
            await Comment.updateCommentArray(recipeId, commentDoc.recipeComments);
        }

        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error("Error adding comment:", err);
        return res.render('error', { message: "Could not post your comment." });
    }
};

exports.renderEditForm = async (req, res) => {
    // 1. Add .trim() to ensure no hidden spaces get caught in the URL
    const recipeId = req.params.recipeId.trim();
    const commentId = req.params.commentId.trim(); 
    const sessionUserId = String(req.session.user.id);

    try {
        const commentDoc = await Comment.retrieveByRecipeId(recipeId);
        if (!commentDoc) return res.render('error', { message: "Recipe comments not found." });

        // 2. Use .toString() instead of String(), which is much safer for Mongoose ObjectIds
        const specificComment = commentDoc.recipeComments.find(
            c => c._id && c._id.toString() === commentId
        );
        
        // 3. THE DEBUG BLOCK: If it fails, this prints the exact reason to your terminal!
        if (!specificComment) {
            commentDoc.recipeComments.forEach(c => console.log(" -> ", c._id.toString()));

            return res.render('error', { message: "Comment not found." });
        }

        if (String(specificComment.userId) !== sessionUserId) {
             return res.render('error', { message: "Unauthorized to edit this comment." });
        }

        return res.render('edit-comment', {
            recipeId: recipeId,
            comment: specificComment
        });
    } catch (err) {
        console.error("Error loading edit form:", err);
        return res.render('error', { message: "Failed to load edit form." });
    }
};

exports.editComment = async (req, res) => {
    const recipeId = String(req.params.recipeId);
    const commentId = String(req.params.commentId);
    const updatedText = (req.body.comment ?? "").trim();
    const sessionUserId = String(req.session.user.id);

    if (!updatedText) return res.render('error', { message: "Comment cannot be empty." });

    try {
        const commentDoc = await Comment.retrieveByRecipeId(recipeId);
        if (!commentDoc) return res.render('error', { message: "Recipe comments not found." });

        // Find the index of the comment in the array
        const commentIndex = commentDoc.recipeComments.findIndex(c => String(c._id) === String(commentId));
        
        if (commentIndex === -1) return res.render('error', { message: "Comment not found." });
        if (String(commentDoc.recipeComments[commentIndex].userId) !== sessionUserId) {
            return res.render('error', { message: "Unauthorized to edit this comment." });
        }

        commentDoc.recipeComments[commentIndex].comment = updatedText;
        commentDoc.recipeComments[commentIndex].isEdited = true;

        await Comment.updateCommentArray(recipeId, commentDoc.recipeComments);

        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error("Error updating comment:", err);
        return res.render('error', { message: "Could not update the comment." });
    }
};

exports.deleteComment = async (req, res) => {
    // Assuming your route is /recipe/:recipeId/comment/:commentId/delete
    const recipeId = String(req.params.id);
    const commentId = String(req.params.commentId);
    const sessionUserId = String(req.session.user.id);

    try {
        const commentDoc = await Comment.retrieveByRecipeId(recipeId);
        if (!commentDoc) return res.redirect(`/recipe/${recipeId}`);

        const specificComment = commentDoc.recipeComments.find(c => String(c._id) === String(commentId));
        if (!specificComment || String(specificComment.userId) !== sessionUserId) {
            return res.redirect(`/recipe/${recipeId}`);
        }

        const updatedArray = commentDoc.recipeComments.filter(c => String(c._id) !== String(commentId));
        
        await Comment.updateCommentArray(recipeId, updatedArray);

        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error("Error deleting comment:", err);
        return res.redirect(`/recipe/${recipeId}`);
    }
};