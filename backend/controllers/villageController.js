
const pool = require("../config/db");

// --------------------------------------------------
// DEFAULT VILLAGE OFFICES
// --------------------------------------------------

const DEFAULT_OFFICES = [
    {
        name: "Village Panchayat Office",
        office_type: "Panchayat"
    },
    {
        name: "Mandal Revenue Office",
        office_type: "Revenue"
    },
    {
        name: "Municipal Zonal Office",
        office_type: "Municipal"
    }
];

// --------------------------------------------------
// ENSURE DEFAULT OFFICES EXIST FOR A VILLAGE
// --------------------------------------------------

async function ensureVillageOffices(villageId) {

    for (const office of DEFAULT_OFFICES) {

        const [existing] = await pool.execute(
            `SELECT id
             FROM offices
             WHERE village_id = ?
               AND office_type = ?
             LIMIT 1`,
            [villageId, office.office_type]
        );

        if (existing.length === 0) {

            await pool.execute(
                `INSERT INTO offices
                    (name, office_type, village_id, contact_phone)
                 VALUES (?, ?, ?, ?)`,
                [
                    office.name,
                    office.office_type,
                    villageId,
                    null
                ]
            );

            console.log(
                `Created ${office.name} for village ID ${villageId}`
            );
        }
    }
}

// --------------------------------------------------
// NOMINATIM CONFIGURATION
// --------------------------------------------------

const NOMINATIM_URL =
    "https://nominatim.openstreetmap.org/search";

const NOMINATIM_USER_AGENT =
    "VillageConnect/1.0 (Village information application)";

let lastNominatimRequest = 0;

let geocodingQueue = Promise.resolve();

const failedLookups = new Map();

const FAILED_LOOKUP_COOLDOWN = 60 * 60 * 1000;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Public Nominatim usage: maximum one request per second.

function queueGeocoding(task) {

    const next = geocodingQueue.then(async () => {

        const elapsed =
            Date.now() - lastNominatimRequest;

        const remaining = 1100 - elapsed;

        if (remaining > 0) {
            await wait(remaining);
        }

        lastNominatimRequest = Date.now();

        return task();
    });

    geocodingQueue = next.catch(() => {});

    return next;
}

// --------------------------------------------------
// FIND VILLAGE LOCATION USING NOMINATIM
// --------------------------------------------------

async function findVillageLocation(villageName) {

    const cacheKey =
        String(villageName).trim().toLowerCase();

    const failedAt = failedLookups.get(cacheKey);

    if (
        failedAt &&
        Date.now() - failedAt < FAILED_LOOKUP_COOLDOWN
    ) {
        return null;
    }

    return queueGeocoding(async () => {

        const searchUrl = new URL(NOMINATIM_URL);

        searchUrl.searchParams.set(
            "q",
            `${villageName}, Andhra Pradesh, India`
        );

        searchUrl.searchParams.set("format", "jsonv2");
        searchUrl.searchParams.set("addressdetails", "1");
        searchUrl.searchParams.set("namedetails", "1");
        searchUrl.searchParams.set("limit", "10");
        searchUrl.searchParams.set("countrycodes", "in");

        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent": NOMINATIM_USER_AGENT
            }
        });

        if (!response.ok) {
            throw new Error(
                `Nominatim lookup failed with status ${response.status}`
            );
        }

        const results = await response.json();

        if (!Array.isArray(results) || results.length === 0) {

            failedLookups.set(cacheKey, Date.now());

            return null;
        }

        const expectedName = cacheKey;

        const match = results.find(result => {

            const address = result.address || {};

            const namedetails = result.namedetails || {};

            const state = String(
                address.state || ""
            ).trim().toLowerCase();

            const countryCode = String(
                address.country_code || ""
            ).trim().toLowerCase();

            const localityNames = [
                address.village,
                address.hamlet,
                address.town,
                address.city,
                address.suburb,
                address.locality,
                address.municipality,
                namedetails.name
            ]
                .filter(Boolean)
                .map(value =>
                    String(value).trim().toLowerCase()
                );

            return (
                countryCode === "in" &&
                state === "andhra pradesh" &&
                localityNames.includes(expectedName)
            );
        });

        if (!match) {

            failedLookups.set(cacheKey, Date.now());

            return null;
        }

        const address = match.address || {};

        const latitude = Number(match.lat);

        const longitude = Number(match.lon);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < 12 ||
            latitude > 20 ||
            longitude < 76 ||
            longitude > 86
        ) {

            failedLookups.set(cacheKey, Date.now());

            return null;
        }

        failedLookups.delete(cacheKey);

        return {
            district:
                address.state_district ||
                address.district ||
                address.county ||
                null,

            state: address.state || "Andhra Pradesh",

            latitude,

            longitude
        };
    });
}

