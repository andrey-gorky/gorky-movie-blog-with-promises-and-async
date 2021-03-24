const passport = require("passport");
const User = require("../models/user");
const Movies = require("../models/movie");
const Comments = require("../models/comments");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const AppError = require("../AppErrors");

const newUserData = request => {
	return new Promise((resolve, reject) => {
		let newUser = new User({
			username: request.body.username,
			firstName: request.body.firstName,
			lastName: request.body.lastName,
			email: request.body.email,
			avatar: request.body.avatar
		});
		if (newUser.avatar === "") { newUser.avatar = process.env.DEFAULT_AVATAR }
		resolve(newUser);
	});
}


const checkIfUnique = err => {
	return new Promise((resolve, reject) => {
		if (err.code === 11000) {
			let keyValue = Object.keys(err.keyValue).map(key => key).join(", ");
			err.message = `A user with the given '${keyValue}' already registered.`;
			resolve(err.messege);
		}
		resolve();
	});
}


module.exports = {

	//WELCOME PAGE
	getWelcomePage: (req, res) => res.render("landing.ejs"),

	//==============================================
	//*AUTHENTICATION

	//REGISTER ROUTES
	getRegisterPage: (req, res) => res.render("authentication/register.ejs"),

	registerUser: async (req, res, next) => {
		let newUser = await newUserData(req)
		User.register(newUser, req.body.password)
			.then(() => {
				passport.authenticate("local")
					(req, res, () => {
						req.flash("flash-success", `Welcome ${newUser.username}`);
						res.redirect("/movies");
					});
			})
			.catch(async (err) => {
				await checkIfUnique(err);
				return next(new AppError(
					401,
					err.message,
					"/register"
				));
			});

	},


	//LOGIN
	getLoginPage: (req, res) => {
		res.render("authentication/login.ejs");
	},

	authenticateUser: passport.authenticate("local", {
		successRedirect: "/movies",
		failureRedirect: "/login"
	}),


	//LOGOUT
	logoutUser: (req, res) => {
		req.logout();
		req.flash("flash-success", "Successfully logged out!");
		return res.redirect("/movies");
	},
	//==============================================


	//GET USER PROFILE PAGE
	getUsersProfilePage: async (req, res, next) => {
		let foundUser = undefined;
		let userMoviesfound = undefined;
		let userCommentsQty = undefined;

		try {

			await User
				.findById(req.params.id)
				.then(user => foundUser = user);

			await Movies
				.find()
				.where("author.id")
				.equals(foundUser._id)
				.then(movies => userMoviesfound = movies);

			await Comments
				.find()
				.where("author.id")
				.equals(foundUser._id)
				.then(comments => userCommentsQty = comments.length);

			res.render("users/show.ejs", {
				user: foundUser,
				userMovies: userMoviesfound,
				userMoviesQty: userMoviesfound.length,
				userCommentsQty: userCommentsQty
			});

		} catch (err) {
			return next(new AppError(
				400,
				"Unable to load user data.",
				"/movies"
			));
		}

	},


	//*==============================================
	//*PASSWORD RESET
	getPasswordResetPage: (req, res) => {
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
					You are receiveng this because you (or someone else) have requested the reset of the password for your account. To complete the password recovery process follow the link below.<br><br>
					http://${req.headers.host}/new-password/${token}<br><br>
					If you did not request password reset, please ignore this email and your password will remain unchanged.`
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

	getNewPasswordPage: async (req, res, next) => {
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