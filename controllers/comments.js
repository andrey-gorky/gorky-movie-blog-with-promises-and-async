const Movies = require("../models/movie");
const Comments = require("../models/comments");
const AppError = require("../AppErrors");

module.exports = {

	//==============================================
	//*COMMENTS PAGES NEW AND CREATE
	getCommentsNewPage: function (req, res, next) {
		Movies.findById(req.params.id, function (err, foundMovie) {
			if (!foundMovie || err) {
				console.log(err);
				return next(new AppError(
					400,
					"Couldn't find movie to create comment for it.",
					"/movies"
				));
			} else {
				res.render("comments/new.ejs", { movieShow: foundMovie });
			}
		});
	},

	createNewComment: function (req, res, next) {
		//* Find movie with an id
		Movies.findById(req.params.id, function (err, foundMovie) {
			if (!foundMovie || err) {
				return next(new AppError(
					400,
					"Couldn't find movie to create comment for it.",
					"/movies"
				));
			} else {
				// create new comment
				// bound new comment with the movie
				var newComment = req.body.comment;
				Comments.create(newComment, function (err, comment) {
					if (err) {
						console.log(err);
						return next(new AppError(
							500,
							"Couldn't create a comment.",
							"/movies/" + foundMovie._id
						));
					} else {
						//add username and ID to the comment
						comment.author.id = req.user._id;
						comment.author.username = req.user.username;
						//save the comment
						comment.save();
						foundMovie.comments.push(comment);
						foundMovie.save();
						req.flash("flash-success", "Comment created.");
						// redirect to the page of required movie
						res.redirect("/movies/" + foundMovie._id);
					}
				});
			}
		});

	},
	//==============================================

	//==============================================
	//*EDIT and UPDATE COMMENT
	getCommentsEditPage: function (req, res, next) {
		Comments.findById(req.params.comment_id, function (err, foundComment) {
			if (!foundComment || err) {
				return next(new AppError(
					400,
					"Couldn't find movie.",
					"back"
				));
			} else {
				res.render("comments/edit.ejs", { movie_id: req.params.id, comment: foundComment });
			}
		});
	},

	updateComments: function (req, res, next) {
		Comments.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, editComment) {
			if (!editComment || err) {
				console.log(err);
				return next(new AppError(
					500,
					"Couldn't update the comment.",
					"back"
				));
			} else {
				req.flash("flash-success", "Comment updated");
				res.redirect("/movies/" + req.params.id);
			}
		});
	},
	//==============================================

	//DELETE COMMENT
	deleteComments: function (req, res, next) {
		Comments.findByIdAndRemove(req.params.comment_id, function (err, deleteComment) {
			if (!deleteComment || err) {
				console.log(err);
				return next(new AppError(
					400,
					"Couldn't find comment to be deleted :)",
					"/movies"
				));
			} else {
				req.flash("flash-success", "Comment deleted");
				res.redirect("/movies/" + req.params.id);
			}
		});
	}

}