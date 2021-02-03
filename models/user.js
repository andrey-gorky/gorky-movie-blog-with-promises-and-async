const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


const UserSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true, trim: true },
	password: String,
	avatar: { type: String },
	firstName: { type: String, trim: true },
	lastName: { type: String, trim: true },
	email: { type: String, unique: true, required: true, trim: true },
	createdAt: { type: Date, default: Date.now },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: { type: Boolean, default: false }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);