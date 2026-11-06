const express = require("express");

const chatController =
    require("../controllers/chatController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Village Community Chat
|--------------------------------------------------------------------------
*/

/*
GET messages from logged-in user's village
*/
router.get(
    "/",
    authMiddleware,
    chatController.getMessages
);

/*
Send message to logged-in user's village
*/
router.post(
    "/",
    authMiddleware,
    chatController.sendMessage
);

/*
Delete own message
*/
router.delete(
    "/:id",
    authMiddleware,
    chatController.deleteMessage
);

module.exports = router;