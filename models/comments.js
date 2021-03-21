const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const commentsSchema = new Schema({
	text: { type: String, trim: true },
	createdAt: { type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	}
});

module.exports = mongoose.model("Comments", commentsSchema);