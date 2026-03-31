const Favourite = require('../models/favourite-model');

exports.createFavourite = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const userId = String(req.session.user.id);
    const userName = req.session.user.userName; 
    const recipeId = String(req.body.recipeId);

    try {
        // checks if user has a favaourite document if not creates one
        const userFavourite = await Favourite.findFavouriteByUserId(userId);
        // this will return a favourite document with all the attributes as described in the favourite model
        if (!userFavourite) {

            const newFavData = {
                userId: userId, 
                userName: userName, 
                savedRecipes: [{
                    recipeId: recipeId,
                    dateSaved: new Date()
                }]
            }
            await Favourite.createFavourite({newFavData});
        } else {
            // is user already has a favourite document we want to add onto the savedRecipe array, 
            // we will use the $push operator to add a new recipe to the savedRecipes array
            await Favourite.addRecipeToList(userId, recipeId);
        }
        return res.redirect(`/recipe/${recipeId}`);
    } catch (error) {
        console.error(error);
        return res.render("error", {message: "Couldn't add to favourite collection. Please try again."});
    }

};

// read operation to fetch single favourite document for logged in user 
exports.readFavourite = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        const userId = String(req.session.user.id);
        const userFavourite = await Favourite.findFavouriteByUserId(userId);
        
        if (!userFavourite) {
            return res.render('favourites', { favourite: null });
        }

        return res.render('favourites', { favourite: userFavourite });
    } catch (error) {
        console.error(error);
        return res.render("error", {message: "Couldn't fetch your favourite collection. Please try again."});
    }
};


// update operation to update the notes and tags for a favourite document
exports.updateFavourite = async (req, res) => {
    if(!req.session.user) {
        return res.redirect("/login");
    }
    try {
        const userId = String(req.session.user.id);
        
        const notesText = (req.body.notes || "").trim();
        const tagsArray = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];
        const ingredientsArray = req.body.ingredients ? req.body.ingredients.split(',').map(ingredient => ingredient.trim()) : [];

        const updateData = {
            $set: {
                notes: notesText,
                tags: tagsArray,
                ingredients: ingredientsArray
            }
        };

        await Favourite.updateFavourite(userId, updateData);
        
        return res.redirect('/favourites');
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