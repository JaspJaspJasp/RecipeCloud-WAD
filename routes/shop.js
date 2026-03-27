const express = require("express");
const router = express.Router();

const shopController = require("../controllers/shop-controller");

router.post("/shopping-list/save-recipe", shopController.saveRecipeToList);

router.get("/shopping-list", shopController.showShopList);

router.post("/shopping-list/remove-recipe", shopController.removeRecipeFromList);

router.post("/shopping-list/toggle-ingredient", shopController.toggleIngredient);

router.post("/shopping-list/add-item",   shopController.addPersonalItem);

router.post("/shopping-list/remove-item",  shopController.removePersonalItem);

router.post("/shopping-list/clear", shopController.clearShoppingList);

module.exports = router;


