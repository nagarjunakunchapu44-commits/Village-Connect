
const express = require("express");

const officeController = require("../controllers/officeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Admin-only protection for office changes.
function requireAdmin(req, res, next) {
    if (String(req.user?.role || "").toLowerCase() !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Only administrators can manage offices."
        });
    }

    next();
}

// All authenticated users can view offices they are allowed to access.
router.get("/", authMiddleware, officeController.getOffices);
router.get("/:id", authMiddleware, officeController.getOfficeById);

// Only admins can create, update or delete offices.
router.post("/", authMiddleware, requireAdmin, officeController.createOffice);
router.put("/:id", authMiddleware, requireAdmin, officeController.updateOffice);
router.delete("/:id", authMiddleware, requireAdmin, officeController.deleteOffice);

module.exports = router;
