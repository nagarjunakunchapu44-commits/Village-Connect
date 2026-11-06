
const pool = require("../config/db");

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function isAdmin(req) {
    return String(req.user?.role || "").toLowerCase() === "admin";
}

function validId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function cleanPhone(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    return String(value).trim();
}

// --------------------------------------------------
// Get offices
// Admin: all village-specific offices
// Other users: assigned village offices only
// --------------------------------------------------

exports.getOffices = async (req, res) => {
    try {
        let offices;

        if (isAdmin(req)) {
            [offices] = await pool.execute(
                `SELECT
                    id,
                    name,
                    office_type,
                    latitude,
                    longitude,
                    village_id,
                    contact_phone,
                    created_at
                 FROM offices
                 WHERE village_id IS NOT NULL
                 ORDER BY village_id, office_type`
            );
        } else {
            const [users] = await pool.execute(
                `SELECT village_id
                 FROM users
                 WHERE id = ?
                 LIMIT 1`,
                [req.user.id]
            );

            if (
                users.length === 0 ||
                users[0].village_id === null
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to a village."
                });
            }

            [offices] = await pool.execute(
                `SELECT
                    id,
                    name,
                    office_type,
                    latitude,
                    longitude,
                    village_id,
                    contact_phone,
                    created_at
                 FROM offices
                 WHERE village_id = ?
                 ORDER BY office_type`,
                [users[0].village_id]
            );
        }

        return res.json({
            success: true,
            offices
        });

    } catch (error) {
        console.error("Get offices error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch offices."
        });
    }
};

// --------------------------------------------------
// Get one office
// Admin: any village-specific office
// Other users: assigned village offices only
// --------------------------------------------------

exports.getOfficeById = async (req, res) => {
    try {
        const officeId = validId(req.params.id);

        if (!officeId) {
            return res.status(400).json({
                success: false,
                message: "Invalid office ID."
            });
        }

        let offices;

        if (isAdmin(req)) {
            [offices] = await pool.execute(
                `SELECT
                    id,
                    name,
                    office_type,
                    latitude,
                    longitude,
                    village_id,
                    contact_phone,
                    created_at
                 FROM offices
                 WHERE id = ?
                   AND village_id IS NOT NULL
                 LIMIT 1`,
                [officeId]
            );
        } else {
            const [users] = await pool.execute(
                `SELECT village_id
                 FROM users
                 WHERE id = ?
                 LIMIT 1`,
                [req.user.id]
            );

            if (
                users.length === 0 ||
                users[0].village_id === null
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to a village."
                });
            }

            [offices] = await pool.execute(
                `SELECT
                    id,
                    name,
                    office_type,
                    latitude,
                    longitude,
                    village_id,
                    contact_phone,
                    created_at
                 FROM offices
                 WHERE id = ?
                   AND village_id = ?
                 LIMIT 1`,
                [officeId, users[0].village_id]
            );
        }

        if (offices.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Office not found."
            });
        }

        return res.json({
            success: true,
            office: offices[0]
        });

    } catch (error) {
        console.error("Get office by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch office."
        });
    }
};

// --------------------------------------------------
// Create office
// Admin only (enforced by officeRoutes.js)
// --------------------------------------------------

exports.createOffice = async (req, res) => {
    try {
        const {
            name,
            office_type,
            latitude,
            longitude,
            village_id,
            contact_phone
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Office name is required."
            });
        }

        const cleanName = String(name).trim();

        const cleanType = office_type
            ? String(office_type).trim()
            : null;

        const phone = cleanPhone(contact_phone);

        if (phone && phone.length > 15) {
            return res.status(400).json({
                success: false,
                message: "Phone number cannot exceed 15 characters."
            });
        }

        const lat =
            latitude === undefined ||
            latitude === null ||
            latitude === ""
                ? null
                : Number(latitude);

        const lng =
            longitude === undefined ||
            longitude === null ||
            longitude === ""
                ? null
                : Number(longitude);

        if (
            lat !== null &&
            (!Number.isFinite(lat) || lat < -90 || lat > 90)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid latitude."
            });
        }

        if (
            lng !== null &&
            (!Number.isFinite(lng) || lng < -180 || lng > 180)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid longitude."
            });
        }

        const villageId =
            village_id === undefined ||
            village_id === null ||
            village_id === ""
                ? null
                : validId(village_id);

        if (village_id && villageId === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid village ID."
            });
        }

        // New offices must belong to a village.
        if (villageId === null) {
            return res.status(400).json({
                success: false,
                message: "A village must be selected for the office."
            });
        }

        const [villages] = await pool.execute(
            `SELECT id FROM villages WHERE id = ? LIMIT 1`,
            [villageId]
        );

        if (villages.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Village not found."
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO offices
                (
                    name,
                    office_type,
                    latitude,
                    longitude,
                    village_id,
                    contact_phone
                )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                cleanName,
                cleanType,
                lat,
                lng,
                villageId,
                phone
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Office created successfully.",
            office: {
                id: result.insertId,
                name: cleanName,
                office_type: cleanType,
                latitude: lat,
                longitude: lng,
                village_id: villageId,
                contact_phone: phone
            }
        });

    } catch (error) {
        console.error("Create office error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create office."
        });
    }
};

