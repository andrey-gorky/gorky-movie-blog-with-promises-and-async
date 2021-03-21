const Movies = require("../models/movie");
const AppError = require("../AppErrors");
const axios = require("axios");

const checkIfUnique = (err, newData) => {
	return new Promise((resolve, reject) => {
		if (err.code === 11000) {
			var keyValue = Object.keys(err.keyValue).map(key => key).join(", ");
			err.message = `Movie with the given ${keyValue} already exists.`;
		}
		resolve();
	});
}

const extractIMDBid = queryUrl => {
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

const newMovieData = request => {
	// Get data from the form and add it to the Movies' DB
	return new Promise((resolve, reject) => {
		let newMovie = request.body.newMovie
		newMovie.imdbLink = `https://www.imdb.com/title/${request.body.newMovie.imdbID}`;
		newMovie.cast = `${newMovie.cast}, etc.`;
		newMovie.author = {
			id: request.user._id,
			username: request.user.username
		}
		resolve(newMovie);
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

		let url = undefined;
		try {
			url = await extractIMDBid(req.query.search)
		} catch (e) {
			return next(new AppError(
				400,
				"Please, enter a valid movie url with relevant movie ID from IMDB. For example 'imdb.com/title/tt000000/'.",
				"/movies/search-new"
			));
		}

		try {
			const movieData = await axios.get(url);
			res.render("movies/new.ejs", { movieData: movieData.data });
		} catch (e) {
			return next(new AppError(
				400,
				"Couldn't receive information from IMDB. Try another link or contact the Administration.",
				"/movies/search-new"
			));
		}

	},

	// POST NEW MOVIE INTO DB
	createNewMovies: async (req, res, next) => {
		//Get data from the form and add it to the Movies DB
		const newMovie = await newMovieData(req);

		// CREATE NEW MOVIE AND SAVE INTO DB
		await Movies.create(newMovie, err => {
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
	getMoviesEditPage: async (req, res, next) => {

		const movie = await Movies.findById(req.params.id)

		if (!movie) {
			return next(new AppError(
				400,
				"Could not find that movie",
				"/movies"
			));
		}

		res.render("movies/edit.ejs", { editMovie: movie });
	},

	updateMovies: async (req, res, next) => {
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

	deleteMovies: async (req, res, next) => {
		await Movies.findByIdAndDelete(req.params.id);
		req.flash("flash-success", "Movie successfully deleted");
		res.redirect("/movies");
	}

};