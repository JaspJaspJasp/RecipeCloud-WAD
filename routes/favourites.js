const express = require('express');
const router = express.Router();

const favController = require('../controllers/favourites-controller');
const authentication = require('../middleware/user-auth');

//Render favourites
router.get('/favourites', authentication.isLoggedIn, favController.getFavourite);
//Add to database
router.post('/favourites/add', authentication.isLoggedIn, favController.addFavourite);
//
//router.get('/favourites/:id/edit', authentication.isLoggedIn, favController.renderEditFavourite)
//
router.post('/favourites/:id/edit', authentication.isLoggedIn, favController.updateFavourite);
//
router.post('/favourites/:id/delete', authentication.isLoggedIn, favController.deleteFavourite);

module.exports = router;