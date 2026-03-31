const express = require('express');
const router = express.Router();

const favController = require('../controllers/favourites-controller');
const authentication = require('../middleware/user-auth');

//Render favourites
router.get('/favourites', authentication, favController.getFavourites);
//Add to database
router.post('/favourites/add', authentication, favController.addFavourite);
//
router.get('/favourites/:id/edit', authentication, favController.renderEditFavourite)
//
router.post('/favourites/:id/edit', authentication, favController.updateFavourite);
//
router.post('/favourites/:id/delete', authentication, favController.deleteFavourite);

module.exports = router;