// --------------------------------------------------
// COMPLETE MISSING VILLAGE DETAILS
// --------------------------------------------------

async function completeVillageDetails(village) {

    const needsLookup =
        !village.district ||
        !village.state ||
        village.latitude === null ||
        village.latitude === undefined ||
        village.longitude === null ||
        village.longitude === undefined;

    if (!needsLookup) {
        return village;
    }

    try {

        const location =
            await findVillageLocation(village.name);

        if (!location) {

            console.log(
                `No exact Nominatim location match found for: ${village.name}`
            );

            return village;
        }

        const district =
            village.district || location.district;

        const state =
            village.state || location.state;

        const latitude =
            village.latitude ?? location.latitude;

        const longitude =
            village.longitude ?? location.longitude;

        await pool.execute(
            `UPDATE villages
             SET district = ?,
                 state = ?,
                 latitude = ?,
                 longitude = ?
             WHERE id = ?`,
            [
                district,
                state,
                latitude,
                longitude,
                village.id
            ]
        );

        Object.assign(village, {
            district,
            state,
            latitude,
            longitude
        });

        console.log(
            `Village details saved: ${village.name}`
        );

        return village;

    } catch (error) {

        console.error(
            `Nominatim lookup error for ${village.name}:`,
            error.message
        );

        return village;
    }
}

// --------------------------------------------------
// GET PUBLIC VILLAGES
// --------------------------------------------------

exports.getPublicVillages = async (req, res) => {

    try {

        const [villages] = await pool.execute(
            `SELECT
                id,
                name,
                district,
                state
             FROM villages
             ORDER BY name ASC`
        );

        return res.json({
            success: true,
            villages
        });

    } catch (error) {

        console.error("Get public villages error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch villages.",
            error: error.message
        });
    }
};

// --------------------------------------------------
// GET VILLAGES
// Admin: all villages
// Every other role: assigned village only
// --------------------------------------------------

exports.getVillages = async (req, res) => {

    try {

        const isAdmin =
            String(req.user?.role || "").toLowerCase() === "admin";

        if (isAdmin) {

            const [villages] = await pool.execute(
                `SELECT
                    v.id,
                    v.name,
                    v.district,
                    v.state,
                    v.latitude,
                    v.longitude,
                    v.created_at,

                    (
                        SELECT COUNT(*)
                        FROM users u
                        WHERE u.village_id = v.id
                    ) AS total_residents,

                    (
                        SELECT COUNT(*)
                        FROM complaints c
                        WHERE c.village_id = v.id
                    ) AS total_complaints,

                    (
                        SELECT COUNT(*)
                        FROM complaints c
                        WHERE c.village_id = v.id
                          AND c.status = 'Resolved'
                    ) AS resolved_complaints

                 FROM villages v
                 ORDER BY v.name ASC`
            );

            return res.json({
                success: true,
                villages
            });
        }

        const [villages] = await pool.execute(
            `SELECT
                v.id,
                v.name,
                v.district,
                v.state,
                v.latitude,
                v.longitude,
                v.created_at,

                (
                    SELECT COUNT(*)
                    FROM users u2
                    WHERE u2.village_id = v.id
                ) AS total_residents,

                (
                    SELECT COUNT(*)
                    FROM complaints c
                    WHERE c.village_id = v.id
                ) AS total_complaints,

                (
                    SELECT COUNT(*)
                    FROM complaints c
                    WHERE c.village_id = v.id
                      AND c.status = 'Resolved'
                ) AS resolved_complaints

             FROM villages v
             INNER JOIN users u
                ON u.village_id = v.id
             WHERE u.id = ?
             LIMIT 1`,
            [req.user.id]
        );

        return res.json({
            success: true,
            villages
        });

    } catch (error) {

        console.error("Get villages error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch villages.",
            error: error.message
        });
    }
};

// --------------------------------------------------
// GET ONE VILLAGE
// Admin: any village
// Every other role: assigned village only
// --------------------------------------------------


