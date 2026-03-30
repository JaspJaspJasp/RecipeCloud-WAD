const Rating = require("../models/ratings-model");
const Recipe = require("../models/recipe-model");
const CommentModel = require("../models/comment-model");

// CREATE a new rating or UPDATE an existing one
exports.createRating = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const recipeId = String(req.params.id);
    const userId = String(req.session.user.id);
    const username = req.session.user.userName;
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
        // console.log(existingRating);

        if (existingRating) {
            // UPDATE existing rating
            await Rating.updateRating(existingRating._id, ratingValue);
       
        } else {
            // CREATE new rating
            // create using the function that was declared 
            await Rating.createRating({
                userId: userId,
                recipeId: recipeId,
                username: username,
                ratingValue: ratingValue
            });
        }

        // Recalculate aggregates for this recipe
        await recalculateRecipeRatings(recipeId);

        res.redirect(`/recipe/${recipeId}`);

    } catch (error) {
        console.error(error);
        res.render("error", { message: "Couldn't submit your rating. Please try again." });
    }
};

// READ all ratings for a recipe
exports.readRatings = async (req, res) => {
    const status = (req.query.status ?? "").trim();
    try {
        const recipeId = String(req.params.id);

        // Check if recipe exists
        const recipe = await Recipe.findRecipeById(recipeId);
        if (!recipe) {
            return res.render("error", { message: "Recipe not found" });
        }

        // Fetch comments for this recipe
        const comments = await CommentModel.retrieveByRecipeId(recipeId);

        // Fetch all ratings for this recipe
        const allRatings = await Rating.retrieveByRecipeId(recipeId);

        // Calculate aggregates,
        // cant reuse the recalcualte fn cause that fn will update the recipe doc but does not return those values 
        let totalScore = 0;
        for (let r of allRatings) {
            totalScore += r.ratingValue;
        }

        const count = allRatings.length;
        const average = count === 0 ? 0 : totalScore / count;

        // Find user's rating if logged in
        // this is so that we can render what the user originally rated the recipe
        let userRating = null;
        if (req.session.user) {
            const userRatingDoc = await Rating.findUserRating(
                String(req.session.user.id), 
                recipeId
            );
            if (userRatingDoc) {
                userRating = userRatingDoc.ratingValue;
                // console.log(userRatingDoc)
            }
        }

        // Render recipe view with rating data
        res.render("recipe", {
            recipe: recipe,
            user: req.session.user,
            userRating: userRating,
            ratingAverage: average,
            ratingCount: count,
            totalRatingScore: totalScore,
            allRatings: allRatings,
            comments: comments,
            status: status
        });

    } catch (error) {
        console.error(error);
        res.render("error", { message: "Couldn't load ratings. Please try again." });
    }
};

// UPDATE a rating (explicit endpoint, optional)
exports.updateRating = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const recipeId = String(req.params.id);
    const userId = String(req.session.user.id);
    const ratingValue = Number(req.body.rating);

    try {
        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            return res.render("error", { message: "Rating must be between 1 and 5" });
        }

        const userRating = await Rating.findUserRating(userId, recipeId);

        if (!userRating) {
            return res.render("error", { message: "Rating not found" });
        }

        await Rating.updateRating(userRating._id, ratingValue);
        await recalculateRecipeRatings(recipeId);

        res.redirect(`/recipe/${recipeId}`);

    } catch (error) {
        console.error(error);
        res.render("error", { message: "Couldn't update your rating. Please try again." });
    }
};

// DELETE a rating
exports.deleteRating = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

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

        res.redirect(`/recipe/${recipeId}`);

    } catch (error) {
        console.error(error);
        res.render("error", { message: "Couldn't delete your rating. Please try again." });
    }
};

// HELPER: Recalculate recipe rating aggregates
async function recalculateRecipeRatings(recipeId) {
    try {
        // we want all the rating that belong to that same recipe
        // this will provide the entire document for that user + recipe pair
        const allRatings = await Rating.retrieveByRecipeId(recipeId);
        // console.log(allRatings);

        let totalScore = 0;
        for (let r of allRatings) {
            totalScore += r.ratingValue;
        }

        const count = allRatings.length;
        console.log(count)
        const average = count === 0 ? 0 : totalScore / count;

        // Update Recipe document with aggregates
        await Recipe.updateRecipe(recipeId, {
            ratingAverage: average,
            ratingCount: count,
            totalRatingScore: totalScore
        });
    } catch (error) {
        console.error("Error recalculating ratings:", error);
    }
}