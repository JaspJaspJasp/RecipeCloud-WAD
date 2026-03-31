const express = require('express');
const router = express.Router();

const favController = require('../controllers/favourites-controller');
const authentication = require('../middleware/user-auth');

//Render favourites
router.get('/favourites', authentication.isLoggedIn, favController.readFavourite);
//Add to database
router.post('/favourites/add', authentication.isLoggedIn, favController.createFavourite);
//update database
router.post('/favourites/update', authentication.isLoggedIn, favController.updateFavourite);
//delete from database
router.post('/favourites/delete/:id', authentication.isLoggedIn, favController.deleteFavourite);

module.exports = router;