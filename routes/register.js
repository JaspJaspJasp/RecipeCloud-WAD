const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");
const authentication = require('../middleware/user-auth');


router.get("/register", userController.registerGet);

router.post("/register", userController.registerPost);

//Render edit-user page
router.get("/edit-user/:id", authentication.isLoggedIn, userController.editUserGet);
//Save edit-user to database
router.post("/edit-user/:id", authentication.isLoggedIn, userController.editUserPost);
//
router.get("/display-user/:id", authentication.isLoggedIn, userController.displayUser);

module.exports = router;