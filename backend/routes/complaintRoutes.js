const express = require("express");

const complaintController = require("../controllers/complaintController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

/*
    POST /api/complaints
    Create a complaint

    Authentication:
    Resident must be logged in.

    Photo:
    Optional single image upload.
*/
router.post(
    "/",
    authMiddleware,
    upload.single("photo"),
    complaintController.createComplaint
);

/*
    GET /api/complaints/my
    Get complaints belonging to the logged-in resident's village
*/
router.get(
    "/my",
    authMiddleware,
    complaintController.getMyComplaints
);

/*
    GET /api/complaints/all
    Get complaints for administrative users
*/
router.get(
    "/all",
    adminMiddleware,
    complaintController.getAllComplaints
);

/*
    PUT /api/complaints/:id/assign
    Assign complaint to an office/official
*/
router.put(
    "/:id/assign",
    adminMiddleware,
    complaintController.assignComplaint
);

/*
    PUT /api/complaints/:id/status
    Update complaint status
*/
router.put(
    "/:id/status",
    adminMiddleware,
    complaintController.updateComplaintStatus
);

/*
    GET /api/complaints/:id/history
    Get complaint status history
*/
router.get(
    "/:id/history",
    authMiddleware,
    complaintController.getComplaintHistory
);

/*
    GET /api/complaints/:id
    Get complaint details
*/
router.get(
    "/:id",
    authMiddleware,
    complaintController.getComplaintById
);

module.exports = router;