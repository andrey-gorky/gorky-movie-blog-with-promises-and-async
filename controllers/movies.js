const Movies = require("../models/movie");
const request = require("request");
const AppError = require("../AppErrors");

const checkIfUnique = (err, newData) => {
	return new Promise((resolve, reject) => {
		if (err.code === 11000) {
			var keyValue = Object.keys(err.keyValue).map(key => key).join(", ");
			err.message = `Movie with the given ${keyValue} already exists.`;
		}
		resolve();
	});
}

let extractIMDBid = queryUrl => {

	return new Promise((resolve, reject) => {
		if (queryUrl === undefined || queryUrl.includes("imdb.com/title/tt") === false) {
			reject("dasd");
		}
		// Taking IMDB movie ID from inserted link
		let imdbId = queryUrl;
		imdbId = imdbId.split("imdb.com/title/")[1].split("/")[0];
		if (imdbId.length > 10) {
			reject("dasd");
		}
		resolve(`http://www.omdbapi.com/?i=${imdbId}&plot=full&apikey=${process.env.OMDB_API_KEY}`);
	});

}

// Object.entries(foundMovie).forEach(movie => { console.log(movie.author.id) });

module.exports = {

	//GET ALL MOVIES PAGE
	getAllMoviesPage: async (req, res, next) => {
		//GET DATA FROM THE DB
		try {
			const allMovies = await Movies.find({});
			res.render("movies/movies.ejs", { moviesEjs: allMovies });
			next();
		} catch (err) {
			console.log("Couldn't find Movies. Route: '/movies'");
			return next(new AppError(
				500,
				"Couldn't find Movies. Please, try again later or contact the Administration via gorky.movie.blog@gmail.com.",
				"/"
			));
		}
	},

	//ADD NEW MOVIE USING OMDB API
	getMoviesSearchNewPage: (req, res) => {
		res.render("movies/search-new.ejs");
	},

	getMoviesNewPage: async (req, res, next) => {
		let url;
		try {
			url = await extractIMDBid(req.query.search)
		} catch (e) {
			return next(new AppError(
				400,
				"Please, enter a valid movie url with relevant movie ID from IMDB. For example 'imdb.com/title/tt000000/'.",
				"/movies/search-new"
			));
		}

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				let movieData = JSON.parse(body);
				if (movieData["Title"] == undefined) {
					console.log("Bad response from OMDB. movieData == undefined. Route: '/movies/new' ", error.message);
					return next(new AppError(
						400,
						"Couldn't receive information from IMDB. Try another link or contact the Administration.",
						"/movies/search-new"
					));
				}
				res.render("movies/new.ejs", { movieData: movieData });
			} else {
				console.log("Bad request to OMDB. Route: '/movies/new'");
				return next(new AppError(
					400,
					"Couldn't receive information from IMDB. Try another link or contact the Administration.",
					"/movies/search-new"
				));
			}
		});

		// request(url, function (error, response, body) {
		// 	if (!error && response.statusCode == 200) {
		// 		let movieData = JSON.parse(body);
		// 		if (movieData["Title"] == undefined) {
		// 			console.log("Bad response from OMDB. movieData == undefined. Route: '/movies/new' ", error.message);
		// 			return next(new AppError(
		// 				400,
		// 				"Couldn't receive information from IMDB. Try another link or contact the Administration.",
		// 				"/movies/search-new"
		// 			));
		// 		}
		// 		res.render("movies/new.ejs", { movieData: movieData });
		// 	} else {
		// 		console.log("Bad request to OMDB. Route: '/movies/new'");
		// 		return next(new AppError(
		// 			400,
		// 			"Couldn't receive information from IMDB. Try another link or contact the Administration.",
		// 			"/movies/search-new"
		// 		));
		// 	}
		// });

	},

	// POST NEW MOVIE INTO DB
	createNewMovies: function (req, res, next) {
		//Get data from the form and add it to the Movies DB
		let newMovie = req.body.newMovie
		newMovie.imdbLink = "https://www.imdb.com/title/" + req.body.newMovie.imdbID;
		newMovie.cast = newMovie.cast + ", etc.";
		newMovie.author = {
			id: req.user._id,
			username: req.user.username
		}

		// CREATE NEW MOVIE AND SAVE INTO DB
		Movies.create(newMovie, function (err, movie) {
			if (err) {
				checkIfUnique(err, newMovie);
				return next(new AppError(
					400,
					err.message,
					"/movies/search-new"
				));
			} else {
				//Redirect back to the /movies page
				req.flash("flash-success", "Your movie was added.");
				res.redirect("/movies");
			}
		});
	},


	//GET SPECIFIC MOVIE SHOW PAGE
	getMoviesShowPage: function (req, res, next) {
		//DISCOVER MOVIE BY THE ID
		Movies
			.findById(req.params.id)
			.populate({
				path: "comments",
				model: "Comments",
				populate: {
					path: "author.id",
					model: "User"
				}
			})
			.populate({
				path: "author.id",
				model: "User"
			})
			.exec(function (err, foundMovie) {
				if (!foundMovie || err) {
					return next(new AppError(
						400,
						err.message,
						"/movies"
					));
				} else {
					res.render("movies/show.ejs", { movieShow: foundMovie });
				}
			});
	},

	//UPDATE ROUTES
	getMoviesEditPage: function (req, res, next) {

		Movies.findById(req.params.id, function (err, editMovie) {

			if (!editMovie || err) {
				return next(new AppError(
					400,
					"Could not render movie edit page. Try again later or contact the Administration",
					"/movies"
				));
			} else {
				res.render("movies/edit.ejs", { editMovie: editMovie });
			}

		});

	},

	updateMovies: function (req, res, next) {
		//Find and update required Movie
		Movies.findByIdAndUpdate(req.params.id, req.body.movie, function (err, editMovie) {

			if (!editMovie || err) {
				checkIfUnique(err, editMovie);
				return next(new AppError(
					400,
					err.message,
					"/movies/" + req.params.id
				));
			} else {
				req.flash("flash-success", "Movie info updated.");
				res.redirect("/movies/" + req.params.id);
			}

		});
	},

	deleteMovies: function (req, res, next) {
		Movies.findByIdAndRemove(req.params.id, function (err, deleteMovie) {

			if (!deleteMovie || err) {
				return next(new AppError(
					400,
					err.message,
					"/movies"
				));
			} else {
				res.redirect("/movies");
			}

		});
	}

};