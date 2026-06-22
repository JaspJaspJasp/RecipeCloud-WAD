const ForumModel = require("../models/forum-model");


//Loading forum page
exports.showForum = async (req, res) => {

    const sessionUser = req.session ? req.session.user : null;

    try {
        const discussions = await ForumModel.findAllPosts();

        return res.render('forum', { 
            discussions: discussions,
            user: sessionUser,
            errors: []
        });

    } catch (err) {

        console.error("Error in showForum:", err);
        return res.render('error', { 
            message: "We couldn't load the community forum. Please try again later." 
        });
    }
};


//Posting a new forum
exports.postForum = async (req, res) => {

    const username = req.session.user.display_name;

    const title = (req.body.title ?? "").trim();
    const tag = (req.body.tag ?? "").trim();
    const content = (req.body.content ?? "").trim();

     
    let errors = [];

    if (!title) {errors.push("Title is required.")};
    if (!tag) {errors.push("Category tag is required.")};
    if (!content) {errors.push("Details/Content are required.")};

        
    try {

        if (errors.length > 0) {
            const discussions = await ForumModel.findAllPosts();
            return res.render("forum", { 
                discussions: discussions,
                errors: errors 
            });
        }

        const postData = { 
            title,
            tag,
            content,
            username 
        };

            await ForumModel.createPost(postData);
            return res.redirect("/forum");

    } catch(err) {

        console.error("Error in postForum:", err);
        return res.render('error', { message: "An error occurred while saving your post." });
    
    }
};

exports.getEditForum = async (req, res) => {

    const sessionUserName = req.session.user.display_name;
    const sessionUserRole = req.session.user.role;
    
    const postId = String(req.params.id);

    try {
        const post = await ForumModel.findPostById(postId);

        if (!post) {
            return res.render('error', { message: "This post does not exist or has been removed." });
        }


        if (post.username === sessionUserName || sessionUserRole === "admin") {
        return res.render('edit-forum', { 
            post: post, 
            errors: [] 
            
        }); 
        }

        if (post.username !== sessionUserName ) {
            return res.render('error', { message: "You are not authorized to edit this post." });
        }

    } catch (err) {
        console.error("Error in getEditForum:", err);
        return res.render('error', { message: "Something went wrong loading the edit page." });
    }
};

exports.updateForum = async (req, res) => {

    const sessionUserName = req.session.user.display_name;
    const sessionUserRole = req.session.user.role;


    const postId = String(req.params.id);
    let title = (req.body.title ?? "").trim();
    let tag = (req.body.tag ?? "").trim();
    let content = (req.body.content ?? "").trim();

    try {


        let errors = [];
        if (!title) errors.push("Title is required.");
        if (!tag) errors.push("Category tag is required.");
        if (!content) errors.push("Details are required.");

        const existingPost = await ForumModel.findPostById(postId);
        
        if (!existingPost) {
            return res.render('error', { message: "Post not found." });
        }

        if (existingPost.username !== sessionUserName && sessionUserRole !== "admin") {
            return res.render('error', { message: "Unauthorized action." });
        }

        if (errors.length > 0) {
            return res.render('edit-forum', {
                post: { _id: postId, title: title, tag: tag, content: content },
                errors: errors
            });
        }

        const updatedData = { 
            title: title, 
            tag: tag, 
            content: content 
        };

        await ForumModel.updatePostById(postId, updatedData);
        
        return res.redirect("/forum");

    } catch (err) {
        console.error("Error in updateForum:", err);
        return res.render('error', { message: "Failed to update the post." });
    }
};

exports.deleteForum = async (req, res) => {

    const sessionUserName = req.session.user.display_name
    const sessionUserRole = req.session.user.role;

    const postId = String(req.params.id);

    try {

        const post = await ForumModel.findPostById(postId);

        if (!post) {
            return res.render('error', { message: "Post not found." });
        }

        if (post.username !== sessionUserName && sessionUserRole !== "admin") {
            return res.render('error', { message: "You are not authorized to delete this post." });
        }

        await ForumModel.deletePostById(postId);
        return res.redirect("/forum");

    } catch (err) {
        console.error("Error in deleteForum:", err);
        return res.render('error', { message: "Failed to delete the post." });
    }
};

