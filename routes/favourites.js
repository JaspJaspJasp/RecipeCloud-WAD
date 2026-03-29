const express = require('express');
const router = express.Router();

const favController = require('../controllers/favourites-controller');
const authentication = require('../middleware/user-auth');

//Render favourites
router.get('/favourites', authentication.isLoggedIn, favController.getFavourites);
//Add to database
router.post('/add', authentication.isLoggedIn, favController.addFavourite);
//
router.post('/update/:id', authentication.isLoggedIn, favController.updateFavourite);
//
router.post('/delete/:id', authentication.isLoggedIn, favController.deleteFavourite);

module.exports = router;