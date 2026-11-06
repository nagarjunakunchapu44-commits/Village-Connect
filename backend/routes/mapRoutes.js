
const express = require("express");

const mapController = require("../controllers/mapController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/complaints",
    authMiddleware,
    mapController.getComplaintLocations
);

router.get(
    "/villages",
    authMiddleware,
    mapController.getVillageLocations
);

module.exports = router;
