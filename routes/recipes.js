const express = require("express");
const router = express.Router();

const recipeController = require('../controllers/recipe-controller');
const commentController = require('../controllers/comment-controller');
const authentication = require('../middleware/user-auth');

//load home page (R)
router.get('/', recipeController.HomePage);

//load create page 
router.get('/create', recipeController.getCreate);

//post created recipe to database (C)
router.post('/create', recipeController.postCreate);

//loading recipe when clicked (R)
router.get('/recipe/:id', recipeController.recipeFindbyID);

//posting the rating into database when in recipe (U)
router.post('/recipe/:id/rate', recipeController.rateRecipe);

//posting the comment into database when in recipe (C)
router.post('/recipe/:id/comment', commentController.createComments);

//allowing user to render their edit comment page (R)
router.get('/recipe/:id/comment/:commentId/edit', commentController.renderEditForm);

//posting the edit comment into the datebase (U)
router.post('/recipe/:id/comment/:commentId/edit', commentController.editComment);

//posting the deleted comment into the database (D)
router.post('/recipe/:id/comment/:commentId/delete', commentController.deleteComment);
//rendering the edit recipe form (R)
router.get('/recipe/:id/update', recipeController.renderEditRecipeForm);
//updating the edit recipe form (U)
router.post('/recipe/:id/update', recipeController.updateRecipe);
//rendering the delete recipe form (R)
router.get('/recipe/:id/delete', recipeController.renderDeleteRecipeForm);
//deleting the recipe (D)
router.post('/recipe/:id/delete', recipeController.deleteRecipe);

module.exports = router;