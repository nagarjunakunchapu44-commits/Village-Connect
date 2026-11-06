const express = require("express");

const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
    GET /api/analytics

    Get analytics/statistics for the logged-in user's village.
*/
router.get(
    "/",
    authMiddleware,
    analyticsController.getAnalytics
);

module.exports = router;