exports.getVillageById = async (req, res) => {
    try {
        const villageId = Number(req.params.id);

        if (!Number.isInteger(villageId) || villageId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid village ID."
            });
        }

        const role = String(req.user?.role || "").toLowerCase();
        const isAdmin = role === "admin";

        // Admin can access any village.
        // Officials and residents can access only their registered village.
        if (!isAdmin) {
            const [access] = await pool.execute(
                `SELECT id
                 FROM users
                 WHERE id = ?
                   AND village_id = ?
                 LIMIT 1`,
                [req.user.id, villageId]
            );

            if (access.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You can access only your registered village."
                });
            }
        }

        // Fetch village information.
        const [villages] = await pool.execute(
            `SELECT
                id,
                name,
                district,
                state,
                latitude,
                longitude,
                created_at
             FROM villages
             WHERE id = ?
             LIMIT 1`,
            [villageId]
        );

        if (villages.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Village not found."
            });
        }

        const village = await completeVillageDetails(villages[0]);

        // Ensure default offices exist.
        await ensureVillageOffices(villageId);

        // Overall complaint statistics.
        const [complaintStats] = await pool.execute(
            `SELECT
                COUNT(*) AS total_complaints,

                COALESCE(SUM(
                    CASE WHEN LOWER(TRIM(status)) = 'resolved'
                    THEN 1 ELSE 0 END
                ), 0) AS resolved_complaints,

                COALESCE(SUM(
                    CASE WHEN LOWER(TRIM(status)) = 'pending'
                    THEN 1 ELSE 0 END
                ), 0) AS pending_complaints,

                COALESCE(SUM(
                    CASE WHEN LOWER(TRIM(status)) = 'in progress'
                    THEN 1 ELSE 0 END
                ), 0) AS in_progress_complaints,

                COALESCE(SUM(
                    CASE WHEN LOWER(TRIM(status)) = 'forwarded'
                    THEN 1 ELSE 0 END
                ), 0) AS forwarded_complaints

             FROM complaints
             WHERE village_id = ?`,
            [villageId]
        );

        // Complaints grouped by status.
        const [statusStats] = await pool.execute(
            `SELECT
                TRIM(status) AS status,
                COUNT(*) AS count
             FROM complaints
             WHERE village_id = ?
             GROUP BY TRIM(status)
             ORDER BY TRIM(status)`,
            [villageId]
        );

        // Complaints grouped by category.
        const [categoryStats] = await pool.execute(
            `SELECT
                COALESCE(NULLIF(TRIM(category), ''), 'Other') AS category,
                COUNT(*) AS count
             FROM complaints
             WHERE village_id = ?
             GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'Other')
             ORDER BY count DESC`,
            [villageId]
        );

        // Recent complaints.
        const [recentComplaints] = await pool.execute(
            `SELECT
                id,
                complaint_number,
                category,
                severity,
                area,
                landmark,
                description,
                status,
                created_at
             FROM complaints
             WHERE village_id = ?
             ORDER BY created_at DESC
             LIMIT 5`,
            [villageId]
        );

        // Village offices.
        const [offices] = await pool.execute(
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
            [villageId]
        );

        // Volunteer statistics.
        const [volunteerStats] = await pool.execute(
            `SELECT
                COUNT(*) AS total_volunteers,
                COALESCE(SUM(
                    CASE WHEN approved = 1 THEN 1 ELSE 0 END
                ), 0) AS approved_volunteers
             FROM volunteers
             WHERE village_id = ?`,
            [villageId]
        );

        // Event statistics.
        const [eventStats] = await pool.execute(
            `SELECT COUNT(*) AS total_events
             FROM events
             WHERE village_id = ?`,
            [villageId]
        );

        // Count users registered in this village.
        const [residentCount] = await pool.execute(
            `SELECT COUNT(*) AS total_residents
             FROM users
             WHERE village_id = ?`,
            [villageId]
        );

        // Convert database values into JavaScript numbers.
        const totalComplaints = Number(
            complaintStats[0]?.total_complaints || 0
        );

        const resolvedComplaints = Number(
            complaintStats[0]?.resolved_complaints || 0
        );

        const pendingComplaints = Number(
            complaintStats[0]?.pending_complaints || 0
        );

        const inProgressComplaints = Number(
            complaintStats[0]?.in_progress_complaints || 0
        );

        const forwardedComplaints = Number(
            complaintStats[0]?.forwarded_complaints || 0
        );

        const totalResidents = Number(
            residentCount[0]?.total_residents || 0
        );

        // Return all village details and analytics.
        return res.json({
            success: true,

            village: {
                ...village,

                total_residents: totalResidents,

                statistics: {
                    total_complaints: totalComplaints,
                    resolved_complaints: resolvedComplaints,
                    pending_complaints: pendingComplaints,
                    in_progress_complaints: inProgressComplaints,
                    forwarded_complaints: forwardedComplaints,

                    total_volunteers: Number(
                        volunteerStats[0]?.total_volunteers || 0
                    ),

                    approved_volunteers: Number(
                        volunteerStats[0]?.approved_volunteers || 0
                    ),

                    total_events: Number(
                        eventStats[0]?.total_events || 0
                    )
                }
            },

            // Analytics page reads these fields.
            statistics: {
                total_complaints: totalComplaints,
                total_residents: totalResidents,

                status: statusStats.map(item => ({
                    status: item.status,
                    count: Number(item.count || 0)
                })),

                categories: categoryStats.map(item => ({
                    category: item.category,
                    count: Number(item.count || 0)
                }))
            },

            // Retained for pages that need the recent complaint list.
            recent_complaints: recentComplaints,

            offices
        });

    } catch (error) {
        console.error("Get village by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch village.",
            error: error.message
        });
    }
};


