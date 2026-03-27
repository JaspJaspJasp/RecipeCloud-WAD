const express = require('express');
const router = express.Router();

const favController = require('../controllers/favourites-controller');
const authentication = require('../middleware/user-auth');

//Render favourites
router.get('/favourites', favController.getFavourites);
//Add to database
router.post('/add', favController.addFavourite);
//
router.post('/update/:id', favController.updateFavourite);
//
router.post('/delete/:id', favController.deleteFavourite);

module.exports = router;