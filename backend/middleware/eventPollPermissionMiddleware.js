const pool = require("../config/db");
const authMiddleware = require("./authMiddleware");

const OFFICIAL_OCCUPATIONS = [
    "sarpanch",
    "mpp",
    "zph",
    "vro"
];

const eventPollOrganizerMiddleware = [
    authMiddleware,

    async (req, res, next) => {
        try {
            const userId = req.user.id;

            const [rows] = await pool.execute(
                `
                SELECT
                    u.id,
                    u.role,
                    u.occupation,
                    u.village_id,
                    EXISTS (
                        SELECT 1
                        FROM volunteers v
                        WHERE v.user_id = u.id
                    ) AS is_volunteer
                FROM users u
                WHERE u.id = ?
                LIMIT 1
                `,
                [userId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User account not found."
                });
            }

            const user = rows[0];

            const role = String(
                user.role || ""
            ).trim().toLowerCase();

            const occupation = String(
                user.occupation || ""
            ).trim().toLowerCase();

            const isAdmin = role === "admin";

            const isOfficial =
                role === "official" ||
                OFFICIAL_OCCUPATIONS.includes(occupation);

            const isVolunteer =
                Number(user.is_volunteer) === 1;

            if (
                !isAdmin &&
                !isOfficial &&
                !isVolunteer
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Only registered volunteers, village officials and admins can create or manage events and polls."
                });
            }

            if (!isAdmin && !user.village_id) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Your account is not linked to a village."
                });
            }

            /*
             * Admins can select a village.
             *
             * Volunteers and village officials
             * can only create content for their
             * own registered village.
             */

            if (isAdmin) {
                req.user.role = "admin";
            } else {
                req.user.role = "resident";
                req.body.village_id = user.village_id;
            }

            req.user.village_id = user.village_id;

            next();

        } catch (error) {
            console.error(
                "Event and poll permission error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to verify event and poll permissions."
            });
        }
    }
];

module.exports = {
    eventPollOrganizerMiddleware
};