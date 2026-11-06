const express = require("express");

const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    notificationController.getNotifications
);

router.put(
    "/:id/read",
    authMiddleware,
    notificationController.markAsRead
);

router.put(
    "/read-all",
    authMiddleware,
    notificationController.markAllAsRead
);

router.delete(
    "/:id",
    authMiddleware,
    notificationController.deleteNotification
);

module.exports = router;