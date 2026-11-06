const pool = require("../config/db");
const authMiddleware = require("./authMiddleware");

const contentCreatorMiddleware = [
    authMiddleware,

    async (req, res, next) => {
        try {
            const role = req.user.role;

            // Admins and village officials can create
            // events and polls for any village.
            if (role === "admin" || role === "official") {
                return next();
            }

            // Residents must have an approved volunteer
            // application before creating events or polls.
            const [volunteers] = await pool.execute(
                `SELECT id
                 FROM volunteers
                 WHERE user_id = ?
                   AND approved = 1
                 LIMIT 1`,
                [req.user.id]
            );

            if (volunteers.length === 0) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only approved volunteers, village officials, and admins can create events or polls."
                });
            }

            next();
        } catch (error) {
            console.error(
                "Content creator permission error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to verify your permissions."
            });
        }
    }
];

module.exports = contentCreatorMiddleware;