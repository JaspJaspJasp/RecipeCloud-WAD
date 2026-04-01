const mongoose = require('mongoose');
const Favourite = require('../models/favourite-model');

const Recipe = mongoose.model('Recipe');

exports.createFavourite = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = String(req.session.user._id || req.session.user.id);
    const recipeId = String(req.body.recipeId);
    const userName = req.session.user.userName || req.session.user.username || "Guest User";

    try {
        const userFavourite = await Favourite.findFavouriteByUserId(userId);
        
        // 1. Check if the recipe is already there
        if (userFavourite) {
            const isAlreadySaved = userFavourite.savedRecipes.some(r => String(r.recipeId) === recipeId);
            
            if (isAlreadySaved) {
                return res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head><link rel="stylesheet" href="/css/style.css"><title>Already Saved - RecipeCloud</title></head>
                    <body>
                        <div class="recipe-detail-main">
                            <div class="recipe-container" style="text-align: center; padding: 50px;">
                                <div class="content-wrapper">
                                    <h1 class="recipe-detail-title" style="color: #ff9800;">ℹ️ Already Saved</h1>
                                    <p class="recipe-created-by" style="font-size: 1.2rem; margin-bottom: 30px;">
                                        This recipe is already in your saved collections.
                                    </p>
                                    <div style="display: flex; justify-content: center; gap: 20px;">
                                        <a href="/recipe/${recipeId}" class="btn-solid">← Back to Recipe</a>
                                        <a href="/favourites" class="btn-solid" style="background-color: #3e4984; border-color: #3e4984;">View My Collection →</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
            }
        }

        // 2. If it's not a duplicate, proceed with adding it
        if (!userFavourite) {

            const newFavData = {
                userId: userId,
                userName: userName,
                savedRecipes: [{ recipeId: recipeId, dateSaved: new Date() }]
            }
            await Favourite.createFavourite({newFavData});;
        } else {
            await Favourite.addRecipeToList(userId, recipeId);
        }
        return res.redirect(`/recipe/${recipeId}`);
    } catch (error) {
        console.error(error);
        return res.render("error", {message: "Couldn't add to favourite collection. Please try again."});
    }
};


exports.readFavourite = async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const userId = String(req.session.user._id || req.session.user.id);
        console.log("--- DEBUG START ---");
        
        const userFavourite = await Favourite.findFavouriteByUserId(userId);
        
        if (!userFavourite) {
            return res.render('favourites', { recipes: [] });
        }

        const finalRecipes = [];

        for (const item of userFavourite.savedRecipes) {
            try {
                const detail = await Recipe.findById(item.recipeId).lean();

                if (detail) {
                    console.log(`   -> SUCCESS: Found "${detail.recipe_name}"`);
                    finalRecipes.push(detail);
                } else {
                    console.log(`   -> NOT FOUND: ID ${item.recipeId} exists in Favourites but not in Recipes.`);
                }
            } catch (err) {
                console.log("   -> SEARCH ERROR:", err.message);
            }
        }

        console.log("4. Sending to EJS:", finalRecipes.length);
        res.render('favourites', { recipes: finalRecipes });

    } catch (error) {
        console.error("READ ERROR:", error);
        return res.render("error", { message: "Error loading collection." });
    }
};

exports.updateFavourite = async (req, res) => {
    if(!req.session.user) {
        return res.redirect("/login");
    }
    try {
        const userId = String(req.session.user._id || req.session.user.id);
        const { recipeId, notes } = req.body;

        await Favourite.updateOne(
            { userId: userId, "savedRecipes.recipeId": recipeId },
            { $set: { "savedRecipes.$.notes": notes } }
        );
        
        res.redirect('/favourites');
    } catch (error) {
        console.error(error);
        return res.render("error", {message: "Couldn't update your favourite collection. Please try again."});
    }
};
// deletes a favourite (D)
exports.deleteFavourite = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        const userId = String(req.session.user.id);
        const recipeId = String(req.params.id);

        await Favourite.deleteRecipeFromList(userId, recipeId);
        return res.redirect('/favourites');
    } catch (error) {
        console.error(error);
        return res.render("error", {message: "Couldn't remove from favourite collection. Please try again."});
    }
};