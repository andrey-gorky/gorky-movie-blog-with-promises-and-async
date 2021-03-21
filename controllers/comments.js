const Movies = require("../models/movie");
const Comments = require("../models/comments");
const AppError = require("../AppErrors");

module.exports = {

	//==============================================
	//*COMMENTS PAGES NEW AND CREATE
	getCommentsNewPage: async (req, res, next) => {
		const foundMovie = await Movies.findById(req.params.id);
		if (!foundMovie) {
			return next(new AppError(
				400,
				"Bad request.",
				"/movies"
			));
		}
		res.render("comments/new.ejs", { movieShow: foundMovie });
	},

	createNewComment: async (req, res, next) => {
		try {
			// Find relevant movie by id
			const movie = await Movies.findById(req.params.id);
			const newComment = new Comments(req.body.comment);
			//add username and  username ID to the comment
			newComment.author.id = req.user._id;
			newComment.author.username = req.user.username;
			//save to the comment and movie models 
			movie.comments.push(newComment);
			await newComment.save();
			await movie.save();
			// redirect to the page of required movie with success message
			req.flash("flash-success", "Comment created.");
			res.redirect(`/movies/${movie._id}`);
		} catch (err) {
			if (err) {
				return next(new AppError(
					400,
					"Cannot create new comment. Probably bad request",
					"back"
				));
			}
		}
	},
	//==============================================

	//==============================================
	//*EDIT and UPDATE COMMENT
	getCommentsEditPage: async (req, res, next) => {
		const foundComment = await Comments.findById(req.params.comment_id);
		if (!foundComment) {
			return next(new AppError(
				400,
				"Cannot find comment.",
				"back"
			));
		}
		res.render("comments/edit.ejs", { movie_id: req.params.id, comment: foundComment });
	},

	updateComments: async (req, res, next) => {
		try {
			const comment = await Comments.findByIdAndUpdate(req.params.comment_id, req.body.comment);
			await comment.save();
			req.flash("flash-success", "Comment updated");
			res.redirect(`/movies/${req.params.id}`);
		} catch (err) {
			if (err) {
				return next(new AppError(
					400,
					"Cannot update the comment.",
					"back"
				));
			}
		}
	},
	//==============================================

	//DELETE COMMENT
	deleteComments: async (req, res, next) => {
		try {
			const movieId = req.params.id;
			const commentId = req.params.comment_id;
			await Comments.findByIdAndDelete(commentId);

			// Remove current comment_id mentioning from the movie
			await Movies.findByIdAndUpdate(movieId, { $pull: { comments: commentId } });
			req.flash("flash-success", "Comment deleted");
			res.redirect(`/movies/${movieId}`);
		} catch (err) {
			return next(new AppError(
				400,
				"Cannot delete a comment",
				"/movies"
			));
		}

	}

}