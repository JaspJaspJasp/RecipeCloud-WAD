const ShopModel = require("../models/shop-model");

exports.saveRecipeToList = async (req, res) => {
    const recipeId = req.body.recipeId;
    const recipeName = req.body.recipeName;
    const ingredients = req.body.ingredients;
    const parsedIngredients = JSON.parse(ingredients);

    try {

        let userShop = await ShopModel.findUserById(req.session.user.id);

        const additemObj = {
            userid: req.session.user.id,
            userName: req.session.user.userName,
            personalitems: [],
            recipes: [{
                recipeId,
                recipeName,
                ingredients: parsedIngredients.map(ing => ({
                    name: ing.name,
                    amount: ing.amount,
                    isBought: false
                }))
            }]
        }
        if (!userShop) {

            await ShopModel.addItem(additemObj);

        } else {
            //WHY NOT .FIND() but .SOME() CUZ .some() → returns true or false only
            const alreadySaved = userShop.recipes.some(r => r.recipeId === String(recipeId));
            if (alreadySaved) {
                return res.redirect('/shopping-list');
            }

            userShop.recipes.push({
                recipeId,
                recipeName,
                ingredients: parsedIngredients.map(ing => ({
                    name: ing.name,
                    amount: ing.amount,
                    isBought: false
                }))
            });
            userShop.updatedAt = Date.now();
            await userShop.save();
        }

        res.redirect('/shopping-list');
    } catch (err) {
        console.error(err);
        res.render('error', { message: "Could not save recipe to shopping list." });
    }
}

exports.showShopList = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        let userShop = await ShopModel.findUserById(req.session.user.id);

        //one document per user setup
        // First time user visits — create an empty shop document for them
        if (!userShop) {
            userShop = await ShopModel.addItem({
                userid: req.session.user.id,
                userName: req.session.user.userName,
                personalitems: [],
                recipes: []
            });
        }

        res.render("shop", {
            userShop: userShop,
        });
    } catch (err) {
        console.error(err);
        res.render('error', { 
            message: "We couldn't load the shopping list. Please try again later."
        });
    }
}

exports.removeRecipeFromList = async (req, res) => {
    try {
        const { recipeId } = req.body;

        const userShop = await ShopModel.findUserById(req.session.user.id);

        userShop.recipes = userShop.recipes.filter(r => r.recipeId !== String(recipeId));

        await ShopModel.editItemById(req.session.user.id, {
            $set: { recipes: userShop.recipes, updatedAt: Date.now() }
        });

        res.redirect('/shopping-list');
    } catch (err) {
        console.error(err);
        res.render('error', { message: "Could not remove recipe from shopping list." });
    }
}

exports.addPersonalItem = async (req, res) => {
    try {
        const { name, amount } = req.body;

        let userShop = await ShopModel.findUserById(req.session.user.id);

        if (!userShop) {
            await ShopModel.addItem({
                userid: req.session.user.id,
                userName: req.session.user.userName,
                personalitems: [{ name, amount: amount || '' }],
                recipes: []
            });
        } else {
            
            userShop.personalitems.push({ name, amount: amount || '' });
            userShop.updatedAt = Date.now();
            await userShop.save();
        }

        res.redirect('/shopping-list');
    } catch (err) {
        console.error(err);
        res.render('error', { message: "Could not add item to shopping list." });
    }
}

exports.removePersonalItem = async (req, res) => {
    try {
        const index = parseInt(req.body.index);

        const userShop = await ShopModel.findUserById(req.session.user.id);

        // keep all items EXCEPT the one at the target index
        //need write function as filter needs to know what condition to filter
        //item is eg { name: "Olive Oil", amount: "2 bottles" },  // item when i=0
        userShop.personalitems = userShop.personalitems.filter(function(item, i) {
            return i !== index;
        });
        userShop.updatedAt = Date.now();
        //.save() is what actually sends those changes back to MongoDB
        //without .save() changes are only saved in js memory
        await userShop.save();

        res.redirect('/shopping-list');
    } catch (err) {
        console.error(err);
        res.render('error', { message: "Could not remove item from shopping list." });
    }
}

exports.clearShoppingList = async (req, res) => {
    try {
        await ShopModel.deleteItemById(req.session.user.id);
        res.redirect('/shopping-list');
    } catch (err) {
        console.error(err);
        res.render('error', { message: "Could not clear shopping list." });
    }
}

exports.toggleIngredient = async (req, res) => {
    try {
        const { recipeId, ingIndex } = req.body;

        const userShop = await ShopModel.findUserById(req.session.user.id);

        // find the right recipe
        const recipe = userShop.recipes.find(r => r.recipeId === String(recipeId));

        // flip the isBought value
        recipe.ingredients[ingIndex].isBought = !recipe.ingredients[ingIndex].isBought;

        userShop.updatedAt = Date.now();
        await userShop.save();

        res.redirect('/shopping-list');
    } catch (err) {
        console.error(err);
        res.render('error', { message: "Could not update ingredient." });
    }
}