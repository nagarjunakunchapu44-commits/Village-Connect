
const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");

// Get events belonging to the user's village
// Admin can see all events
router.get("/", authMiddleware, eventController.getEvents);

// Create an event
router.post("/", authMiddleware, eventController.createEvent);

// Get one event by ID
router.get("/:id", authMiddleware, eventController.getEventById);

// Update an event
router.put("/:id", authMiddleware, eventController.updateEvent);

// Delete an event
router.delete("/:id", authMiddleware, eventController.deleteEvent);

// Register for an event
router.post("/:id/register", authMiddleware, eventController.registerForEvent);

// Cancel event registration
router.delete("/:id/register", authMiddleware, eventController.cancelRegistration);

// Get event participants
router.get("/:id/participants", authMiddleware, eventController.getParticipants);

module.exports = router;