// --------------------------------------------------
// CREATE VILLAGE
// Automatically create three default offices.
// --------------------------------------------------

exports.createVillage = async (req, res) => {

    try {

        const {
            name,
            district,
            state,
            latitude,
            longitude
        } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Village name is required."
            });
        }

        const cleanName = name.trim();

        const cleanDistrict =
            typeof district === "string"
                ? district.trim() || null
                : null;

        const cleanState =
            typeof state === "string"
                ? state.trim() || null
                : null;

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

        if ((lat === null) !== (lng === null)) {

            return res.status(400).json({
                success: false,
                message: "Latitude and longitude must both be provided or both be empty."
            });
        }

        const [existing] = await pool.execute(
            `SELECT id
             FROM villages
             WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
             LIMIT 1`,
            [cleanName]
        );

        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message: "This village already exists."
            });
        }

        // Insert village.

        const [result] = await pool.execute(
            `INSERT INTO villages
                (name, district, state, latitude, longitude)
             VALUES (?, ?, ?, ?, ?)`,
            [
                cleanName,
                cleanDistrict,
                cleanState,
                lat,
                lng
            ]
        );

        const villageId = result.insertId;

        // Automatically create all three default offices.

        await ensureVillageOffices(villageId);

        return res.status(201).json({

            success: true,

            message: "Village and default offices created successfully.",

            village: {
                id: villageId,
                name: cleanName,
                district: cleanDistrict,
                state: cleanState,
                latitude: lat,
                longitude: lng
            },

            offices_created: DEFAULT_OFFICES.length

        });

    } catch (error) {

        console.error("Create village error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create village.",
            error: error.message
        });
    }
};

// --------------------------------------------------
// UPDATE VILLAGE
// --------------------------------------------------

exports.updateVillage = async (req, res) => {

    try {

        const villageId = Number(req.params.id);

        if (
            !Number.isInteger(villageId) ||
            villageId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid village ID."
            });
        }

        const {
            name,
            district,
            state,
            latitude,
            longitude
        } = req.body;

        const updates = [];

        const values = [];

        if (name !== undefined) {

            if (typeof name !== "string") {

                return res.status(400).json({
                    success: false,
                    message: "Invalid village name."
                });
            }

            const cleanName = name.trim();

            if (!cleanName) {

                return res.status(400).json({
                    success: false,
                    message: "Village name cannot be empty."
                });
            }

            updates.push("name = ?");

            values.push(cleanName);
        }

        if (district !== undefined) {

            if (
                district !== null &&
                typeof district !== "string"
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid district."
                });
            }

            updates.push("district = ?");

            values.push(
                district === null
                    ? null
                    : district.trim() || null
            );
        }

        if (state !== undefined) {

            if (
                state !== null &&
                typeof state !== "string"
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid state."
                });
            }

            updates.push("state = ?");

            values.push(
                state === null
                    ? null
                    : state.trim() || null
            );
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

        if (updates.length === 0) {

            return res.status(400).json({
                success: false,
                message: "No village information was provided to update."
            });
        }

        values.push(villageId);

        const [result] = await pool.execute(
            `UPDATE villages
             SET ${updates.join(", ")}
             WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {

            const [existing] = await pool.execute(
                `SELECT id
                 FROM villages
                 WHERE id = ?
                 LIMIT 1`,
                [villageId]
            );

            if (existing.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Village not found."
                });
            }
        }

        return res.json({
            success: true,
            message: "Village updated successfully."
        });

    } catch (error) {

        console.error("Update village error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update village.",
            error: error.message
        });
    }
};
