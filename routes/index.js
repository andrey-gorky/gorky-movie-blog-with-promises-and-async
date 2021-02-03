const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Movies = require("../models/movie");
const Comments = require("../models/comments");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const middleware = require("../middleware");

const IndexController = require("../Controllers/Index.Controller");

//WELCOME PAGE
router.get("/", IndexController.getWelcomePage);

//==============================================
//*AUTHENTICATION ROUTES
//REGISTER ROUTES
router.get("/register", IndexController.getRegisterPage);

router.post("/register", IndexController.registerUser);


//LOGIN
router.get("/login", IndexController.getLoginPage);

router.post("/login", IndexController.authenticateUser);


//LOGOUT
router.get("/logout", IndexController.logoutUser);
//==============================================


//GET USER PROFILE PAGE
router.get("/users/:id", IndexController.getUsersProfilePage);


//==============================================
//PASSWORD RESET
router.get("/password-reset", IndexController.getPasswordResetPage);

router.post("/password-reset", IndexController.sendPasswordResetEmail);

router.get("/new-password/:token", IndexController.getNewPasswordPage);

router.post("/new-password/:token", IndexController.updateUserPassword);
//==============================================


//==============================================
// EDIT USER ACCOUNT
router.get("/users/:id/edit",
	middleware.isLoggedIn,
	middleware.checkUserOwnership,
	IndexController.getUsersEditPage
);


router.put("/users/:id",
	middleware.isLoggedIn,
	middleware.checkUserOwnership,
	IndexController.updateUsersAccount
);
//==============================================


module.exports = router;