const Recipe = require("../models/recipe-model"); 
const Comment = require('../models/comment-model');
const Rating = require('../models/ratings-model');
const Favourite = require('../models/favourite-model');

//HomePage in index.ejs
exports.HomePage = async (req, res) => {

    const recipe_name = (req.query.q ?? "").trim();
    const cuisine = (req.query.cuisine ?? "").trim();
    const difficulty = (req.query.difficulty ?? "").trim();
        
    const rawTags = req.query.tags;
    const tagsArray = rawTags ? (Array.isArray(rawTags) ? rawTags : String(rawTags).split(",")) : [];

    try {

        const query = recipe_name
            ? { recipe_name: { $regex: recipe_name, $options: 'i' } }
            : {};

        if (cuisine !== "") {
            query.cuisine = cuisine;
        }

        if (difficulty !== "") {
            query.difficulty_level = difficulty;
        }

        // Filter by tags - only show recipes that have at least one matching tag
        if (tagsArray.length > 0) {
            query.tag = { $in: tagsArray };
        }

        const recipes = await Recipe.searchRecipes(query);

        return res.render('index', { 
            recipes: recipes,
            searchQuery: recipe_name,
            cuisine: cuisine,
            difficulty: difficulty,
            tags: rawTags ?? "",
            tag: tagsArray
        });

    } catch (err) {
        console.error("Error in HomePage:", err);
        return res.render('error', { 
            message: "We couldn't load the recipes. Please refresh or try again later."
        })
    }
};

//Initial Create GET route with no inputs
exports.getCreate = (req, res) => {
    return res.render("create", { 
        recipe_name: "", 
        cuisine: "", 
        tag: [], 
        serving: "", 
        approx_cooking_time: "", 
        difficulty_level: "", 
        instructions: "", 
        ingredient_amount: [""], 
        ingredient_name: [""],   
        recipe_image_base64: "",
        errors: [],
        user : req.session.user

    });
};

//POST create route to database
exports.postCreate = async (req, res) => {

    const userId = String(req.session.user.id);
    const username = req.session.user.userName;
    
    const recipe_name = (req.body.recipe_name ?? "").trim();
    const cuisine = (req.body.cuisine ?? "").trim();
    const serving = (req.body.serving ?? "").trim();
    const approx_cooking_time = (req.body.approx_cooking_time ?? "").trim();
    const difficulty_level = (req.body.difficulty_level ?? "").trim();
    const instructions = (req.body.instructions ?? "").trim();
    const recipe_image_base64 = (req.body.recipe_image_base64 ?? "").trim();

   
    let tag = req.body.tag || [];
    if (!Array.isArray(tag)) tag = [tag];

    let ingredient_amount = req.body.ingredient_amount || [];
    if (!Array.isArray(ingredient_amount)) ingredient_amount = [ingredient_amount];
    ingredient_amount = ingredient_amount.map(item => item.trim());

    let ingredient_name = req.body.ingredient_name || [];
    if (!Array.isArray(ingredient_name)) ingredient_name = [ingredient_name];
    ingredient_name = ingredient_name.map(item => item.trim());
    


    let errors = [];

   
    if (!recipe_name) errors.push("Recipe Name is required.");
    if (!cuisine) errors.push("Cuisine type is required.");
    if (!serving) errors.push("Serving size is required.");
    if (!approx_cooking_time) errors.push("Cooking time is required.");
    if (!difficulty_level) errors.push("Difficulty level is required.");
    if (!instructions) errors.push("Instructions are required.");
    if (recipe_image_base64.length > 4000000) errors.push("The image you selected is too large. Please keep images under 4MB.");

    let hasValidIngredient = false;
    for (let i = 0; i < ingredient_name.length; i++) {
        if (ingredient_name[i] !== "" && ingredient_amount[i] !== "") {
            hasValidIngredient = true;
            break;
        }
    }
    
    if (!hasValidIngredient) {
        errors.push("At least one ingredient with an amount is required.");
    }
    
    try {

        const existingRecipe = await Recipe.findQuery({recipe_name : recipe_name});

        if (existingRecipe) {
            errors.push("There is a recipe with this name already!")
        }

        if (errors.length > 0) {
        return res.render('create', {
        recipe_name, 
        cuisine, 
        tag, 
        serving, 
        approx_cooking_time, 
        difficulty_level, 
        instructions, 
        ingredient_amount, 
        ingredient_name, 
        recipe_image_base64,
        errors} );
    }

    let formattedIngredients = [];
        for (let i = 0; i < ingredient_name.length; i++) {
            if (ingredient_name[i] && ingredient_amount[i]) {
                formattedIngredients.push({ 
                    amount: ingredient_amount[i], 
                    name: ingredient_name[i] 
                });
            }
        } 

    const recipeData = {
            recipe_name, 
            cuisine, 
            tag, 
            serving, 
            approx_cooking_time, 
            difficulty_level, 
            instructions, 
            ingredients: formattedIngredients, 
            image: recipe_image_base64,
            userId: userId,
            username: username
        };


    await Recipe.createRecipe(recipeData);
    return res.redirect("/"); 

    } catch (err) {
        console.error("Error saving recipe: ", err)
        errors.push(err.message || "An error occurred while saving this recipe.");

        return res.render("create", { 
        recipe_name, 
        cuisine, 
        tag, 
        serving, 
        approx_cooking_time, 
        difficulty_level, 
        instructions, 
        ingredient_amount, 
        ingredient_name, 
        recipe_image_base64,
        errors
        
            });
        }
    } 

    
