const Movies = require("../models/movie");
const Comments = require("../models/comments");
const User = require("../models/user");
const AppError = require("../AppErrors");

//All middleware
const middlewareObj = {};

middlewareObj.checkMovieOwnership = function (req, res, next) {
	//does user logged in? (for some reason it is better not to use isLoggedIn middleware here)
	if (req.isAuthenticated()) {
		Movies.findById(req.params.id, function (err, editMovie) {
			if (!editMovie) {
				// req.flash("flash-error", "Movie not found.");
				// res.redirect("/movies");
				return next(new AppError(
					404,
					"Movie not found.",
					"/movies"
				));
			} else {
				//does user own the movie?
				if (editMovie.author.id.equals(req.user._id) || req.user.isAdmin) {
					/* mongoose method, authot and user id are compared in that way because 
					editMovie.author.id.equals is a mongoose Object, and the req.user._id is a String*/
					return next();
				} else {
					//redirect if wrong user id
					return next(new AppError(
						403,
						"You do not have a permission!",
						"/movies/" + req.params.id
					));
				}
			}
		});
	} else {
		return next(new AppError(
			401,
			"Have to Login first.",
			"/login"
		));
	}
}



middlewareObj.checkCommentOwnership = function (req, res, next) {
	//Check if the User is logged in
	if (req.isAuthenticated()) {

		Comments.findById(req.params.comment_id, function (err, foundComment) {
			if (!foundComment) {
				return next(new AppError(
					404,
					"Comment not found.",
					"/movies"
				));
			} else {
				//does User own the Comment?
				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
					/* mongoose method, authot and user id are compared in that way because 
					editMovie.author.id.equals is a mongoose Object, and the req.user._id is a String*/
					return next()
				} else {
					return next(new AppError(
						403,
						"You do not have a permission!",
						"/movies/" + req.params.id
					));
				}
			}
		});
	} else {
		return next(new AppError(
			401,
			"Have to Login first.",
			"/login"
		));
	}
}

middlewareObj.checkUserOwnership = function (req, res, next) {
	//does user logged in? (for some reason it is better not to use isLoggedIn middleware here)
	if (req.isAuthenticated()) {
		User.findById(req.params.id, function (err, editUser) {
			if (!editUser) {
				return next(new AppError(
					404,
					"User not found.",
					"/movies"
				));
			} else {
				//does user own the user account?
				if (editUser._id.equals(req.user._id) || req.user.isAdmin) {
					/* mongoose method, user account and current user id are compared in that way because 
					editUser._id.equals is a mongoose Object, and the req.user._id is a String*/
					return next();
				} else {
					return next(new AppError(
						403,
						"You do not have a permission!",
						"/movies"
					));
				}
				//redirect if wrong user id
			}
		});
	} else {
		//redirect if not logged in
		return next(new AppError(
			401,
			"Have to Login first.",
			"/login"
		));
	}
}


middlewareObj.isLoggedIn = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		return next(new AppError(
			401,
			"Have to Login first.",
			"/login"
		));
	}
}


module.exports = middlewareObj;