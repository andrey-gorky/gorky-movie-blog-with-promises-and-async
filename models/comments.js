const mongoose = require("mongoose");


const commentsSchema = mongoose.Schema({
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