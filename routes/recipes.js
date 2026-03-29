const express = require("express");
const router = express.Router();

const recipeController = require('../controllers/recipe-controller');
const commentController = require('../controllers/comment-controller');
const authentication = require('../middleware/user-auth');

//load home page (R)
router.get('/', recipeController.HomePage);

//load create page 
router.get('/create', authentication.isLoggedIn, recipeController.getCreate);

//post created recipe to database (C)
router.post('/create', authentication.isLoggedIn, recipeController.postCreate);

//loading recipe when clicked (R)
router.get('/recipe/:id', recipeController.recipeFindbyID);

//posting the rating into database when in recipe (U)
router.post('/recipe/:id/rate', authentication.isLoggedIn, recipeController.rateRecipe);

//posting the comment into database when in recipe (C)
router.post('/recipe/:id/comment', authentication.isLoggedIn, commentController.createComments);

//allowing user to render their edit comment page (R)
router.get('/recipe/:id/comment/:commentId/edit', authentication.isLoggedIn, commentController.renderEditForm);

//posting the edit comment into the datebase (U)
router.post('/recipe/:id/comment/:commentId/edit', authentication.isLoggedIn, commentController.editComment);

//posting the deleted comment into the database (D)
router.post('/recipe/:id/comment/:commentId/delete', authentication.isLoggedIn, commentController.deleteComment);
//rendering the edit recipe form (R)
router.get('/recipe/:id/update', authentication.isLoggedIn, recipeController.renderEditRecipeForm);
//updating the edit recipe form (U)
router.post('/recipe/:id/update', authentication.isLoggedIn, recipeController.updateRecipe);
//rendering the delete recipe form (R)
router.get('/recipe/:id/delete', authentication.isLoggedIn, recipeController.renderDeleteRecipeForm);
//deleting the recipe (D)
router.post('/recipe/:id/delete', authentication.isLoggedIn, recipeController.deleteRecipe);

module.exports = router;