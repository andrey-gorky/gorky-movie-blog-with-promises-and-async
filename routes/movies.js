const express = require("express");
const router = express.Router();
const middleware = require("../middleware"); //In the folder js file named index so it will be automatically used
const MoviesController = require("../Controllers/Movies.Controller")

//All MOVIES ROUTE
router.get("/", MoviesController.getAllMoviesPage);

//=============================================
//ADD NEW MOVIE ROUTES:
router.get("/search-new",
	middleware.isLoggedIn,
	MoviesController.getMoviesSearchNewPage
);

router.get("/new",
	middleware.isLoggedIn,
	MoviesController.getMoviesNewPage
);

router.post("/",
	middleware.isLoggedIn,
	MoviesController.createNewMovies
);
//=============================================

//SPECIFIC MOVIE SHOW PAGE ROUTE
router.get("/:id",
	MoviesController.getMoviesShowPage
);

//=============================================
//UPDATE ROUTES
router.get("/:id/edit",
	middleware.isLoggedIn,
	middleware.checkMovieOwnership,
	MoviesController.getMoviesEditPage
);

router.put("/:id",
	middleware.isLoggedIn,
	middleware.checkMovieOwnership,
	MoviesController.updateMovies
);
//=============================================


//DELETE or DESTROY ROUTE
router.delete("/:id",
	middleware.isLoggedIn,
	middleware.checkMovieOwnership,
	MoviesController.deleteMovies
);


module.exports = router;