// --------------------------------------------------
// Update office
// Admin only (enforced by officeRoutes.js)
// Updates a specific office ID only.
// --------------------------------------------------

exports.updateOffice = async (req, res) => {
    try {
        const officeId = validId(req.params.id);

        if (!officeId) {
            return res.status(400).json({
                success: false,
                message: "Invalid office ID."
            });
        }

        const {
            name,
            office_type,
            latitude,
            longitude,
            village_id,
            contact_phone
        } = req.body;

        // Check that the office exists and belongs to a village.
        const [existing] = await pool.execute(
            `SELECT id, village_id
             FROM offices
             WHERE id = ?
               AND village_id IS NOT NULL
             LIMIT 1`,
            [officeId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Village office not found."
            });
        }

        const updates = [];
        const values = [];

        if (name !== undefined) {
            const cleanName = String(name).trim();

            if (!cleanName) {
                return res.status(400).json({
                    success: false,
                    message: "Office name cannot be empty."
                });
            }

            updates.push("name = ?");
            values.push(cleanName);
        }

        if (office_type !== undefined) {
            updates.push("office_type = ?");
            values.push(String(office_type).trim() || null);
        }

        if (latitude !== undefined) {
            const lat =
                latitude === null || latitude === ""
                    ? null
                    : Number(latitude);

            if (
                lat !== null &&
                (!Number.isFinite(lat) || lat < -90 || lat > 90)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid latitude."
                });
            }

            updates.push("latitude = ?");
            values.push(lat);
        }

        if (longitude !== undefined) {
            const lng =
                longitude === null || longitude === ""
                    ? null
                    : Number(longitude);

            if (
                lng !== null &&
                (!Number.isFinite(lng) || lng < -180 || lng > 180)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid longitude."
                });
            }

            updates.push("longitude = ?");
            values.push(lng);
        }

        if (village_id !== undefined) {
            const villageId =
                village_id === null || village_id === ""
                    ? null
                    : validId(village_id);

            if (villageId === null) {
                return res.status(400).json({
                    success: false,
                    message: "Office must belong to a valid village."
                });
            }

            const [villages] = await pool.execute(
                `SELECT id FROM villages WHERE id = ? LIMIT 1`,
                [villageId]
            );

            if (villages.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Village not found."
                });
            }

            updates.push("village_id = ?");
            values.push(villageId);
        }

        if (contact_phone !== undefined) {
            const phone = cleanPhone(contact_phone);

            if (phone && phone.length > 15) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number cannot exceed 15 characters."
                });
            }

            updates.push("contact_phone = ?");
            values.push(phone);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No office information was provided to update."
            });
        }

        values.push(officeId);

        const [result] = await pool.execute(
            `UPDATE offices
             SET ${updates.join(", ")}
             WHERE id = ?
               AND village_id IS NOT NULL`,
            values
        );

        const [updated] = await pool.execute(
            `SELECT
                id,
                name,
                office_type,
                latitude,
                longitude,
                village_id,
                contact_phone,
                created_at
             FROM offices
             WHERE id = ?
             LIMIT 1`,
            [officeId]
        );

        if (updated.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Office not found."
            });
        }

        return res.json({
            success: true,
            message: "Office updated successfully.",
            office: updated[0]
        });

    } catch (error) {
        console.error("Update office error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update office."
        });
    }
};

// --------------------------------------------------
// Delete office
// Admin only (enforced by officeRoutes.js)
// --------------------------------------------------

exports.deleteOffice = async (req, res) => {
    try {
        const officeId = validId(req.params.id);

        if (!officeId) {
            return res.status(400).json({
                success: false,
                message: "Invalid office ID."
            });
        }

        const [result] = await pool.execute(
            `DELETE FROM offices
             WHERE id = ?
               AND village_id IS NOT NULL`,
            [officeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Village office not found."
            });
        }

        return res.json({
            success: true,
            message: "Office deleted successfully."
        });

    } catch (error) {
        console.error("Delete office error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete office."
        });
    }
};
