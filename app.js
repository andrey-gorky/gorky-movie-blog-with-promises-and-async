const express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	session = require("express-session"),
	dotenv = require("dotenv").config(),
	Movies = require("./models/movie"),
	Comments = require("./models/comments"),
	flash = require("connect-flash"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	passportLocalMongoose = require("passport-local-mongoose"),
	User = require("./models/user"),
	AppError = require("./AppErrors"),
	MongoDBStore = require("connect-mongo")(session);

const commentsRoutes = require("./routes/comments"),
	moviesRoutes = require("./routes/movies"),
	indexRoutes = require("./routes/index");

const dbUrl = process.env.DB_URL;

// Init DB
require("./initDB.js")();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(flash()); //must be placed before passport configuration

//require moment npm
app.locals.moment = require("moment"); //must be placed before passport

const secret = process.env.SESS_SECRET || "gorky.movie.blog.secret!"
//Express session===============================
const store = new MongoDBStore({
	url: dbUrl,
	secret,
	touchAfter: 24 * 60 * 60
});

store.on("error", function (err) {
	console.log("Session Store Error", err);
});

const sessionConfig = {
	store,
	name: "session",
	secret,
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		// secure: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
	// saveUninitialized: false
}
app.use(session(sessionConfig));

//Authentication part===============================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//add a user variable to every route
app.use(function (req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("flash-error");
	res.locals.success = req.flash("flash-success");
	next();
});
//==================================================


app.use(express.static(`${__dirname}/partials`));
app.use(express.static(`${__dirname}/public`));
app.use(methodOverride("_method"));


//Saying to the app what to put before routes adress in seperate Routes files
app.use(indexRoutes);
app.use("/movies", moviesRoutes);
app.use("/movies/:id/comments", commentsRoutes);


// =====================================================
// Error Handling

// app.use((req, res, next) => {
// 	return res.tatus(404).send("Page not found.")
// });

app.use((err, req, res, next) => {
	const {
		status = 500,
		message = "Something went wrong!",
		redirectRoute = "/"
	} = err;
	req.flash("flash-error", err.message);
	return res.status(status).redirect(err.redirectRoute);
});
// =====================================================

const port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Server is running on port " + port + "...");
});
