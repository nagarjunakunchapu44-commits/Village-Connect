const express = require("express");

const router = express.Router();

const villageController =
    require("../controllers/villageController");

const villageOfficialController =
    require("../controllers/villageOfficialController");

const authMiddleware =
    require("../middleware/authMiddleware");

const adminMiddleware =
    require("../middleware/adminMiddleware");

/*
|--------------------------------------------------------------------------
| Public villages
|--------------------------------------------------------------------------
*/

router.get(
    "/public",
    villageController.getPublicVillages
);

/*
|--------------------------------------------------------------------------
| Village officials
|
| IMPORTANT:
| This route must come BEFORE /:id.
|--------------------------------------------------------------------------
*/

router.get(
    "/officials",
    authMiddleware,
    villageOfficialController.getVillageOfficials
);

/*
|--------------------------------------------------------------------------
| Villages
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authMiddleware,
    villageController.getVillages
);

router.get(
    "/:id",
    authMiddleware,
    villageController.getVillageById
);

router.post(
    "/",
    adminMiddleware,
    villageController.createVillage
);

router.put(
    "/:id",
    adminMiddleware,
    villageController.updateVillage
);

module.exports = router;