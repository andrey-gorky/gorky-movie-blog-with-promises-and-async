const express = require("express");
const router = express.Router({ mergeParams: true });
const middleware = require("../middleware"); //In the folder js file named index so it will be automatically used
const CommentsController = require("../Controllers/Comments.Controller")

//==============================================
//*COMMENTS ROUTES NEW AND CREATE
router.get("/new",
	middleware.isLoggedIn,
	CommentsController.getCommentsNewPage
);

router.post("/",
	middleware.isLoggedIn,
	CommentsController.createNewComment
);
//==============================================

//==============================================
//UPDATE AND DESTROY COMMENTS ROUTES
//*EDIT COMMENT ROUTE
router.get("/:comment_id/edit",
	middleware.isLoggedIn,
	middleware.checkCommentOwnership,
	CommentsController.getCommentsEditPage
);

//*UPDATE ROUTE
router.put("/:comment_id",
	middleware.isLoggedIn,
	middleware.checkCommentOwnership,
	CommentsController.updateComments
);
//==============================================

//DESTROY ROUTE
router.delete("/:comment_id",
	middleware.isLoggedIn,
	middleware.checkCommentOwnership,
	CommentsController.deleteComments
);

module.exports = router;