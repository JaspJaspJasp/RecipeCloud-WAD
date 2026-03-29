const express = require("express");
const router = express.Router();

const userController = require(`.././controllers/user-controller`)
const authentication = require('../middleware/user-auth');

//Show user login page
router.get("/login", userController.showLogin);
//Log user in via checking database
router.post("/login", userController.checkLogin);
//Logout user
router.get("/logout", authentication.isLoggedIn, userController.logout);
    
module.exports = router;

