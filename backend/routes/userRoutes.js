const express = require("express");
const adminOnlyMiddleware = require("../middleware/adminOnlyMiddleware");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

/*
    GET /api/users/me

    Get the currently logged-in user's profile.
*/
router.get(
    "/me",
    authMiddleware,
    userController.getMyProfile
);

/*
    PUT /api/users/me

    Update the currently logged-in user's profile.
*/
router.put(
    "/me",
    authMiddleware,
    userController.updateMyProfile
);

/*
    GET /api/users

    Admin/official access to view users.
*/
router.get(
    "/",
    adminMiddleware,
    userController.getUsers
);

/*
    GET /api/users/:id

    Admin/official access to view a specific user.
*/
router.get(
    "/:id",
    adminMiddleware,
    userController.getUserById
);

/*
    PUT /api/users/:id/status

    Admin/official can activate/deactivate a user.
*/
router.put(
    "/:id/status",
    adminMiddleware,
    userController.updateUserStatus
);
/*
    PUT /api/users/:id/promote-official

    Admin-only: promote a resident to official.
*/
router.put(
    "/:id/promote-official",
    adminOnlyMiddleware,
    userController.promoteUserToOfficial
);

module.exports = router;