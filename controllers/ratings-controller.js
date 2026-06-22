const Rating = require("../models/ratings-model");
const Recipe = require("../models/recipe-model");
const Comment = require("../models/comment-model");
const Favourite = require("../models/favourite-model");


// CREATE a new rating or UPDATE an existing one
exports.createRating = async (req, res) => {

    const userId = String(req.session.user.id);
    const userName = req.session.user.userName;
    const recipeId = String(req.params.id);
    const ratingValue = Number(req.body.rating);


    try {
        // Validate rating value-
        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            return res.render("error", { message: "Rating must be between 1 and 5" });
        }

        // Check if recipe exists
        // ratings-controller can access functions declared by other model 
        const recipe = await Recipe.findRecipeById(recipeId);
        if (!recipe) {
            return res.render("error", { message: "Recipe not found" });
        }

        // Check if user already has a ratings document
        const userRatingsDoc = await Rating.findUserRatingsDoc(userId);

        if (userRatingsDoc) {
            // User already has ratings document, check if they rated this specific recipe
            const existingRecipeRating = userRatingsDoc.ratings.find(r => String(r.recipeId) === recipeId);
            
            if (existingRecipeRating) {
                // UPDATE existing rating for this recipe
                await Rating.updateRatingList(userId, recipeId, ratingValue);
            } else {
                // ADD new recipe rating to their existing ratings array
                await Rating.addRatingToUser(userId, recipeId, ratingValue);
            }
        } else {
            // CREATE new rating document for this user
            const newRatingData = {
                userId: userId,
                userName: userName,
                ratings: [{
                    recipeId: recipeId,
                    ratingValue: ratingValue,
                    isEdited: false }]
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
    const userId = req.session.user ? String(req.session.user.id) : null;
    const favStatus = (req.query.favStatus ?? "").trim();
    try {
        const recipeId = String(req.params.id);
        
        const recipe = await Recipe.findRecipeById(recipeId);
        if (!recipe) {
            return res.render("error", { message: "Recipe not found" });
        }

        const commentDoc = await Comment.retrieveByRecipeId(recipeId);

        const commentsList = commentDoc ? commentDoc.recipeComments : [];

        const totalCommentCount = commentsList.length;

        const allRatings = await Rating.retrieveByRecipeId(recipeId);
    
        // Calculate aggregates
        let totalScore = 0;
        let count = 0;
        for (let userRatingDoc of allRatings) {
            const specificRating = userRatingDoc.ratings.find(r => String(r.recipeId) === recipeId);
            if (specificRating) {
                totalScore += specificRating.ratingValue;
                count++;
            }
        }

        const average = count === 0 ? 0 : totalScore / count;

        let userRating = null;
        let currentRecipeRating = null;
        let isFavourited = false;
        if (userId) {
            const userRatingDoc = await Rating.findUserRating(userId, recipeId);
            if (userRatingDoc) {
                const specificRating = userRatingDoc.ratings.find(r => String(r.recipeId) === recipeId);
                if (specificRating) {
                    userRating = specificRating.ratingValue;
                    currentRecipeRating = specificRating;
                }
            }
            const userFavs = await Favourite.findFavouriteByUserId(userId);
            if (userFavs && userFavs.savedRecipes.some(r => String(r.recipeId) === recipeId)) {
                isFavourited = true;
            }
        }
        
        return res.render("recipe", {
            recipe: recipe,
            userRating: userRating,
            currentRecipeRating: currentRecipeRating,
            ratingAverage: average,
            ratingCount: count,
            totalRatingScore: totalScore,
            comments: commentsList, 
            totalCommentCount: totalCommentCount,
            status: status,
            favStatus: favStatus,
            isFavourited: isFavourited 
        });

    } catch (error) {
        console.error("Error in readRatings:", error);
        return res.render("error", { message: "Couldn't load ratings. Please try again." });
    }
};

// UPDATE a rating 
exports.updateRating = async (req, res) => {

    const userId = String(req.session.user.id);
    const recipeId = String(req.params.id);
    const ratingValue = Number(req.body.rating);

    try {
        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            return res.render("error", { message: "Rating must be between 1 and 5" });
        }

        const userRating = await Rating.findUserRating(userId, recipeId);

        if (!userRating) {
            return res.render("error", { message: "Rating not found" });
        }

        await Rating.updateRatingList(userId, recipeId, ratingValue);
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
        // now allRatings is an array of all rating object for that recipe 


        let totalScore = 0;
        let count = 0;

        for (let userRatingDoc of allRatings) {
           const specificRating = userRatingDoc.ratings.find(r => String(r.recipeId) === recipeId);
           if (specificRating) {
               totalScore += specificRating.ratingValue;
               count++;
           }
        }

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