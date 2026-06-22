const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop-controller");
const authentication = require('../middleware/user-auth');

router.post("/shopping-list/save-recipe", authentication.isLoggedIn, shopController.saveRecipeToList);

router.get("/shopping-list", authentication.isLoggedIn, shopController.showShopList);

router.post("/shopping-list/remove-recipe", authentication.isLoggedIn, shopController.removeRecipeFromList);

router.post("/shopping-list/toggle-ingredient", authentication.isLoggedIn, shopController.toggleIngredient);

router.post("/shopping-list/add-item", authentication.isLoggedIn, shopController.addPersonalItem);

router.post("/shopping-list/remove-item", authentication.isLoggedIn, shopController.removePersonalItem);

router.post("/shopping-list/clear", authentication.isLoggedIn, shopController.clearShoppingList);

module.exports = router;


