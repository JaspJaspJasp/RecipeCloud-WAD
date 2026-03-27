const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");


router.get("/register", userController.registerGet);

router.post("/register", userController.registerPost);

//Render edit-user page
router.get("/edit-user/:id", userController.editUserGet);
//Save edit-user to database
router.post("/edit-user/:id", userController.editUserPost);
//
router.get("/display-user/:id", userController.displayUser);

module.exports = router;