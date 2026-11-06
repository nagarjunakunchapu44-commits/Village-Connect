const bcrypt = require("bcryptjs");

const pool = require("../config/db");

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.mobile,
                u.email,
                u.village_id,
                v.name AS village_name,
                u.occupation,
                u.role,
                u.status,
                u.created_at
             FROM users u
             LEFT JOIN villages v
                ON v.id = u.village_id
             WHERE u.id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error("Get my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile.",
            error: error.message
        });
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            name,
            email,
            occupation,
            password
        } = req.body;

        const updates = [];
        const values = [];

        if (name !== undefined) {
            const cleanName = String(name).trim();

            if (!cleanName) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty."
                });
            }

            updates.push("name = ?");
            values.push(cleanName);
        }

        if (email !== undefined) {
            const cleanEmail = String(email).trim();

            if (cleanEmail) {
                const [existingEmail] = await pool.execute(
                    `SELECT id
                     FROM users
                     WHERE email = ?
                       AND id <> ?
                     LIMIT 1`,
                    [cleanEmail, userId]
                );

                if (existingEmail.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "This email is already registered."
                    });
                }

                updates.push("email = ?");
                values.push(cleanEmail);
            } else {
                updates.push("email = NULL");
            }
        }

        if (occupation !== undefined) {
            const cleanOccupation = String(occupation).trim();

            if (cleanOccupation) {
                updates.push("occupation = ?");
                values.push(cleanOccupation);
            } else {
                updates.push("occupation = NULL");
            }
        }

        if (password !== undefined) {
            if (String(password).length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must contain at least 6 characters."
                });
            }

            const passwordHash = await bcrypt.hash(
                String(password),
                10
            );

            updates.push("password_hash = ?");
            values.push(passwordHash);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No profile information was provided to update."
            });
        }

        values.push(userId);

        await pool.execute(
            `UPDATE users
             SET ${updates.join(", ")}
             WHERE id = ?`,
            values
        );

        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.mobile,
                u.email,
                u.village_id,
                v.name AS village_name,
                u.occupation,
                u.role,
                u.status,
                u.created_at
             FROM users u
             LEFT JOIN villages v
                ON v.id = u.village_id
             WHERE u.id = ?
             LIMIT 1`,
            [userId]
        );

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            user: users[0]
        });
    } catch (error) {
        console.error("Update my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile.",
            error: error.message
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.mobile,
                u.email,
                u.village_id,
                v.name AS village_name,
                u.occupation,
                u.role,
                u.status,
                u.created_at
             FROM users u
             LEFT JOIN villages v
                ON v.id = u.village_id
             ORDER BY u.id DESC`
        );

        return res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch users.",
            error: error.message
        });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.mobile,
                u.email,
                u.village_id,
                v.name AS village_name,
                u.occupation,
                u.role,
                u.status,
                u.created_at
             FROM users u
             LEFT JOIN villages v
                ON v.id = u.village_id
             WHERE u.id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error("Get user by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch user.",
            error: error.message
        });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active or inactive."
            });
        }

        const [users] = await pool.execute(
            `SELECT id, role
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (users[0].role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts cannot be deactivated here."
            });
        }

        await pool.execute(
            `UPDATE users
             SET status = ?
             WHERE id = ?`,
            [status, userId]
        );

        return res.json({
            success: true,
            message: `User ${status} successfully.`
        });
    } catch (error) {
        console.error("Update user status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update user status.",
            error: error.message
        });
    }
};
exports.promoteUserToOfficial = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        const [users] = await pool.execute(
            `SELECT id, name, occupation, role
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const user = users[0];

        if (user.role !== "resident") {
            return res.status(400).json({
                success: false,
                message: "Only resident accounts can be promoted."
            });
        }

        const officialOccupations = [
            "sarpanch",
            "mpp",
            "zph",
            "vro"
        ];

        const occupation = String(
            user.occupation || ""
        ).trim().toLowerCase();

        if (!officialOccupations.includes(occupation)) {
            return res.status(400).json({
                success: false,
                message:
                    "Only users with Sarpanch, MPP, ZPH or VRO occupation can be promoted."
            });
        }

        await pool.execute(
            `UPDATE users
             SET role = 'official'
             WHERE id = ?
               AND role = 'resident'`,
            [userId]
        );

        return res.json({
            success: true,
            message: `${user.name} has been promoted to official successfully.`
        });

    } catch (error) {
        console.error("Promote user error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to promote user.",
            error: error.message
        });
    }
};