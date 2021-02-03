// MONGOOSE CONNECTION
const mongoose = require("mongoose");
const dbUrl = "mongodb://localhost/gorky-movie-blog";
// "mongodb://localhost/gorky-movie-blog"
module.exports = function () {
	mongoose.set("runValidators", true);

	mongoose
		.connect(dbUrl, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true
		})
		.then(function () {
			console.log("MongoDB connected...");
		})
		.catch(function (err) {
			console.log(err.message, "(Mongoose didn't connected to MongoDB...)");
		});

	mongoose.connection.on("connected", function () {
		console.log("Mongoose connected to DB...");
	});

	mongoose.connection.on("error", function (err) {
		console.log(err.message);
	});

	mongoose.connection.on("disconnected", function (req, res) {
		console.log("Mongoose connection is disconnected...");
	});

	// Terminate mongoose connection when close app by "Ctrl + C"
	process.on("SIGINT", function () {
		mongoose.connection.close(function () {
			console.log("Mongoose connection is disconnected due to app termination...");
			process.exit(0);
		});
	});

}