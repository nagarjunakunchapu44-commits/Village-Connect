const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing."
            });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error("JWT_SECRET is not configured in .env");

            return res.status(500).json({
                success: false,
                message: "Server authentication configuration is missing."
            });
        }

        const decoded = jwt.verify(token, jwtSecret);

        req.user = decoded;

        next();
    } catch (error) {
        console.error("Authentication error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Authentication token has expired. Please login again."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        return res.status(401).json({
            success: false,
            message: "Authentication failed."
        });
    }
};

module.exports = authMiddleware;