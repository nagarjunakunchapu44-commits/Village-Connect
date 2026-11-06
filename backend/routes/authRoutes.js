const express = require("express");

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
    POST /api/auth/register
    Register a new resident
*/
router.post(
    "/register",
    authController.register
);

/*
    POST /api/auth/login
    Login using mobile number and password
*/
router.post(
    "/login",
    authController.login
);

/*
    GET /api/auth/me
    Get currently logged-in user's information
*/
router.get(
    "/me",
    authMiddleware,
    authController.getMe
);

module.exports = router;