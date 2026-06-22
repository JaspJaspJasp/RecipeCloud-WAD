const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin-controller");
const authentication = require('../middleware/user-auth');

router.get("/admin/dashboard", authentication.isLoggedIn, authentication.isAdmin, adminController.adminDashGet);

router.get("/admin/users", authentication.isLoggedIn, authentication.isAdmin, adminController.adminUsersGet);

router.post("/admin/users/:id/role", authentication.isLoggedIn, authentication.isAdmin, adminController.adminEditRolePost);

module.exports = router;