
const express = require("express");

const pollController = require("../controllers/pollController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const contentCreatorMiddleware = require("../middleware/contentCreatorMiddleware");

const router = express.Router();

// Get polls
router.get(
    "/",
    authMiddleware,
    pollController.getPolls
);

// Get one poll
router.get(
    "/:id",
    authMiddleware,
    pollController.getPollById
);

// Create polls:
// Admins, village officials, and approved volunteers
router.post(
    "/",
    contentCreatorMiddleware,
    pollController.createPoll
);

// Update polls: admins and village officials
router.put(
    "/:id",
    adminMiddleware,
    pollController.updatePoll
);

// Delete polls: admins and village officials
router.delete(
    "/:id",
    adminMiddleware,
    pollController.deletePoll
);

// Vote in a poll
router.post(
    "/:id/vote",
    authMiddleware,
    pollController.votePoll
);

// Get the logged-in user's vote
router.get(
    "/:id/my-vote",
    authMiddleware,
    pollController.getMyVote
);

module.exports = router;
