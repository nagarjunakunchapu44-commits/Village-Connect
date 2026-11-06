
const pool = require("../config/db");

// Get the village linked to the logged-in user.
async function getUserVillageId(userId) {
    const [rows] = await pool.execute(
        `SELECT village_id
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
    );

    return rows.length ? rows[0].village_id : null;
}

// Only an actual admin can access all villages.
function isAdmin(req) {
    return String(req.user.role || "").toLowerCase() === "admin";
}

// GET /api/chat
// Admin: may select any village.
// Everyone else: sees only their own village.
exports.getMessages = async (req, res) => {
    try {
        let villageId;

        if (isAdmin(req)) {
            if (req.query.village_id) {
                villageId = Number(req.query.village_id);

                if (!Number.isInteger(villageId) || villageId <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid village ID."
                    });
                }
            } else {
                const [villages] = await pool.execute(
                    `SELECT id, name, district, state
                     FROM villages
                     ORDER BY name ASC`
                );

                return res.json({
                    success: true,
                    villages,
                    village_id: null,
                    messages: []
                });
            }
        } else {
            villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(400).json({
                    success: false,
                    message: "Your account is not associated with a village."
                });
            }

            // Ignore any village_id supplied by a non-admin.
            villageId = Number(villageId);
        }

        const [villages] = await pool.execute(
            `SELECT id
             FROM villages
             WHERE id = ?
             LIMIT 1`,
            [villageId]
        );

        if (!villages.length) {
            return res.status(404).json({
                success: false,
                message: "Village not found."
            });
        }

        const [messages] = await pool.execute(
            `SELECT
                cm.id,
                cm.village_id,
                cm.user_id,
                cm.message,
                cm.created_at,
                u.name AS user_name,
                u.mobile,
                u.status AS user_status,
                u.occupation
             FROM chat_messages cm
             INNER JOIN users u
                ON u.id = cm.user_id
             WHERE cm.village_id = ?
             ORDER BY cm.created_at ASC`,
            [villageId]
        );

        return res.json({
            success: true,
            village_id: villageId,
            messages
        });
    } catch (error) {
        console.error("Get chat messages error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch village chat messages."
        });
    }
};

// POST /api/chat
// All non-admin users can send messages only to their own village.
// Admin may choose a village.
exports.sendMessage = async (req, res) => {
    try {
        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty."
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message cannot exceed 1000 characters."
            });
        }

        let villageId;

        if (isAdmin(req)) {
            villageId = Number(req.body.village_id);

            if (!Number.isInteger(villageId) || villageId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Please select a valid village."
                });
            }
        } else {
            villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(400).json({
                    success: false,
                    message: "Your account is not associated with a village."
                });
            }

            villageId = Number(villageId);
        }

        const [villageRows] = await pool.execute(
            `SELECT id
             FROM villages
             WHERE id = ?
             LIMIT 1`,
            [villageId]
        );

        if (!villageRows.length) {
            return res.status(404).json({
                success: false,
                message: "Village not found."
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO chat_messages
                (village_id, user_id, message)
             VALUES (?, ?, ?)`,
            [villageId, req.user.id, message]
        );

        const [rows] = await pool.execute(
            `SELECT
                cm.id,
                cm.village_id,
                cm.user_id,
                cm.message,
                cm.created_at,
                u.name AS user_name,
                u.mobile,
                u.status AS user_status,
                u.occupation
             FROM chat_messages cm
             INNER JOIN users u
                ON u.id = cm.user_id
             WHERE cm.id = ?
             LIMIT 1`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Message sent successfully.",
            chat_message: rows[0]
        });
    } catch (error) {
        console.error("Send chat message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send message."
        });
    }
};

// DELETE /api/chat/:id
// Users can delete only their own messages.
// A non-admin must also belong to the message's village.
exports.deleteMessage = async (req, res) => {
    try {
        const messageId = Number(req.params.id);

        if (!Number.isInteger(messageId) || messageId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid message ID."
            });
        }

        let query = `
            DELETE FROM chat_messages
            WHERE id = ?
              AND user_id = ?
        `;

        const params = [messageId, req.user.id];

        if (!isAdmin(req)) {
            const villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(400).json({
                    success: false,
                    message: "Your account is not associated with a village."
                });
            }

            query += ` AND village_id = ?`;
            params.push(villageId);
        }

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Message not found or you are not allowed to delete it."
            });
        }

        return res.json({
            success: true,
            message: "Message deleted successfully."
        });
    } catch (error) {
        console.error("Delete chat message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete message."
        });
    }
};
