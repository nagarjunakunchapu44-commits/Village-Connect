
const pool = require("../config/db");

function isAdmin(req) {
    return req.user && req.user.role === "admin";
}

async function getSarpanchVillageId(userId) {
    const [users] = await pool.execute(
        `SELECT village_id
         FROM users
         WHERE id = ?
           AND role = 'official'
           AND LOWER(TRIM(occupation)) = 'sarpanch'
         LIMIT 1`,
        [userId]
    );

    return users.length ? users[0].village_id : null;
}

async function getVolunteerByUserId(userId) {
    const [rows] = await pool.execute(
        `SELECT v.*, vl.name AS village_name
         FROM volunteers v
         LEFT JOIN villages vl ON vl.id = v.village_id
         WHERE v.user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
}

// Residents see their own application.
// Sarpanch sees applications from their village.
// Admin sees applications from all villages.
exports.getVolunteers = async (req, res) => {
    try {
        let query = `
            SELECT v.id, v.user_id, v.village_id,
                   v.skills, v.availability, v.approved,
                   v.status, v.created_at,
                   u.name AS user_name, u.mobile, u.email,
                   u.occupation, vl.name AS village_name
            FROM volunteers v
            INNER JOIN users u ON u.id = v.user_id
            LEFT JOIN villages vl ON vl.id = v.village_id
        `;

        const params = [];

        if (isAdmin(req)) {
            // Admin sees all applications.
        } else if (req.user.role === "resident") {
            query += ` WHERE v.user_id = ?`;
            params.push(req.user.id);
        } else if (req.user.role === "official") {
            const villageId = await getSarpanchVillageId(req.user.id);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Only a Sarpanch can manage volunteer applications."
                });
            }

            query += ` WHERE v.village_id = ?`;
            params.push(villageId);
        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        query += ` ORDER BY v.created_at DESC`;

        const [volunteers] = await pool.execute(query, params);

        res.json({ success: true, volunteers });
    } catch (error) {
        console.error("Get volunteers error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch volunteers."
        });
    }
};

// Get one application
exports.getVolunteerById = async (req, res) => {
    try {
        const volunteerId = Number(req.params.id);

        if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid volunteer ID."
            });
        }

        const [rows] = await pool.execute(
            `SELECT v.*, u.name AS user_name,
                    u.mobile, u.email, u.occupation,
                    vl.name AS village_name
             FROM volunteers v
             INNER JOIN users u ON u.id = v.user_id
             LEFT JOIN villages vl ON vl.id = v.village_id
             WHERE v.id = ?
             LIMIT 1`,
            [volunteerId]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Volunteer application not found."
            });
        }

        const volunteer = rows[0];

        if (isAdmin(req)) {
            return res.json({ success: true, volunteer });
        }

        if (req.user.role === "resident") {
            if (Number(volunteer.user_id) !== Number(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: "You can only view your own application."
                });
            }

            return res.json({ success: true, volunteer });
        }

        if (req.user.role === "official") {
            const villageId = await getSarpanchVillageId(req.user.id);

            if (
                !villageId ||
                Number(volunteer.village_id) !== Number(villageId)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot access applications from another village."
                });
            }

            return res.json({ success: true, volunteer });
        }

        return res.status(403).json({
            success: false,
            message: "Access denied."
        });
    } catch (error) {
        console.error("Get volunteer error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch application."
        });
    }
};

// Resident submits an application.
exports.createVolunteer = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "resident") {
            return res.status(403).json({
                success: false,
                message: "Only residents can register as volunteers."
            });
        }

        const userId = req.user.id;
        const skills = String(req.body.skills || "").trim();
        const availability = String(req.body.availability || "").trim();

        if (!skills) {
            return res.status(400).json({
                success: false,
                message: "Please enter your skills."
            });
        }

        const [users] = await pool.execute(
            `SELECT village_id FROM users WHERE id = ? LIMIT 1`,
            [userId]
        );

        if (!users.length || !users[0].village_id) {
            return res.status(400).json({
                success: false,
                message: "Your account is not linked to a village."
            });
        }

        const villageId = users[0].village_id;

        const [existing] = await pool.execute(
            `SELECT id FROM volunteers WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted a volunteer application."
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO volunteers
             (user_id, village_id, skills, availability, approved, status)
             VALUES (?, ?, ?, ?, 0, 'pending')`,
            [userId, villageId, skills, availability]
        );

        res.status(201).json({
            success: true,
            message: "Volunteer application submitted successfully.",
            volunteer: {
                id: result.insertId,
                user_id: userId,
                village_id: villageId,
                skills,
                availability,
                approved: 0,
                status: "pending"
            }
        });
    } catch (error) {
        console.error("Create volunteer error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to submit volunteer application."
        });
    }
};

// Sarpanch or admin approves/rejects an application.
exports.updateVolunteerApproval = async (req, res) => {
    try {
        const volunteerId = Number(req.params.id);
        const status = String(req.body.status || "").toLowerCase();

        if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid volunteer ID."
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved or rejected."
            });
        }

        let query = `
            UPDATE volunteers
            SET status = ?, approved = ?
            WHERE id = ?
        `;

        const params = [status, status === "approved" ? 1 : 0, volunteerId];

        if (!isAdmin(req)) {
            if (req.user.role !== "official") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied."
                });
            }

            const villageId = await getSarpanchVillageId(req.user.id);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Only a Sarpanch can manage applications."
                });
            }

            query += ` AND village_id = ?`;
            params.push(villageId);
        }

        const [result] = await pool.execute(query, params);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Application not found in your village."
            });
        }

        res.json({
            success: true,
            message: `Application ${status} successfully.`
        });
    } catch (error) {
        console.error("Update volunteer status error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update application."
        });
    }
};

// Admin or Sarpanch deletes an application.
exports.deleteVolunteer = async (req, res) => {
    try {
        const volunteerId = Number(req.params.id);

        if (!Number.isInteger(volunteerId) || volunteerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid volunteer ID."
            });
        }

        let query = `DELETE FROM volunteers WHERE id = ?`;
        const params = [volunteerId];

        if (!isAdmin(req)) {
            if (req.user.role !== "official") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied."
                });
            }

            const villageId = await getSarpanchVillageId(req.user.id);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Only a Sarpanch can manage applications."
                });
            }

            query += ` AND village_id = ?`;
            params.push(villageId);
        }

        const [result] = await pool.execute(query, params);

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Application not found in your village."
            });
        }

        res.json({
            success: true,
            message: "Volunteer application deleted successfully."
        });
    } catch (error) {
        console.error("Delete volunteer error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to delete application."
        });
    }
};
