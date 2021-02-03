const mongoose = require("mongoose");

//SCHEAM SETUP
var movieSchema = mongoose.Schema({
	title: { type: String, unique: true, required: true, trim: true },
	year: { type: String, required: true, trim: true },
	genre: { type: String },
	director: { type: String },
	writer: { type: String },
	cast: { type: String },
	poster: { type: String, unique: true, required: true, trim: true },
	plot: { type: String, required: true, trim: true },
	imdbRating: { type: String, trim: true, trim: true },
	imdbLink: { type: String, unique: true, },
	createdAt: { type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: { type: String, trim: true }
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comments"
		}
	]
});

module.exports = mongoose.model("Movies", movieSchema);


