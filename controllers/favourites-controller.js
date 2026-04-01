const mongoose = require('mongoose');
const Favourite = require('../models/favourite-model');
const Recipe = mongoose.model('Recipe');

exports.createFavourite = async (req, res) => {
<<<<<<< HEAD
    if (!req.session.user) {
        return res.redirect("/login");
    }
=======
    const sessionUserId = String(req.session.user.id);
    const sessionUserName = String(req.session.user.userName ?? "Guest User").trim();
>>>>>>> 62a6766c0af8a33df493f1dbe2b9f8f9decf0d87

    const recipeId = String(req.body.recipeId ?? "").trim();

    try {
        const userFavourite = await Favourite.findFavouriteByUserId(sessionUserId);
        
        if (userFavourite) {
            const isAlreadySaved = userFavourite.savedRecipes.some(r => String(r.recipeId) === recipeId);
            
            if (isAlreadySaved) {
                return res.redirect(`/recipe/${recipeId}?favStatus=exists`);
            }
        }

        if (!userFavourite) {
            const newFavData = {
                userId: sessionUserId,
                userName: sessionUserName,
                savedRecipes: [{ recipeId: recipeId, dateSaved: new Date() }]
            };
            
            await Favourite.createFavourite(newFavData);
        } else {
            await Favourite.addRecipeToList(sessionUserId, recipeId);
        }
        
        return res.redirect(`/recipe/${recipeId}?favStatus=success`);

    } catch (error) {
        console.error("Error in createFavourite:", error);
        return res.render("error", { message: "Couldn't add to favourite collection. Please try again." });
    }
};

exports.readFavourite = async (req, res) => {
    const sessionUserId = String(req.session.user.id);

    try {
        const userFavourite = await Favourite.findFavouriteByUserId(sessionUserId);
        
        if (!userFavourite) {
            return res.render('favourites', { recipes: [] });
        }

        const finalRecipes = [];

        for (const item of userFavourite.savedRecipes) {
            try {
                const detail = await Recipe.findById(item.recipeId).lean();

                if (detail) {
                    finalRecipes.push(detail);
                }
            } catch (err) {
                console.error("Error fetching recipe details in readFavourite:", err.message);
            }
        }

        return res.render('favourites', { recipes: finalRecipes });

    } catch (error) {
        console.error("Error in readFavourite:", error);
        return res.render("error", { message: "Error loading collection." });
    }
};

exports.updateFavourite = async (req, res) => {
    const sessionUserId = String(req.session.user.id);
    
    const recipeId = String(req.body.recipeId ?? "").trim();
    const notes = String(req.body.notes ?? "").trim();

    try {
        const updateData = {
            $set: { "savedRecipes.$.notes": notes }
        };

        await Favourite.updateFavourite(sessionUserId, updateData);
        
        return res.redirect('/favourites');

    } catch (error) {
        console.error("Error in updateFavourite:", error);
        return res.render("error", { message: "Couldn't update your favourite collection. Please try again." });
    }
};

exports.deleteFavourite = async (req, res) => {
    const sessionUserId = String(req.session.user.id);
    
    const recipeId = String(req.params.id ?? "").trim();

    try {
        await Favourite.deleteRecipeFromList(sessionUserId, recipeId);
        
        return res.redirect('/favourites');

    } catch (error) {
        console.error("Error in deleteFavourite:", error);
        return res.render("error", { message: "Couldn't remove from favourite collection. Please try again." });
    }
};