
const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| Check admin access
|--------------------------------------------------------------------------
*/

function isAdmin(req) {
    return (
        String(req.user?.role || "")
            .trim()
            .toLowerCase() === "admin"
    );
}

/*
|--------------------------------------------------------------------------
| Get complaint map locations
|--------------------------------------------------------------------------
*/

exports.getComplaintLocations = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated."
            });
        }

        let query;
        let params = [];

        if (isAdmin(req)) {
            // Admin: complaints from all villages.

            query = `
                SELECT
                    c.id,
                    c.complaint_number,
                    c.user_id,
                    c.category,
                    c.severity,
                    c.area,
                    c.landmark,
                    c.description,
                    c.status,
                    c.priority_score,
                    c.likes_count,
                    c.latitude,
                    c.longitude,
                    c.geo_tagged,
                    c.office_id,
                    c.village_id,
                    v.name AS village_name,
                    c.created_at,
                    c.updated_at,
                    c.resolved_at
                FROM complaints c
                LEFT JOIN villages v
                    ON v.id = c.village_id
                WHERE c.latitude IS NOT NULL
                  AND c.longitude IS NOT NULL
                ORDER BY c.created_at DESC
            `;
        } else {
            // Every non-admin: complaints from their assigned village only.

            query = `
                SELECT
                    c.id,
                    c.complaint_number,
                    c.user_id,
                    c.category,
                    c.severity,
                    c.area,
                    c.landmark,
                    c.description,
                    c.status,
                    c.priority_score,
                    c.likes_count,
                    c.latitude,
                    c.longitude,
                    c.geo_tagged,
                    c.office_id,
                    c.village_id,
                    v.name AS village_name,
                    c.created_at,
                    c.updated_at,
                    c.resolved_at
                FROM complaints c
                INNER JOIN users u
                    ON u.id = ?
                LEFT JOIN villages v
                    ON v.id = c.village_id
                WHERE u.village_id IS NOT NULL
                  AND c.village_id = u.village_id
                  AND c.latitude IS NOT NULL
                  AND c.longitude IS NOT NULL
                ORDER BY c.created_at DESC
            `;

            params = [userId];
        }

        const [complaints] = await pool.execute(query, params);

        return res.status(200).json({
            success: true,
            complaints
        });

    } catch (error) {
        console.error(
            "Get complaint map locations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch complaint locations."
        });
    }
};

/*
|--------------------------------------------------------------------------
| Get village map locations
|--------------------------------------------------------------------------
*/

exports.getVillageLocations = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated."
            });
        }

        let query;
        let params = [];

        if (isAdmin(req)) {
            // Admin: all villages.

            query = `
                SELECT
                    id,
                    name,
                    district,
                    state,
                    latitude,
                    longitude,
                    created_at
                FROM villages
                ORDER BY name ASC
            `;
        } else {
            // Every non-admin: only their assigned village.

            query = `
                SELECT
                    v.id,
                    v.name,
                    v.district,
                    v.state,
                    v.latitude,
                    v.longitude,
                    v.created_at
                FROM users u
                INNER JOIN villages v
                    ON v.id = u.village_id
                WHERE u.id = ?
                  AND u.village_id IS NOT NULL
                LIMIT 1
            `;

            params = [userId];
        }

        const [villages] = await pool.execute(query, params);

        return res.status(200).json({
            success: true,
            villages
        });

    } catch (error) {
        console.error(
            "Get village map locations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch village locations."
        });
    }
};
