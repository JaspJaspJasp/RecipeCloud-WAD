const ShopModel = require("../models/shop-model");

exports.saveRecipeToList = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const sessionUserName = String(req.session.user.userName);

    const recipeId = (req.body.recipeId ?? "").trim();
    const recipeName = (req.body.recipeName ?? "").trim();
    const ingredients = req.body.ingredients;

    let parsedIngredients = [];
    try {
        parsedIngredients = rawIngredients ? JSON.parse(rawIngredients) : [];
    } catch (e) {
        parsedIngredients = [];
    }
    
    try {

        let userShop = await ShopModel.findUserById(req.session.user.id);
        
        if (!userShop) {
            
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
        };

        await ShopModel.addItem(additemObj);

        } else {
            //WHY NOT .FIND() but .SOME() CUZ .some() → returns true or false only
            const alreadySaved = userShop.recipes.some(r => r.recipeId === String(recipeId));
            if (alreadySaved) {
                return res.redirect('/shopping-list');
            }

            userShop.recipes.push({
                recipeId: recipeId,
                recipeName: recipeName,
                ingredients: parsedIngredients.map(ing => ({
                    name: ing.name,
                    amount: ing.amount,
                    isBought: false
                }))
            });

            const updateData = {
                recipes: userShop.recipes,
                updatedAt: Date.now()
            };

            await ShopModel.editItemById(sessionUserId, updateData);
        }

        return res.redirect('/shopping-list');

    } catch (err) {

        console.error("Error in saveRecipeToList:", err);
        // RULE 13: Strict return
        return res.render('error', { message: "Could not save recipe to shopping list." });
    }
};

exports.showShopList = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const sessionUserName = String(req.session.user.userName);

    try {
        let userShop = await ShopModel.findUserById(req.session.user.id);

        //one document per user setup
        // First time user visits — create an empty shop document for them
        if (!userShop) {

            const newShopObj = {
                userid: sessionUserId,
                userName: sessionUserName,
                personalitems: [],
                recipes: []
            };

            userShop = await ShopModel.addItem(newShopObj);

        }

        return res.render("shop", {
            userShop: userShop,
            user: req.session.user
        });

    } catch (err) {
        console.error("Error in showShopList:", err);
        return res.render('error', { message: "We couldn't load the shopping list. Please try again later." });
    }
};

exports.removeRecipeFromList = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const recipeId = String(req.body.recipeId ?? "").trim()

    try {
        const userShop = await ShopModel.findUserById(req.session.user.id);

        if (!userShop) {
            return res.redirect('/shopping-list');
        }

        const filteredRecipes = userShop.recipes.filter(r => r.recipeId !== String(recipeId));

        const updateData = {
            recipes: filteredRecipes,
            updatedAt: Date.now()
        };

        await ShopModel.editItemById(sessionUserId, updateData);

        return res.redirect('/shopping-list');

    } catch (err) {

        console.error("Error in removeRecipeFromList:", err);
        return res.render('error', { message: "Could not remove recipe from shopping list." });
    }
}

exports.addPersonalItem = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    const sessionUserName = String(req.session.user.userName);
    
    const name = String(req.body.name ?? "").trim();
    const amount = String(req.body.amount ?? "").trim();

    if (!name) {
        return res.redirect('/shopping-list');
    }

    try {
    
        let userShop = await ShopModel.findUserById(req.session.user.id);

        if (!userShop) {

            const newShopObj = {
                userid: sessionUserId,
                userName: sessionUserName,
                personalitems: [{ name: name, amount: amount }],
                recipes: []
            };

            await ShopModel.addItem(newShopObj);

        } else {
            
            userShop.personalitems.push({ name : name,  amount: amount || '' });
            
            const updateData = {
                personalitems: userShop.personalitems,
                updatedAt: Date.now()
            };

            await ShopModel.editItemById(sessionUserId, updateData);

        }

        return res.redirect('/shopping-list');

    } catch (err) {

        console.error("Error in addPersonalItem:", err);
        return res.render('error', { message: "Could not add item to shopping list." });
    }
};

exports.removePersonalItem = async (req, res) => {

    const sessionUserId = String(req.session.user.id);
    
    const rawIndex = String(req.body.index ?? "").trim();
    const index = rawIndex !== "" ? parseInt(rawIndex, 10) : -1;
    
    try {

        const userShop = await ShopModel.findUserById(sessionUserId);

        // keep all items EXCEPT the one at the target index
        //need write function as filter needs to know what condition to filter
        //item is eg { name: "Olive Oil", amount: "2 bottles" },  // item when i=0

        const filteredItems = userShop.personalitems.filter((item, i) => i !== index);
        const updateData = {
            personalitems: filteredItems,
            updatedAt: Date.now()
        };
        //.save() is what actually sends those changes back to MongoDB
        //without .save() changes are only saved in js memory
        await ShopModel.editItemById(sessionUserId, updateData);

        return res.redirect('/shopping-list');
    } catch (err) {
        console.error("Error in removePersonalItem:", err);
        return res.render('error', { message: "Could not remove item from shopping list." });
    }
};

exports.clearShoppingList = async (req, res) => {

    const sessionUserId = String(req.session.user.id);

    try {

        await ShopModel.deleteItemById(req.session.user.id);
        return res.redirect('/shopping-list');

    } catch (err) {
        console.error("Error in clearShoppingList:", err);
        return res.render('error', { message: "Could not clear shopping list." });
    }
};

exports.toggleIngredient = async (req, res) => {

    const sessionUserId = String(req.session.user.id);

    const recipeId = String(req.body.recipeId ?? "").trim();
    const rawIndex = String(req.body.ingIndex ?? "").trim();
    const ingIndex = rawIndex !== "" ? parseInt(rawIndex, 10) : -1;

    try {
    
        const userShop = await ShopModel.findUserById(sessionUserId);

        if (!userShop || ingIndex < 0) { 
            return res.redirect('/shopping-list');
        }
        // find the right recipe
        const recipeIndex = userShop.recipes.findIndex(r => r.recipeId === String(recipeId));
        
        if (recipeIndex < 0) {
            return res.redirect('/shopping-list');
        }

        // flip the isBought value

        let updatedRecipes = JSON.parse(JSON.stringify(userShop.recipes));
        
        updatedRecipes[recipeIndex].ingredients[ingIndex].isBought = !updatedRecipes[recipeIndex].ingredients[ingIndex].isBought;

        const updateData = {
            recipes: updatedRecipes,
            updatedAt: Date.now()
        };

        await ShopModel.editItemById(sessionUserId, updateData);

        return res.redirect('/shopping-list');

    } catch (err) {
        console.error("Error in toggleIngredient:", err);
        
        return res.render('error', { message: "Could not update ingredient." });
    }
};