//Rendering recipe image when clicked on
exports.recipeFindbyID = async (req, res) => {
    const status = (req.query.status ?? "").trim();
    const favStatus = (req.query.favStatus ?? "").trim();
    const recipeId = String(req.params.id); 
    const sessionUserId = req.session.user ? String(req.session.user.id) : null;
    try {
        const recipe = await Recipe.findRecipeById(recipeId);

        let comments = await Comment.retrieveByRecipeId(recipeId);
        if (!comments) comments = []; // Fallback to empty array if null
        let totalCommentCount = 0;
        comments.forEach(userRecord => {
            if (userRecord.recipeComments && userRecord.recipeComments.length > 0) {
                totalCommentCount += userRecord.recipeComments.length;
            }
        });
        
        if (!recipe) {
            return res.render('error', {
                message: "This recipe does not exist or has been removed."
            });
        }

        const ratingAverage = recipe.ratingAverage || 0;
        const ratingCount = recipe.ratingCount || 0;
        const totalRatingScore = recipe.totalRatingScore || 0;
        const userId = req.session.user ? String(req.session.user.id) : null;
        const userRating = req.session.user ? await Rating.findUserRating(userId, recipeId) : null;
        
        // Process current user's recipe rating
        let currentRecipeRating = null;
        if (userId) {
            const allRatings = await Rating.retrieveByRecipeId(recipeId);
            const currentUserRatingsDoc = allRatings.find(doc => String(doc.userId) === String(userId));
            if (currentUserRatingsDoc) {
                currentRecipeRating = currentUserRatingsDoc.ratings.find(
                    r => String(r.recipeId) === String(recipeId)
                );
            }
        }

        let isFavourited = false;
        if (sessionUserId) {
            const userFavs = await Favourite.findFavouriteByUserId(sessionUserId);
            if (userFavs && userFavs.savedRecipes.some(r => String(r.recipeId) === recipeId)) {
                isFavourited = true;
            }
        }

        return res.render('recipe', { 
            recipe: recipe,  
            userRating: userRating,
            currentRecipeRating: currentRecipeRating,
            ratingAverage: ratingAverage,
            ratingCount: ratingCount,
            totalRatingScore: totalRatingScore,
            comments: comments,
            totalCommentCount: totalCommentCount,
            status: status,
            favStatus: favStatus,
            isFavourited: isFavourited  
        });

    } catch (err) {
        console.error("Error finding recipe: ", err);
        return res.render('error', {
            message: "Something went wrong. We can't find the recipe, or the recipe was deleted!"
        });
    }
};

exports.renderEditRecipeForm = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const sessionUserRole = (req.session.user.role);
    const recipeId = String(req.params.id);
    
    try {
        const recipe = await Recipe.findRecipeById(recipeId);

        if (!recipe) {
            return res.render('error', {
                message: "Recipe not found."
            });
        }

        if (sessionUserId !== recipe.userId && sessionUserRole !== "admin") {
            return res.render('error', {
                message: "No permissions to edit recipe."
            });
        }
        


        let ingredient_amount = [];
        let ingredient_name = [];

        if (recipe.ingredients && recipe.ingredients.length > 0) {
            for (let ing of recipe.ingredients) {
                ingredient_amount.push(ing.amount);
                ingredient_name.push(ing.name);
            }
        } else {
            ingredient_amount = [""];
            ingredient_name = [""];
        }

        res.render('edit-recipe', {
            recipe: recipe,
            recipe_name: recipe.recipe_name,
            cuisine: recipe.cuisine,
            tag: recipe.tag || [],
            serving: recipe.serving,
            approx_cooking_time: recipe.approx_cooking_time,
            difficulty_level: recipe.difficulty_level,
            instructions: recipe.instructions,
            ingredient_amount: ingredient_amount,
            ingredient_name: ingredient_name,
            errors: [],
        });

    } catch (err) {
        console.error("Error in renderEditRecipeForm:", err);
        return res.render('error', { message: "Could not load edit form." });
    }
};

