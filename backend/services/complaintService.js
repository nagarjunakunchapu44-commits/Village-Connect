const db = require("../config/db");

/*
    Create a new complaint
*/
exports.createComplaint = async (complaintData) => {
    const {
        complaint_number,
        user_id,
        village_id,
        office_id,
        category,
        severity,
        area,
        landmark,
        description,
        latitude,
        longitude,
        geo_tagged,
        status,
        priority_score
    } = complaintData;

    const [result] = await db.execute(
        `INSERT INTO complaints
        (
            complaint_number,
            user_id,
            village_id,
            office_id,
            category,
            severity,
            area,
            landmark,
            description,
            latitude,
            longitude,
            geo_tagged,
            status,
            priority_score
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            complaint_number,
            user_id,
            village_id || null,
            office_id || null,
            category,
            severity,
            area,
            landmark || null,
            description,
            latitude || null,
            longitude || null,
            geo_tagged || 0,
            status || "Pending",
            priority_score || 0
        ]
    );

    return result.insertId;
};


/*
    Get complaint by ID
*/
exports.getComplaintById = async (complaintId) => {
    const [rows] = await db.execute(
        `SELECT
            id,
            complaint_number,
            user_id,
            village_id,
            office_id,
            category,
            severity,
            area,
            landmark,
            description,
            latitude,
            longitude,
            geo_tagged,
            status,
            priority_score,
            likes_count,
            created_at,
            updated_at,
            resolved_at
         FROM complaints
         WHERE id = ?`,
        [complaintId]
    );

    return rows.length > 0
        ? rows[0]
        : null;
};


/*
    Update complaint status
*/
exports.updateComplaintStatus = async (
    complaintId,
    status
) => {
    let query;
    let params;

    if (status === "Resolved") {
        query = `
            UPDATE complaints
            SET
                status = ?,
                resolved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        params = [
            status,
            complaintId
        ];
    } else {
        query = `
            UPDATE complaints
            SET
                status = ?,
                resolved_at = NULL
            WHERE id = ?
        `;

        params = [
            status,
            complaintId
        ];
    }

    const [result] =
        await db.execute(
            query,
            params
        );

    return result.affectedRows > 0;
};


/*
    Assign complaint to an office
*/
exports.assignComplaintOffice = async (
    complaintId,
    officeId
) => {
    const [result] =
        await db.execute(
            `UPDATE complaints
             SET office_id = ?
             WHERE id = ?`,
            [
                officeId,
                complaintId
            ]
        );

    return result.affectedRows > 0;
};


/*
    Get complaints belonging to a user
*/
exports.getUserComplaints = async (
    userId
) => {
    const [rows] =
        await db.execute(
            `SELECT
                id,
                complaint_number,
                user_id,
                village_id,
                office_id,
                category,
                severity,
                area,
                landmark,
                description,
                latitude,
                longitude,
                geo_tagged,
                status,
                priority_score,
                likes_count,
                created_at,
                updated_at,
                resolved_at
             FROM complaints
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

    return rows;
};


/*
    Get all complaints
*/
exports.getAllComplaints =
    async () => {
        const [rows] =
            await db.execute(
                `SELECT
                    id,
                    complaint_number,
                    user_id,
                    village_id,
                    office_id,
                    category,
                    severity,
                    area,
                    landmark,
                    description,
                    latitude,
                    longitude,
                    geo_tagged,
                    status,
                    priority_score,
                    likes_count,
                    created_at,
                    updated_at,
                    resolved_at
                 FROM complaints
                 ORDER BY created_at DESC`
            );

        return rows;
    };


/*
    Calculate priority score
    based on complaint severity
*/
exports.calculatePriorityScore = (
    severity
) => {
    const scores = {
        Low: 1,
        Medium: 2,
        High: 3,
        Severe: 4
    };

    return scores[severity] || 0;
};


/*
    Check whether GPS coordinates
    are available for a complaint
*/
exports.isGeoTagged = (
    latitude,
    longitude
) => {
    return (
        latitude !== null &&
        latitude !== undefined &&
        longitude !== null &&
        longitude !== undefined
    );
};