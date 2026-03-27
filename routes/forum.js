const express = require("express");
const router = express.Router();

const forumController = require('../controllers/forum-controller');
const authentication = require('../middleware/user-auth');

//rendering the forum (R)
router.get("/forum", forumController.showForum);

//posting a new forum (C)
router.post("/forum/create", forumController.postForum);

//rendering edit form for post (R)
router.get("/forum/:id/edit", forumController.getEditForum);

//updating edit form into database (U) 
router.post("/forum/:id/update", forumController.updateForum);

//deleting forum in database (D)
router.post("/forum/:id/delete", forumController.deleteForum);

//posting a reply (C)
router.post("/forum/:id/reply", forumController.postReply);

module.exports = router;