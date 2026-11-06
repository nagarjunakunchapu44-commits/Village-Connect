const authMiddleware = require("./authMiddleware");

const adminOnlyMiddleware = [
    authMiddleware,
    (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only administrators can promote users."
            });
        }

        next();
    }
];

module.exports = adminOnlyMiddleware;