// ERROR Constructor
class AppError extends Error {
	constructor(status, message, redirectRoute) {
		super();
		this.status = status;
		this.message = message;
		this.redirectRoute = redirectRoute;
	}
}

module.exports = AppError;