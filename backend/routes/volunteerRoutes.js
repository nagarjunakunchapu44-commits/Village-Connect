
const express = require("express");

const volunteerController = require("../controllers/volunteerController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Get volunteer applications
// Admin: all villages
// Sarpanch: own village
// Other officials and residents: blocked by controller
router.get(
    "/",
    authMiddleware,
    volunteerController.getVolunteers
);

// Get a specific volunteer application
// Access is checked inside the controller
router.get(
    "/:id",
    authMiddleware,
    volunteerController.getVolunteerById
);

// Resident volunteer registration
router.post(
    "/",
    authMiddleware,
    volunteerController.createVolunteer
);

// Approve or reject a volunteer application
// adminMiddleware must allow admin and official roles.
// Controller applies the additional Sarpanch and village checks.
router.put(
    "/:id/approval",
    adminMiddleware,
    volunteerController.updateVolunteerApproval
);

// Delete a volunteer application
// Controller applies the additional Sarpanch and village checks.
router.delete(
    "/:id",
    adminMiddleware,
    volunteerController.deleteVolunteer
);

module.exports = router;