exports.updateRecipe = async (req, res) => {
    const sessionUserId = String(req.session.user.id);
    const sessionUserRole = req.session.user.role;

    const recipeId = String(req.params.id);
    const recipe_name = (req.body.recipe_name ?? "").trim();
    const cuisine = (req.body.cuisine ?? "").trim();
    const serving = (req.body.serving ?? "").trim();
    const approx_cooking_time = (req.body.approx_cooking_time ?? "").trim();
    const difficulty_level = (req.body.difficulty_level ?? "").trim();
    const instructions = (req.body.instructions ?? "").trim();

    let tag = req.body.tag || [];
    if (!Array.isArray(tag)) tag = [tag];

    let ingredient_amount = req.body.ingredient_amount || [];
    if (!Array.isArray(ingredient_amount)) ingredient_amount = [ingredient_amount];
    ingredient_amount = ingredient_amount.map(item => item.trim());
    
    let ingredient_name = req.body.ingredient_name || [];
    if (!Array.isArray(ingredient_name)) ingredient_name = [ingredient_name];
    ingredient_name = ingredient_name.map(item => item.trim());

    let errors = [];
    if (!recipe_name) errors.push("Recipe Name is required.");
    if (!cuisine) errors.push("Cuisine type is required.");
    if (!serving) errors.push("Serving size is required.");
    if (!approx_cooking_time) errors.push("Cooking time is required.");
    if (!difficulty_level) errors.push("Difficulty level is required.");
    if (!instructions) errors.push("Instructions are required.");

    let hasValidIngredient = false;
    for (let i = 0; i < ingredient_name.length; i++) {
        if (ingredient_name[i] !== "" && ingredient_amount[i] !== "") {
            hasValidIngredient = true;
            break;
        }
    }
    if (!hasValidIngredient) errors.push("At least one ingredient with an amount is required.");

    try {
        const recipe = await Recipe.findRecipeById(recipeId);

        if (!recipe) {
            return res.render('error', { message: "Recipe not found." });
        }

        if (sessionUserId !== String(recipe.userId) && sessionUserRole !== "admin") {
            return res.render('error', { message: "You are not authorized to edit this recipe." });
        }

        if (errors.length > 0) {
            return res.render('edit-recipe', {
                recipe, recipe_name, cuisine, tag, serving, approx_cooking_time, 
                difficulty_level, instructions, ingredient_amount, ingredient_name, 
                errors
            });
        }

        let formattedIngredients = [];
        for (let i = 0; i < ingredient_name.length; i++) {
            if (ingredient_name[i] && ingredient_amount[i]) {
                formattedIngredients.push({
                    amount: ingredient_amount[i],
                    name: ingredient_name[i]
                });
            }
        }

        const updateData = {
            recipe_name,
            cuisine,
            tag, 
            serving,
            approx_cooking_time,
            difficulty_level,
            instructions,
            ingredients: formattedIngredients
        };

        await Recipe.updateRecipe(recipeId, updateData);
        return res.redirect(`/recipe/${recipeId}`);
    } catch (err) {
        console.error("Error in updateRecipe:", err);
        return res.render('error', { message: "Could not update the recipe." });
    }
};

exports.renderDeleteRecipeForm = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const sessionUserRole = req.session.user.role;
    const recipeId = String(req.params.id);

    try {
        const recipe = await Recipe.findRecipeById(req.params.id);

        if (!recipe) {
            return res.render('error', {
                message: "Recipe not found."
            });
        }

        if (sessionUserId !== String(recipe.userId) && sessionUserRole !== "admin") {
            return res.render('error', { message: "No permissions to delete recipe." });
        }

        return res.render('delete-recipe', {
            recipe: recipe,
        });

    } catch (err) {
        console.error("Error in renderDeleteRecipeForm:", err);
        return res.render('error', { message: "Failed to load delete form." });
    }
};

exports.deleteRecipe = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const sessionUserRole = req.session.user.role;
    const recipeId = String(req.params.id);

    try {
        const recipe = await Recipe.findRecipeById(req.params.id);

        if (!recipe) {
            return res.render('error', {
                message: "Recipe not found."
            });
        }
        
        if (sessionUserId !== String(recipe.userId) && sessionUserRole !== "admin") {
            return res.render('error', { message: "You are not authorized to delete this recipe." });
        }

        let success = await Recipe.deleteRecipe(req.params.id);
        console.log(success,'Recipe deletion SUCCESS');

        return res.redirect('/');

    } catch (err) {
        console.error("Error in deleteRecipe:", err);
        return res.render('error', { message: "Failed to delete recipe." });
    }
};



