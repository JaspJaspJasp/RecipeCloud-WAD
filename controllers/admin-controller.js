const UserModel = require("../models/user-model");
const RecipeModel = require("../models/recipe-model");
const ForumModel = require("../models/forum-model");
const CommentModel = require("../models/comment-model");
const RatingModel = require("../models/ratings-model");


exports.adminDashGet = async (req, res) => {
    try {
        const totalUsers = await UserModel.countUsers();
        const totalRecipes = await RecipeModel.countRecipes();
        const totalPosts = await ForumModel.countPosts();
        const latestForum = await ForumModel.findLatest();
        const latestComment = await CommentModel.findLatest();
        const latestRating = await RatingModel.findLatest();
        res.render("admin-dashboard", {totalUsers, totalRecipes, totalPosts, latestForum, latestComment, latestRating});
    } catch (error) {
        console.error("Admin Dashboard Error: ", error);
        res.render("error", { 
            msg: "Error retrieving admin dashboard."
        });
    };
};

exports.adminUsersGet = async (req, res) => {
    try {
        const users = await UserModel.retrieveAllUsers();
        res.render("admin-manage-users", {users});
    } catch (error) {
        console.error("Admin Display Users Error: ", error);
        res.render("error", { 
            msg: "Error retrieving users."
        });
    };
};

exports.adminEditRolePost = async (req, res) => {
    const newRole = req.body.newRole;
    const userId = String(req.params.id);
    try {
        await UserModel.updateUserById(userId, {role: newRole});
        res.redirect("/admin/users");
    } catch (error) {
        console.error("Error in Admin Edit User: ", error);
        res.render("error", { 
            msg: "An error occured while processing."
        });
    };
};