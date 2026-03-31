const ForumModel = require("../models/forum-model");


//Loading forum page
exports.showForum = async (req, res) => {
    try {
        const discussions = await ForumModel.findAllPosts();
        return res.render('forum', { 
            discussions: discussions,
            user: req.session.user || null 
        });
    } catch (err) {
        console.error(err);
        return res.render('error', { 
            message: "We couldn't load the community forum. Please try again later."
        });
    }
};


//Posting a new forum
exports.postForum = async (req, res) => {

    if (!req.session.user) {
        req.session.returnTo = "/forum"; 
        return res.redirect("/login");
    }

    const title = (req.body.title ?? "").trim();
    const tag = (req.body.tag ?? "").trim();
    const content = (req.body.content ?? "").trim();

    const username = req.session.user.display_name; 
    let errors = [];

    if (!title) {errors.push("Title is required.")};
    if (!tag) {errors.push("Category tag is required.")};
    if (!content) {errors.push("Details/Content are required.")};

    if (errors.length === 0) {

        const postData = { 
            title,
            tag,
            content,
            username 
        };

        try {
            await ForumModel.createPost(postData);
            return res.redirect("/forum");
        } catch (err) {
            console.error(err);
            errors.push("An error occurred while saving your post.");
            return res.render('error', { message: errors })
        }
    }

    //Will occur when error
    try {
        const discussions = await ForumModel.findAllPosts();
        return res.render("forum", { 
            discussions: discussions,
            user: req.session.user,
            errors: errors 
        });
    } catch (err) {
        return res.render('error', { message: "An unexpected error occurred." });
    }
};

exports.getEditForum = async (req, res) => {
    try {
        if (!req.session.user) {
            req.session.returnTo = `/forum/${req.params.id}/edit`;
            return res.redirect("/login");
        }

        const post = await ForumModel.findPostById(req.params.id);

        if (!post) {
            return res.render('error', { message: "This post does not exist or has been removed." });
        }

        if (post.username !== req.session.user.display_name) {
            return res.render('error', { message: "You are not authorized to edit this post." });
        }

        return res.render('edit-forum', { 
            post: post, 
            user: req.session.user,
            errors: [] 
        });

    } catch (err) {
        console.error(err);
        return res.render('error', { message: "Something went wrong loading the edit page." });
    }
};

exports.updateForum = async (req, res) => {
    try {
        if (!req.session.user) {
            req.session.returnTo = "/forum";
            return res.redirect("/login");
        }

        const postId = req.params.id;
        let title = (req.body.title ?? "").trim();
        let tag = (req.body.tag ?? "").trim();
        let content = (req.body.content ?? "").trim();

        let errors = [];
        if (!title) errors.push("Title is required.");
        if (!tag) errors.push("Category tag is required.");
        if (!content) errors.push("Details are required.");

        const existingPost = await ForumModel.findPostById(postId);
        
        if (!existingPost) {
            return res.render('error', { message: "Post not found." });
        }

        if (existingPost.username !== req.session.user.display_name) {
            return res.render('error', { message: "Unauthorized action." });
        }

        if (errors.length === 0) {
            const updatedData = { title, tag, content };
            // Awaiting the update
            await ForumModel.updatePostById(postId, updatedData);
            return res.redirect("/forum");
        }

        return res.render('edit-forum', {
            post: { _id: postId, title, tag, content },
            user: req.session.user,
            errors: errors
        });

    } catch (err) {
        console.error(err);
        return res.render('error', { message: "Failed to update the post." });
    }
};

exports.deleteForum = async (req, res) => {
    try {
        if (!req.session.user) {
            req.session.returnTo = "/forum";
            return res.redirect("/login");
        }

        const postId = req.params.id;
        const post = await ForumModel.findPostById(postId);

        if (!post) {
            return res.render('error', { message: "Post not found." });
        }

        if (post.username !== req.session.user.display_name) {
            return res.render('error', { message: "You are not authorized to delete this post." });
        }

        await ForumModel.deletePostById(postId);
        return res.redirect("/forum");

    } catch (err) {
        console.error(err);
        return res.render('error', { message: "Failed to delete the post." });
    }
};

exports.postReply = async (req, res) => {
    if (!req.session.user) {
        req.session.returnTo = "/forum";
        return res.redirect("/login");
    }

    const postId = req.params.id;
    const content = (req.body.reply_content ?? "").trim();

    if (content) {
        try {

            const post = await ForumModel.findPostById(postId);
            
            if (post) {

                if (!Array.isArray(post.replies)) {
                    post.replies = [];
                }

                post.replies.push({
                    username: req.session.user.display_name,
                    content: content
                });
                
                await post.save(); 
            }
        } catch (err) {
            console.error("Error saving reply:", err);
        }
    }
    
    return res.redirect("/forum");
};

