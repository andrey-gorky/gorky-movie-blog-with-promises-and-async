const passport = require("passport");
const User = require("../models/user");
const Movies = require("../models/movie");
const Comments = require("../models/comments");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const AppError = require("../AppErrors");

let checkIfUnique = function (err) {
	if (err.code === 11000) {
		let keyValue = Object.keys(err.keyValue).map(key => key).join(", ");
		return err.message = `A user with the given '${keyValue}' is already registered.`;
	}
}


module.exports = {

	//WELCOME PAGE
	getWelcomePage: function (req, res) {
		res.render("landing.ejs");
	},

	//==============================================
	//*AUTHENTICATION

	//REGISTER ROUTES
	getRegisterPage: function (req, res) {
		res.render("authentication/register.ejs");
	},

	registerUser: function (req, res, next) {
		var newUser = new User({
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: req.body.avatar
		});
		if (newUser.avatar === "") { newUser.avatar = process.env.DEFAULT_AVATAR }

		User.register(newUser, req.body.password, function (err, newUser) {
			if (err) {
				checkIfUnique(err);
				return next(new AppError(
					400,
					err.message,
					"/register"
				));
			} else {
				passport.authenticate("local")(req, res, function () {
					req.flash("flash-success", `Welcome ${req.body.username}`);
					res.redirect("/movies");
				});
			}
		});
	},


	//LOGIN
	getLoginPage: function (req, res) {
		res.render("authentication/login.ejs");
	},

	authenticateUser: passport.authenticate("local", {
		successRedirect: "/movies",
		failureRedirect: "/login"
	}),


	//LOGOUT
	logoutUser: function (req, res) {
		req.logout();
		req.flash("flash-success", "Successfully logged out!");
		return res.redirect("/movies");
	},
	//==============================================


	//GET USER PROFILE PAGE
	getUsersProfilePage: function (req, res, next) {
		User.findById(req.params.id, function (err, foundUser) {
			if (!foundUser || err) {
				return next(new AppError(
					400,
					"Couldn't find user.",
					"/movies"
				));
			} else {
				var userMoviesQty;
				var userCommentsQty;
				Movies.find().where("author.id").equals(foundUser._id).exec(function (err, foundMovies) {
					if (err) {
						console.log(`couldn't find() ${foundUser.username}'s Movies. User_id = ${foundUser._id}`);
						userMoviesQty = "N/A";
					} else {
						userMoviesQty = foundMovies.length;
					}

					Comments.find().where("author.id").equals(foundUser._id).exec(function (err, foundComments) {
						if (err) {
							console.log(`couldn't find() ${foundUser.username}'s Comments. User_id = ${foundUser._id}`);
							userCommentsQty = "N/A";
						} else {
							userCommentsQty = foundComments.length;
						}

						res.render("users/show.ejs", {
							user: foundUser,
							userMovies: foundMovies,
							userMoviesQty: userMoviesQty,
							userCommentsQty: userCommentsQty
						});

					});

				});
			}
		});
	},


	//*==============================================
	//*PASSWORD RESET
	getPasswordResetPage: function (req, res) {
		res.render("authentication/password-reset.ejs");
	},

	sendPasswordResetEmail: function (req, res, next) {
		async.waterfall([
			function (done) {
				crypto.randomBytes(20, function (err, buf) {
					var token = buf.toString("hex");
					done(err, token);
				});
			},
			function (token, done) {
				User.findOne({ email: req.body.email }, function (err, user) {
					if (!user) {
						return next(new AppError(
							400,
							"There is no account with that email address.",
							"/password-reset"
						));
					}

					//set a token with expiration time
					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; //1hour

					user.save(function (err) {
						done(err, token, user);
					});

				});

			},
			function (token, user, done) {
				var smtpTransport = nodemailer.createTransport({
					service: "Gmail",
					auth: {
						user: process.env.GMB_EMAIL_ADRESS,
						pass: process.env.GMB_EMAIL_PASS
					}
				});
				var mailOptions = {
					to: user.email,
					from: process.env.GMB_EMAIL_ADRESS,
					subject: "Gorky Movie Blog password reset",
					html: `Hi ${user.username}, <br>
								You are receiveng this because you (or someone else) have requested the reset of the password for your account.
					To complete the password recovery process follow the link below.<br><br>
									http://${req.headers.host}/new-password/${token}<br><br>
										If you did not request password reset, please ignore this email and your password will remain unchanged.`

					// html: "<p>Hi " + user.username + ",</p> " +
					// 	"<p>You are receiveng this because you (or someone else) have requested the reset of the password for your account.</p>" +
					// 	"<p>Please copy and paste the following link to a search bar to complete the password recovery process.</p>\n\n" +
					// 	"<p>http://" + req.headers.host + "/new-password/" + token + "</p>\n\n" + //! req.headers.host = need to be changed for site address in future
					// 	"<p>If you did not request password reset, please ignore this email and your password will remain unchanged.</p>"
				};
				smtpTransport.sendMail(mailOptions, function (err) {
					console.log(`Email for password reset was sent to ${user.email}`);
					req.flash("flash-success", `An email has been sent to ${user.email} with further instructions. Please, don't hesitate to check for it in spam :)`);
					done(err, "done");
				});
			}
		], function (err) {
			if (err) {
				console.log(err)
				return next(new AppError(
					500,
					`Something went wrong while generating password reset email for you. Try again later, or contact ${process.env.GMB_EMAIL_ADRESS}`,
					"/password-reset"
				));
			}
			next(res.redirect("/password-reset"));
		});
	},

	getNewPasswordPage: function (req, res, next) {
		User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
			if (!user) {
				return next(new AppError(
					400,
					"Password reset token is invalid or has expired.",
					"/password-reset"
				));
			}
			res.render("authentication/new-password.ejs", { token: req.params.token });
		});
	},

	updateUserPassword: function (req, res, next) {
		async.waterfall([
			function (done) {
				User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
					if (!user) {
						return next(new AppError(
							400,
							"Password reset token is invalid or has expired.",
							"/password-reset"
						));
					}
					if (req.body.password === req.body.confirm) {
						user.setPassword(req.body.password, function (err) {
							user.resetPasswordToken = undefined;
							user.resetPasswordExpires = undefined;

							user.save(function (err) {
								req.logIn(user, function (err) {
									done(err, user);
								});
							});
						});
					} else {
						return next(new AppError(
							400,
							"Passwords do not match.",
							"back"
						));
					}
				});
			},
			function (user, done) {
				var smtpTransport = nodemailer.createTransport({
					service: "Gmail",
					auth: {
						user: process.env.GMB_EMAIL_ADRESS,
						pass: process.env.GMB_EMAIL_PASS
					}
				});
				var mailOptions = {
					to: user.email,
					from: process.env.GMB_EMAIL_ADRESS,
					subject: "Gorky Movie Blog password has been changed",
					text: `Dear ${user.username},<br>
					Please be informed, that your account pssword has been updated. Have a nice day!`
				};
				smtpTransport.sendMail(mailOptions, function (err) {
					console.log(`Password was updated for ${user.email}`);
					req.flash("flash-success", "Success! Your password has been changed.");
					res.redirect(`/users/${user._id}`);
					done(err);
				});
			}
		], function (err) {
			if (err) {
				return next(new AppError(
					500,
					`Something went wrong while updating your password. Try again later, or contact ${process.env.GMB_EMAIL_ADRESS}`,
					"/password-reset"
				));
			}
			next(res.redirect("/password-reset"));
		});
	},

	//*==============================================


	//==============================================
	// EDIT USER ACCOUNT INFO
	getUsersEditPage: function (req, res, next) {

		User.findById(req.params.id, function (err, editUser) {
			if (!editUser || err) {
				return next(new AppError(
					400,
					"Couldn't find user.",
					"/movies"
				));
			} else {
				if (editUser.avatar === process.env.DEFAULT_AVATAR) {
					editUser.avatar = "";
				}
				res.render("users/edit.ejs", { editUser: editUser });
			}
		});

	},

	updateUsersAccount: function (req, res, next) {
		if (req.body.user.avatar === "") {
			req.body.user.avatar = process.env.DEFAULT_AVATAR;
		}

		//Find and update required User account
		User.findByIdAndUpdate(req.params.id, req.body.user, function (err, foundUser) {
			if (!foundUser || err) {
				console.log("Error occured while updating user info", req.params.id, req.body.user, err.message);
				err.message = "Couldn't update user info.";
				checkIfUnique(err);
				return next(new AppError(
					400,
					err.message,
					`/users/${req.params.id}`
				));
			} else {
				res.redirect(`/users/${req.params.id}`);
			}

		});
	}
	//==============================================


}