const Rating = require("../models/ratings-model");
const Recipe = require("../models/recipe-model");
const Comment = require("../models/comment-model");
const Favourite = require("../models/favourite-model");

// CREATE a new rating or UPDATE an existing one
exports.createRating = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const sessionUserName = req.session.user.userName;

    const recipeId = String(req.params.id);
    const userId = String(req.session.user.id);
    const ratingValue = Number(req.body.rating);


    try {
        // Validate rating value
        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            return res.render("error", { message: "Rating must be between 1 and 5" });
        }

        // Check if recipe exists
        // ratings-controller can access functions declared by other model 
        const recipe = await Recipe.findRecipeById(recipeId);
        if (!recipe) {
            return res.render("error", { message: "Recipe not found" });
        }

        // Check if user already rated this recipe
        // created new fn to find user's rating 
        const existingRating = await Rating.findUserRating(userId, recipeId);

        if (existingRating) {

            const updateData = {
                ratingValue : ratingValue,
                updatedAt: new Date(),
                isEdited: true
            };
            // UPDATE existing rating
            await Rating.updateRating(existingRating._id, updateData);

        } else {
            // CREATE new rating
            // create using the function that was declared 

            const newRatingData = {
                userId: sessionUserId,
                recipeId: recipeId,
                username: sessionUserName,
                ratingValue: ratingValue
            };

            await Rating.createRating(newRatingData);
        }

        // Recalculate aggregates for this recipe
        await recalculateRecipeRatings(recipeId);

        return res.redirect(`/recipe/${recipeId}`);

    } catch (error) {

        console.error("Error in createRating:", error);
        return res.render("error", { message: "Couldn't submit your rating. Please try again." });
    }
};

// READ all ratings for a recipe
exports.readRatings = async (req, res) => {
    const status = (req.query.status ?? "").trim();
    const sessionUserId = req.session.id
    try {
        const recipeId = String(req.params.id);

        // Check if recipe exists
        const recipe = await Recipe.findRecipeById(recipeId);
        if (!recipe) {
            return res.render("error", { message: "Recipe not found" });
        }

        // Fetch comments for this recipe
        const comments = await Comment.retrieveByRecipeId(recipeId);

        // Fetch all ratings for this recipe
        const allRatings = await Rating.retrieveByRecipeId(recipeId);
     
        // Calculate aggregates
        let totalScore = 0;
        for (let r of allRatings) {
            totalScore += r.ratingValue;
        }

        const count = allRatings.length;
        const average = count === 0 ? 0 : totalScore / count;

        // Find user's rating if logged in
        let userRating = null;
        if (sessionUserId) {
            const userRatingDoc = await Rating.findUserRating(sessionUserId, recipeId);
            if (userRatingDoc) {
                userRating = userRatingDoc.ratingValue;
            }
        }

        // Check if the recipe is already favourited
        let isFavourited = false;
        if (sessionUserId) {
            const userFavs = await Favourite.findFavouriteByUserId(sessionUserId);
            if (userFavs && userFavs.savedRecipes.some(r => String(r.recipeId) === recipeId)) {
                isFavourited = true;
            
            }
        
        }

        // Render recipe view with rating data
        return res.render("recipe", {
            recipe: recipe,
            user: req.session ? req.session.user : null,
            userRating: userRating,
            ratingAverage: average,
            ratingCount: count,
            totalRatingScore: totalScore,
            allRatings: allRatings,
            comments: comments,
            status: status,
            favStatus: status,
            isFavourited: isFavourited 
        });

    } catch (error) {
        console.error("Error in readRatings:", error);
        return res.render("error", { message: "Couldn't load ratings. Please try again." });
    }
};

// UPDATE a rating (explicit endpoint, optional)
exports.updateRating = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const recipeId = String(req.params.id);
    const ratingValue = Number(req.body.rating);

    try {
        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            return res.render("error", { message: "Rating must be between 1 and 5" });
        }

        const userRating = await Rating.findUserRating(sessionUserId, recipeId);

        if (!userRating) {
            return res.render("error", { message: "Rating not found" });
        }

        const updateData = {
            ratingValue: ratingValue,
            updatedAt: new Date(),
            isEdited: true
        };

        await Rating.updateRating(userRating._id, updateData);
        await recalculateRecipeRatings(recipeId);

        return res.redirect(`/recipe/${recipeId}`);

    } catch (error) {
        console.error("Error in updateRating:", error);
        return res.render("error", { message: "Couldn't update your rating. Please try again." });
    }
};

// DELETE a rating
exports.deleteRating = async (req, res) => {


    const recipeId = String(req.params.id);
    const userId = String(req.session.user.id);

    try {
        // Find user's rating
        const userRating = await Rating.findUserRating(userId, recipeId);

        if (!userRating) {
            return res.render("error", { message: "Rating not found" });
        }

        // Delete the rating
        await Rating.deleteRating(userRating._id);

        // Recalculate aggregates
        await recalculateRecipeRatings(recipeId);

        return res.redirect(`/recipe/${recipeId}`);

    } catch (error) {
        console.error("Error in deleteRating:", error);
        return res.render("error", { message: "Couldn't delete your rating. Please try again." });
    }
};

// HELPER: Recalculate recipe rating aggregates
async function recalculateRecipeRatings(recipeId) {
    try {
        
        const allRatings = await Rating.retrieveByRecipeId(recipeId);
        // console.log(allRatings);

        let totalScore = 0;
        for (let r of allRatings) {
            totalScore += r.ratingValue;
        }

        const count = allRatings.length;
        const average = count === 0 ? 0 : totalScore / count;

        const recipeUpdateData = {
            ratingAverage: average,
            ratingCount: count,
            totalRatingScore: totalScore
        };

        // Update Recipe document with aggregates
        await Recipe.updateRecipe(recipeId, recipeUpdateData);
    } catch (error) {
        console.error("Error recalculating ratings:", error);
    }
}