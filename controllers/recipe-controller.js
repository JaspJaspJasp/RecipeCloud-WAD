const Recipe = require("../models/recipe-model"); 
const CommentModel = require('../models/comment-model');

//HomePage in index.ejs
exports.HomePage = async (req, res) => {
    try {

        const recipe_name = (req.query.q ?? "").trim();
        const cuisine = (req.query.cuisine ?? "").trim();
        const difficulty = (req.query.difficulty ?? "").trim();
        const tags = (req.query.tags ?? "").trim(); 

        console.log(tags);

        const query = recipe_name
            ? { recipe_name: { $regex: recipe_name, $options: 'i' } }
            : {};

        if (cuisine !== "") {
            query.cuisine = cuisine;
        }

        if (difficulty !== "") {
            query.difficulty_level = difficulty;
        }

        if (tags !== "") {
            let tagArray = Array.isArray(tags) ? tags : tags.split(",");
            console.log(tagArray);
            query.tag = { $in: tagArray };
        }

        const recipes = await Recipe.searchRecipes(query);

        res.render('index', { 
            recipes,
            searchQuery: recipe_name,
            cuisine,
            difficulty,
            tags,
            tag: tags ? tags.split(",") : []
        });

    } catch (err) {
        console.error(err);
        res.render('error', { 
            message: "We couldn't load the recipes. Please refresh or try again later."
        });
    }
};

//Initial Create GET route with no inputs
exports.getCreate = (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render("create", { 
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
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
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
    
    const userId = String(req.session.user.id);
    const username = req.session.user.userName;

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
    const recipeId = String(req.params.id); 
    
    try {
        const recipe = await Recipe.findRecipeById(recipeId);
        const comments = await CommentModel.retrieveByRecipeId(recipeId);
        
        if (!recipe) {
            return res.render('error', {
                message: "This recipe does not exist or has been removed."
            });
        }

        let userRating = null; 

        // This is the block that was crashing! 
        // We now safely isolate everything inside it.
        if (req.session.user && recipe.ratings) {
            const sessionUserId = String(req.session.user.id);
            
            for (let r of recipe.ratings) {
                if (String(r.userId) === sessionUserId) {
                    userRating = r.value;
                    break; // Stops looking once we find their rating
                }
            }
        }
        
        return res.render('recipe', { 
            recipe: recipe, 
            user: req.session.user, 
            userRating: userRating, 
            comments: comments, 
            status: status 
        });

    } catch (err) {
        console.error("Error finding recipe: ", err);
        return res.render('error', {
            message: "Something went wrong. We can't find the recipe, or the recipe was deleted!"
        });
    }
};

//rating recipe inside recipe
exports.rateRecipe = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const recipeId = String(req.params.id);
    const userId = String(req.session.user.id);
    const sessionUserId = String(req.session.user.id);
    const userRating = Number(req.body.rating);

    try {

        const recipe = await Recipe.findRecipeById(recipeId);

        if (!recipe) {
            return res.render("error", { 
                message: "Recipe not found"
             });
        }
       
        if (!Array.isArray(recipe.ratings)) {
            recipe.ratings = [];
        }

        let existingRating = null;

        // for loop that loops through the ratings object to find if userId is there
        for (let r of recipe.ratings) {
            if (String(r.userId) === sessionUserId) {
                existingRating = r;
                break;
                }
            }
        

        // update or add
        if (existingRating) {
            existingRating.value = userRating;
        } else {
        recipe.ratings.push({
            userId: sessionUserId,
            value: userRating
        });
        }

        // calculate total
        let total = 0;

        for (let r of recipe.ratings) {
        total += r.value;
        }

        let count = recipe.ratings.length;

        const updateData = {
            ratings: recipe.ratings,
            rating_count: count,
            total_rating_score: total,
            rating: count === 0 ? 0 : total / count
        };

        await Recipe.updateRecipe(recipeId, updateData);

        res.redirect(`/recipe/${recipeId}`);
        } catch (err) {
        console.error(err)
        // if database did not managed to properly collect rating data 
        res.render('error', { message : "Your rating couldn't be submitted. Please try again."});
    }

    }; 

exports.renderEditRecipeForm = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const recipe = await Recipe.findRecipeById(req.params.id);

        if (!recipe) {
            return res.render('error', {
                message: "Recipe not found."
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
            user: req.session.user
        });

    } catch (err) {
        console.error(err);
        res.redirect(`/recipe/${req.params.id}`);
    }
};

exports.updateRecipe = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const recipe = await Recipe.findRecipeById(req.params.id);

        if (!recipe) {
            return res.render('error', {
                message: "Recipe not found."
            });
        }

        let recipe_name = (req.body.recipe_name ?? "").trim();
        let cuisine = (req.body.cuisine ?? "").trim();
        let serving = (req.body.serving ?? "").trim();
        let approx_cooking_time = (req.body.approx_cooking_time ?? "").trim();
        let difficulty_level = (req.body.difficulty_level ?? "").trim();
        let instructions = (req.body.instructions ?? "").trim();

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

        if (!hasValidIngredient) {
            errors.push("At least one ingredient with an amount is required.");
        }

        if (errors.length > 0) {
            return res.render('edit-recipe', {
                recipe: recipe,
                recipe_name,
                cuisine,
                tag,
                serving,
                approx_cooking_time,
                difficulty_level,
                instructions,
                ingredient_amount,
                ingredient_name,
                errors,
                user: req.session.user
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
            recipe_name: recipe_name,
            cuisine: cuisine,
            tag: tag,
            serving: serving,
            approx_cooking_time: approx_cooking_time,
            difficulty_level: difficulty_level,
            instructions: instructions,
            ingredients: formattedIngredients
        };

        await Recipe.updateRecipe(req.params.id, updateData);

        res.redirect('/');

    } catch (err) {
        console.error(err);
        res.redirect(`/recipe/${req.params.id}`);
    }
};
exports.renderDeleteRecipeForm = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const recipe = await Recipe.findRecipeById(req.params.id);

        if (!recipe) {
            return res.render('error', {
                message: "Recipe not found."
            });
        }
        res.render('delete-recipe', {
            recipe: recipe,
            user: req.session.user
        });

    } catch (err) {
        console.error(err);
        res.redirect(`/recipe/${req.params.id}`);
    }
};

exports.deleteRecipe = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const recipe = await Recipe.findRecipeById(req.params.id);

        if (!recipe) {
            return res.render('error', {
                message: "Recipe not found."
            });
        }
        let success = await Recipe.deleteRecipe(req.params.id);
        console.log(success,'Recipe deletion SUCCESS');

        res.redirect('/');

    } catch (err) {
        console.error(err);
        res.redirect(`/recipe/${req.params.id}`);
    }
};