exports.postReply = async (req, res) => {

    const sessionUserName = req.session.user.display_name;

    const postId = String(req.params.id);
    const content = (req.body.reply_content ?? "").trim();

    if (!content) {
        return res.redirect("/forum");
    }

    try {

        const post = await ForumModel.findPostById(postId);
        
        if (!post) {
            return res.redirect("/forum");
        }

        let updatedReplies = Array.isArray(post.replies) ? post.replies : [];

        updatedReplies.push({
            username: sessionUserName,
            content: content
        });

        const updateData = {
            replies: updatedReplies
        };
            

        await ForumModel.updatePostById(postId, updateData); 

        return res.redirect("/forum");

    
        } catch (err) {
            
            console.error("Error in postReply:", err);
        return res.render('error', { message: "Could not post your reply." });
    }
};


exports.getEditReply = async (req, res) => {

    const sessionUserName = req.session.user.display_name;
    const sessionUserRole = req.session.user.role;

    const postId = String(req.params.id);
    const replyId = String(req.params.replyId);

    try {
        const post = await ForumModel.findPostById(postId);
        if (!post) {
            return res.render('error', { message: "Post not found." });
        }


        const targetReply = post.replies.find(r => String(r._id) === replyId);
        
        if (!targetReply) {
            return res.render('error', { message: "Reply not found." });
        }

        if (targetReply.username !== sessionUserName && sessionUserRole !== "admin") {
            return res.render('error', { message: "You are not authorized to edit this reply." });
        }

        return res.render('edit-reply', { 
            postId: postId,
            reply: targetReply,
            errors: []
        });

    } catch (err) {
        console.error("Error in getEditReply:", err);
        return res.render('error', { message: "Something went wrong loading the edit page." });
    }
};

exports.updateReply = async (req, res) => {
    const sessionUserName = req.session.user.display_name;
    const sessionUserRole = req.session.user.role;

    const postId = String(req.params.id);
    const replyId = String(req.params.replyId); 
    const content = (req.body.reply_content ?? "").trim();

    if (!content) { 
        return res.redirect("/forum"); 
    }

    try {
        const post = await ForumModel.findPostById(postId);
        if (!post) {
            return res.redirect("/forum");
        }

        const targetReply = post.replies.find(r => String(r._id) === replyId);
        
        if (!targetReply) {
            return res.redirect("/forum");
        }

        if (targetReply.username !== sessionUserName && sessionUserRole !== "admin") {
            return res.render('error', { message: "You are not authorized to edit this reply." });
        }

        let updatedReplies = [];
        for (let r of post.replies) {
            if (String(r._id) === replyId) {
                updatedReplies.push({
                    _id: r._id,
                    username: r.username,
                    content: content, 
                    createdAt: r.createdAt
                });
            } else {
                updatedReplies.push(r);
            }
        }

        const updateData = { replies: updatedReplies };
        await ForumModel.updatePostById(postId, updateData);

        return res.redirect("/forum");

    } catch (err) {
        console.error("Error in updateReply:", err);
        return res.render('error', { message: "Could not update your reply." });
    }
};

exports.deleteReply = async (req, res) => {
    const sessionUserName = req.session.user.display_name;
    const sessionUserRole = req.session.user.role;

    const postId = String(req.params.id);
    const replyId = String(req.params.replyId); 

    try {
        const post = await ForumModel.findPostById(postId);
        if (!post) return res.redirect("/forum");

        const targetReply = post.replies.find(r => String(r._id) === replyId);
        
        if (!targetReply) return res.redirect("/forum");

        if (targetReply.username !== sessionUserName && sessionUserRole !== "admin") {
            return res.render('error', { message: "You are not authorized to delete this reply." });
        }

        const filteredReplies = post.replies.filter(r => String(r._id) !== replyId);

        const updateData = { replies: filteredReplies };
        await ForumModel.updatePostById(postId, updateData);

        return res.redirect("/forum");

    } catch (err) {
        console.error("Error in deleteReply:", err);
        return res.render('error', { message: "Could not delete your reply." });
    }
};