const pool = require("../config/db");
const fs = require("fs");

/*
|--------------------------------------------------------------------------
| HELPER - GET USER VILLAGE
|--------------------------------------------------------------------------
*/

async function getUserVillageId(userId) {
    const [users] = await pool.execute(
        `SELECT village_id
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
    );

    return users.length > 0 ? users[0].village_id : null;
}

/*
|--------------------------------------------------------------------------
| HELPER - CHECK ROLE
|--------------------------------------------------------------------------
*/

function isAdmin(req) {
    return req.user.role === "admin";
}

function isOfficial(req) {
    return req.user.role === "official";
}

/*
|--------------------------------------------------------------------------
| HELPER - CHECK VILLAGE ACCESS
|--------------------------------------------------------------------------
|
| Admin:
|   Access to all villages.
|
| Official:
|   Access only to their registered village.
|
| Resident:
|   Access only to their registered village.
|
*/

async function hasVillageAccess(req, villageId) {
    if (isAdmin(req)) {
        return true;
    }

    const userVillageId = await getUserVillageId(req.user.id);

    if (!userVillageId || !villageId) {
        return false;
    }

    return Number(userVillageId) === Number(villageId);
}

/*
|--------------------------------------------------------------------------
| HELPER - GENERATE COMPLAINT NUMBER
|--------------------------------------------------------------------------
*/

async function generateComplaintNumber() {
    while (true) {
        const randomNumber = Math.floor(
            100000 + Math.random() * 900000
        );

        const complaintNumber = `VC-${randomNumber}`;

        const [existing] = await pool.execute(
            `SELECT id
             FROM complaints
             WHERE complaint_number = ?
             LIMIT 1`,
            [complaintNumber]
        );

        if (existing.length === 0) {
            return complaintNumber;
        }
    }
}

/*
|--------------------------------------------------------------------------
| HELPER - GET COMPLAINT IMAGES
|--------------------------------------------------------------------------
*/

async function getComplaintImages(complaintId) {
    const [images] = await pool.execute(
        `SELECT
            id,
            image_url,
            storage_public_id,
            created_at
         FROM complaint_images
         WHERE complaint_id = ?
         ORDER BY id ASC`,
        [complaintId]
    );

    return images;
}

/*
|--------------------------------------------------------------------------
| READ GPS COORDINATES FROM JPEG EXIF
|--------------------------------------------------------------------------
|
| This small parser verifies that the uploaded JPEG actually contains GPS
| EXIF metadata. It avoids trusting only latitude/longitude form fields.
|
*/

function readJpegGpsExif(filePath) {
    try {
        const image = fs.readFileSync(filePath);

        if (image.length < 4 || image[0] !== 0xFF || image[1] !== 0xD8) {
            return null;
        }

        let offset = 2;

        while (offset + 4 < image.length) {
            if (image[offset] !== 0xFF) {
                offset += 1;
                continue;
            }

            while (offset < image.length && image[offset] === 0xFF) {
                offset += 1;
            }

            const marker = image[offset];
            offset += 1;

            if (marker === 0xD9 || marker === 0xDA) break;
            if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) continue;
            if (offset + 2 > image.length) break;

            const segmentLength = image.readUInt16BE(offset);
            const segmentStart = offset + 2;
            const segmentEnd = offset + segmentLength;
            if (segmentLength < 2 || segmentEnd > image.length) break;

            const isExif = marker === 0xE1 &&
                image.toString("ascii", segmentStart, segmentStart + 6) === "Exif\0\0";

            if (isExif) {
                const tiffStart = segmentStart + 6;
                const byteOrder = image.toString("ascii", tiffStart, tiffStart + 2);
                const littleEndian = byteOrder === "II";

                if (!littleEndian && byteOrder !== "MM") return null;

                const readUInt16 = (position) => littleEndian
                    ? image.readUInt16LE(position)
                    : image.readUInt16BE(position);
                const readUInt32 = (position) => littleEndian
                    ? image.readUInt32LE(position)
                    : image.readUInt32BE(position);

                if (readUInt16(tiffStart + 2) !== 42) return null;

                const ifd0Offset = readUInt32(tiffStart + 4);
                const ifd0 = tiffStart + ifd0Offset;
                if (ifd0 + 2 > segmentEnd) return null;

                const ifd0Count = readUInt16(ifd0);
                let gpsIfdOffset = null;

                for (let i = 0; i < ifd0Count; i += 1) {
                    const entry = ifd0 + 2 + (i * 12);
                    if (entry + 12 > segmentEnd) return null;
                    if (readUInt16(entry) === 0x8825) {
                        gpsIfdOffset = readUInt32(entry + 8);
                        break;
                    }
                }

                if (gpsIfdOffset === null) return null;

                const gpsIfd = tiffStart + gpsIfdOffset;
                if (gpsIfd + 2 > segmentEnd) return null;
                const gpsCount = readUInt16(gpsIfd);
                const gpsEntries = {};

                for (let i = 0; i < gpsCount; i += 1) {
                    const entry = gpsIfd + 2 + (i * 12);
                    if (entry + 12 > segmentEnd) return null;

                    const tag = readUInt16(entry);
                    const type = readUInt16(entry + 2);
                    const count = readUInt32(entry + 4);
                    const valueOffset = entry + 8;
                    gpsEntries[tag] = { type, count, valueOffset };
                }

                const readGpsRef = (tag) => {
                    const item = gpsEntries[tag];
                    if (!item || item.type !== 2 || item.count < 1) return null;
                    return String.fromCharCode(image[item.valueOffset]);
                };

                const readGpsDms = (tag) => {
                    const item = gpsEntries[tag];
                    if (!item || item.type !== 5 || item.count !== 3) return null;

                    const dataOffset = tiffStart + readUInt32(item.valueOffset);
                    if (dataOffset + 24 > segmentEnd) return null;

                    const values = [];
                    for (let i = 0; i < 3; i += 1) {
                        const numerator = readUInt32(dataOffset + (i * 8));
                        const denominator = readUInt32(dataOffset + (i * 8) + 4);
                        if (denominator === 0) return null;
                        values.push(numerator / denominator);
                    }

                    return values[0] + (values[1] / 60) + (values[2] / 3600);
                };

                const latitudeRef = readGpsRef(1);
                const longitudeRef = readGpsRef(3);
                let exifLatitude = readGpsDms(2);
                let exifLongitude = readGpsDms(4);

                if (
                    exifLatitude === null ||
                    exifLongitude === null ||
                    !["N", "S"].includes(latitudeRef) ||
                    !["E", "W"].includes(longitudeRef)
                ) {
                    return null;
                }

                if (latitudeRef === "S") exifLatitude *= -1;
                if (longitudeRef === "W") exifLongitude *= -1;

                return { latitude: exifLatitude, longitude: exifLongitude };
            }

            offset = segmentEnd;
        }

        return null;
    } catch (error) {
        console.error("JPEG GPS EXIF validation error:", error.message);
        return null;
    }
}

/*
|--------------------------------------------------------------------------
| HELPER - VALIDATE COMPLAINT ID
|--------------------------------------------------------------------------
*/

function validComplaintId(id) {
    return Number.isInteger(id) && id > 0;
}

/*
|--------------------------------------------------------------------------
| CREATE COMPLAINT
|--------------------------------------------------------------------------
*/

exports.createComplaint = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.mobile,
                u.village_id,
                v.name AS village_name
             FROM users u
             LEFT JOIN villages v ON v.id = u.village_id
             WHERE u.id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        const user = users[0];

        if (!user.village_id) {
            return res.status(400).json({
                success: false,
                message: "Your account does not have a registered village."
            });
        }

        const {
            description,
            category,
            severity,
            priority,
            area,
            landmark,
            latitude,
            longitude
        } = req.body;

        /* A complaint is accepted only with an uploaded photo. */
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "A problem photo is mandatory. Please upload a photo before submitting the complaint."
            });
        }

        const finalSeverity = severity || priority || "Medium";

        if (!description || !String(description).trim()) {
            return res.status(400).json({
                success: false,
                message: "Complaint description is required."
            });
        }

        const allowedCategories = [
            "Road",
            "Drainage",
            "Garbage",
            "Waterlogging",
            "Other"
        ];

        const allowedSeverities = [
            "Low",
            "Medium",
            "High",
            "Severe"
        ];

        const finalCategory = allowedCategories.includes(category)
            ? category
            : "Other";

        if (!allowedSeverities.includes(finalSeverity)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint severity."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | MANDATORY GPS VALIDATION
        |--------------------------------------------------------------------------
        |
        | Every complaint must have valid latitude and longitude. The frontend
        | embeds these same coordinates into the uploaded JPEG EXIF GPS tags.
        | The backend independently validates the coordinates so the frontend
        | cannot be bypassed.
        |
        */

        const parsedLatitude = Number(latitude);
        const parsedLongitude = Number(longitude);

        const validLatitude =
            latitude !== undefined &&
            latitude !== null &&
            String(latitude).trim() !== "" &&
            Number.isFinite(parsedLatitude) &&
            parsedLatitude >= -90 &&
            parsedLatitude <= 90;

        const validLongitude =
            longitude !== undefined &&
            longitude !== null &&
            String(longitude).trim() !== "" &&
            Number.isFinite(parsedLongitude) &&
            parsedLongitude >= -180 &&
            parsedLongitude <= 180;

        if (!validLatitude || !validLongitude) {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, () => {});
            }

            return res.status(400).json({
                success: false,
                message: "Valid GPS latitude and longitude are mandatory. Please capture your location and submit the complaint again."
            });
        }

        const finalLatitude = parsedLatitude;
        const finalLongitude = parsedLongitude;

        const photoGps = readJpegGpsExif(req.file.path);
        const gpsMatchesPhoto = photoGps &&
            Math.abs(photoGps.latitude - finalLatitude) <= 0.00001 &&
            Math.abs(photoGps.longitude - finalLongitude) <= 0.00001;

        if (!gpsMatchesPhoto) {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, () => {});
            }

            return res.status(400).json({
                success: false,
                message: "The uploaded photo is not GPS-tagged with the captured complaint location. Please try selecting the photo again and submit."
            });
        }

        const geoTagged = 1;

        const complaintNumber = await generateComplaintNumber();

        const priorityScore = {
            Low: 1,
            Medium: 2,
            High: 3,
            Severe: 4
        }[finalSeverity];

        /*
        |--------------------------------------------------------------------------
        | INSERT COMPLAINT
        |--------------------------------------------------------------------------
        */

        const [result] = await pool.execute(
            `INSERT INTO complaints
            (
                complaint_number,
                user_id,
                village_id,
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
                likes_count
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, 0)`,
            [
                complaintNumber,
                userId,
                user.village_id,
                finalCategory,
                finalSeverity,
                area ? String(area).trim() : null,
                landmark ? String(landmark).trim() : null,
                String(description).trim(),
                finalLatitude,
                finalLongitude,
                geoTagged,
                priorityScore
            ]
        );

        const complaintId = result.insertId;

        /*
        |--------------------------------------------------------------------------
        | SAVE IMAGE
        |--------------------------------------------------------------------------
        */

        /* The photo is mandatory and is saved against this GPS-tagged complaint. */
        const imageUrl = `/uploads/${req.file.filename}`;

        await pool.execute(
            `INSERT INTO complaint_images
            (
                complaint_id,
                image_url,
                storage_public_id
            )
            VALUES (?, ?, ?)`,
            [
                complaintId,
                imageUrl,
                req.file.filename
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | STATUS HISTORY
        |--------------------------------------------------------------------------
        */

        await pool.execute(
            `INSERT INTO complaint_status_history
            (
                complaint_id,
                changed_by,
                old_status,
                new_status,
                remark
            )
            VALUES (?, ?, NULL, 'Pending', ?)`,
            [
                complaintId,
                userId,
                "Complaint created by resident."
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | FETCH CREATED COMPLAINT
        |--------------------------------------------------------------------------
        */

        const [complaints] = await pool.execute(
            `SELECT
                c.id,
                c.complaint_number,
                c.user_id,
                c.village_id,
                v.name AS village_name,
                c.category,
                c.severity,
                c.area,
                c.landmark,
                c.description,
                c.latitude,
                c.longitude,
                c.geo_tagged,
                c.status,
                c.priority_score,
                c.likes_count,
                c.created_at,
                c.updated_at,
                c.resolved_at
             FROM complaints c
             LEFT JOIN villages v ON v.id = c.village_id
             WHERE c.id = ?
             LIMIT 1`,
            [complaintId]
        );

        complaints[0].images = await getComplaintImages(complaintId);

        return res.status(201).json({
            success: true,
            message: "Complaint submitted successfully.",
            complaint: complaints[0]
        });

    } catch (error) {
        console.error("Create complaint error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create complaint.",
            error: error.message
        });
    }
};

/*
|--------------------------------------------------------------------------
| GET MY COMPLAINTS
|--------------------------------------------------------------------------
|
| Every user sees only complaints submitted by themselves.
|
*/

exports.getMyComplaints = async (req, res) => {
    try {
        const userId = req.user.id;

        const [complaints] = await pool.execute(
            `SELECT
                c.id,
                c.complaint_number,
                c.user_id,
                c.village_id,
                v.name AS village_name,
                c.category,
                c.severity,
                c.area,
                c.landmark,
                c.description,
                c.latitude,
                c.longitude,
                c.geo_tagged,
                c.status,
                c.priority_score,
                c.likes_count,
                c.created_at,
                c.updated_at,
                c.resolved_at,
                u.name AS resident_name,
                u.mobile AS resident_mobile
             FROM complaints c
             LEFT JOIN villages v ON v.id = c.village_id
             LEFT JOIN users u ON u.id = c.user_id
             WHERE c.user_id = ?
             ORDER BY c.created_at DESC`,
            [userId]
        );

        for (const complaint of complaints) {
            complaint.images = await getComplaintImages(complaint.id);
        }

        return res.json({
            success: true,
            complaints
        });

    } catch (error) {
        console.error("Get my complaints error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your complaints.",
            error: error.message
        });
    }
};

/*
|--------------------------------------------------------------------------
| GET ALL COMPLAINTS
|--------------------------------------------------------------------------
|
| Admin:
|   All villages.
|
| Official:
|   Only their village.
|
| Resident:
|   Only their village.
|
*/

exports.getAllComplaints = async (req, res) => {
    try {
        const userId = req.user.id;

        let query = `
            SELECT
                c.id,
                c.complaint_number,
                c.user_id,
                c.village_id,
                v.name AS village_name,
                c.office_id,
                o.name AS office_name,
                c.category,
                c.severity,
                c.area,
                c.landmark,
                c.description,
                c.latitude,
                c.longitude,
                c.geo_tagged,
                c.status,
                c.priority_score,
                c.likes_count,
                c.created_at,
                c.updated_at,
                c.resolved_at,
                u.name AS resident_name,
                u.mobile AS resident_mobile,
                u.email AS resident_email
            FROM complaints c
            LEFT JOIN villages v ON v.id = c.village_id
            LEFT JOIN offices o ON o.id = c.office_id
            LEFT JOIN users u ON u.id = c.user_id
        `;

        const params = [];

        /*
        |--------------------------------------------------------------------------
        | ONLY ADMIN CAN VIEW ALL VILLAGES
        |--------------------------------------------------------------------------
        */

        if (!isAdmin(req)) {
            const villageId = await getUserVillageId(userId);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has no registered village."
                });
            }

            query += ` WHERE c.village_id = ?`;
            params.push(villageId);
        }

        query += ` ORDER BY c.created_at DESC`;

        const [complaints] = await pool.execute(query, params);

        for (const complaint of complaints) {
            complaint.images = await getComplaintImages(complaint.id);
        }

        return res.json({
            success: true,
            complaints
        });

    } catch (error) {
        console.error("Get all complaints error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch complaints.",
            error: error.message
        });
    }
};

/*
|--------------------------------------------------------------------------
| GET COMPLAINT BY ID
|--------------------------------------------------------------------------
|
| Admin:
|   Any village.
|
| Official:
|   Only their village.
|
| Resident:
|   Only their village.
|
*/

exports.getComplaintById = async (req, res) => {
    try {
        const complaintId = Number(req.params.id);

        if (!validComplaintId(complaintId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint ID."
            });
        }

        let query = `
            SELECT
                c.id,
                c.complaint_number,
                c.user_id,
                c.village_id,
                v.name AS village_name,
                c.office_id,
                o.name AS office_name,
                c.category,
                c.severity,
                c.area,
                c.landmark,
                c.description,
                c.latitude,
                c.longitude,
                c.geo_tagged,
                c.status,
                c.priority_score,
                c.likes_count,
                c.created_at,
                c.updated_at,
                c.resolved_at,
                u.name AS resident_name,
                u.mobile AS resident_mobile,
                u.email AS resident_email
            FROM complaints c
            LEFT JOIN villages v ON v.id = c.village_id
            LEFT JOIN offices o ON o.id = c.office_id
            LEFT JOIN users u ON u.id = c.user_id
            WHERE c.id = ?
        `;

        const params = [complaintId];

        if (!isAdmin(req)) {
            const villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has no registered village."
                });
            }

            query += ` AND c.village_id = ?`;
            params.push(villageId);
        }

        query += ` LIMIT 1`;

        const [complaints] = await pool.execute(query, params);

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found or you do not have access to it."
            });
        }

        const complaint = complaints[0];

        complaint.images = await getComplaintImages(complaintId);

        const [history] = await pool.execute(
            `SELECT
                h.id,
                h.complaint_id,
                h.changed_by,
                h.old_status,
                h.new_status,
                h.remark,
                h.created_at,
                u.name AS changed_by_name
             FROM complaint_status_history h
             LEFT JOIN users u ON u.id = h.changed_by
             WHERE h.complaint_id = ?
             ORDER BY h.created_at ASC`,
            [complaintId]
        );

        complaint.history = history;

        return res.json({
            success: true,
            complaint
        });

    } catch (error) {
        console.error("Get complaint by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch complaint.",
            error: error.message
        });
    }
};

/*
|--------------------------------------------------------------------------
| GET COMPLAINT HISTORY
|--------------------------------------------------------------------------
*/

exports.getComplaintHistory = async (req, res) => {
    try {
        const complaintId = Number(req.params.id);

        if (!validComplaintId(complaintId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint ID."
            });
        }

        let accessQuery = `
            SELECT id, village_id
            FROM complaints
            WHERE id = ?
        `;

        const accessParams = [complaintId];

        if (!isAdmin(req)) {
            const villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Your account has no registered village."
                });
            }

            accessQuery += ` AND village_id = ?`;
            accessParams.push(villageId);
        }

        accessQuery += ` LIMIT 1`;

        const [complaints] = await pool.execute(
            accessQuery,
            accessParams
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found or access denied."
            });
        }

        const [history] = await pool.execute(
            `SELECT
                h.id,
                h.complaint_id,
                h.changed_by,
                h.old_status,
                h.new_status,
                h.remark,
                h.created_at,
                u.name AS changed_by_name
             FROM complaint_status_history h
             LEFT JOIN users u ON u.id = h.changed_by
             WHERE h.complaint_id = ?
             ORDER BY h.created_at ASC`,
            [complaintId]
        );

        return res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error("Get complaint history error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch complaint history.",
            error: error.message
        });
    }
};

/*
|--------------------------------------------------------------------------
| ASSIGN COMPLAINT
|--------------------------------------------------------------------------
|
| Admin:
|   Can assign complaints from all villages.
|
| Official:
|   Can assign complaints only in their village.
|
| Resident:
|   Cannot assign complaints.
|
*/

exports.assignComplaint = async (req, res) => {
    try {
        if (!isAdmin(req) && !isOfficial(req)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to assign complaints."
            });
        }

        const complaintId = Number(req.params.id);
        const officeId = Number(req.body.office_id);
        const changedBy = req.user.id;

        if (!validComplaintId(complaintId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint ID."
            });
        }

        if (!Number.isInteger(officeId) || officeId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid office ID is required."
            });
        }

        const [complaints] = await pool.execute(
            `SELECT
                id,
                village_id,
                office_id,
                status,
                user_id
             FROM complaints
             WHERE id = ?
             LIMIT 1`,
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found."
            });
        }

        const complaint = complaints[0];

        /*
        |--------------------------------------------------------------------------
        | OFFICIAL VILLAGE SECURITY
        |--------------------------------------------------------------------------
        */

        if (!(await hasVillageAccess(req, complaint.village_id))) {
            return res.status(403).json({
                success: false,
                message: "You cannot assign complaints from another village."
            });
        }

        const [offices] = await pool.execute(
            `SELECT id, name, village_id
             FROM offices
             WHERE id = ?
             LIMIT 1`,
            [officeId]
        );

        if (offices.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Office not found."
            });
        }

        const office = offices[0];

        /*
        |--------------------------------------------------------------------------
        | OFFICE MUST BELONG TO COMPLAINT VILLAGE
        |--------------------------------------------------------------------------
        */

        if (
            !office.village_id ||
            Number(office.village_id) !== Number(complaint.village_id)
        ) {
            return res.status(400).json({
                success: false,
                message: "The selected office does not belong to the complaint village."
            });
        }

        await pool.execute(
            `UPDATE complaints
             SET
                office_id = ?,
                status = 'Forwarded',
                resolved_at = NULL,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [officeId, complaintId]
        );

        await pool.execute(
            `INSERT INTO complaint_status_history
            (
                complaint_id,
                changed_by,
                old_status,
                new_status,
                remark
            )
            VALUES (?, ?, ?, 'Forwarded', ?)`,
            [
                complaintId,
                changedBy,
                complaint.status,
                `Complaint assigned to ${office.name}.`
            ]
        );

        await pool.execute(
            `INSERT INTO notifications
            (
                user_id,
                complaint_id,
                title,
                message,
                type,
                is_read
            )
            VALUES (?, ?, ?, ?, ?, 0)`,
            [
                complaint.user_id,
                complaintId,
                "Complaint Forwarded",
                `Your complaint has been forwarded to ${office.name}.`,
                "complaint"
            ]
        );

        return res.json({
            success: true,
            message: "Complaint assigned successfully."
        });

    } catch (error) {
        console.error("Assign complaint error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to assign complaint.",
            error: error.message
        });
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE COMPLAINT STATUS
|--------------------------------------------------------------------------
|
| Admin:
|   Can update complaints from all villages.
|
| Official:
|   Can update complaints only in their village.
|
| Resident:
|   Cannot update complaint status.
|
*/

exports.updateComplaintStatus = async (req, res) => {
    try {
        if (!isAdmin(req) && !isOfficial(req)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update complaint status."
            });
        }

        const complaintId = Number(req.params.id);
        const newStatus = req.body.status;

        const remark = req.body.remark
            ? String(req.body.remark).trim()
            : null;

        const changedBy = req.user.id;

        if (!validComplaintId(complaintId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint ID."
            });
        }

        const allowedStatuses = [
            "Pending",
            "Forwarded",
            "In Progress",
            "Resolved"
        ];

        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint status."
            });
        }

        const [complaints] = await pool.execute(
            `SELECT
                id,
                status,
                user_id,
                village_id
             FROM complaints
             WHERE id = ?
             LIMIT 1`,
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found."
            });
        }

        const complaint = complaints[0];

        /*
        |--------------------------------------------------------------------------
        | OFFICIAL VILLAGE SECURITY
        |--------------------------------------------------------------------------
        */

        if (!(await hasVillageAccess(req, complaint.village_id))) {
            return res.status(403).json({
                success: false,
                message: "You cannot update complaints from another village."
            });
        }

        const oldStatus = complaint.status;

        await pool.execute(
            `UPDATE complaints
             SET
                status = ?,
                updated_at = CURRENT_TIMESTAMP,
                resolved_at = ?
             WHERE id = ?`,
            [
                newStatus,
                newStatus === "Resolved"
                    ? new Date()
                    : null,
                complaintId
            ]
        );

        await pool.execute(
            `INSERT INTO complaint_status_history
            (
                complaint_id,
                changed_by,
                old_status,
                new_status,
                remark
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                complaintId,
                changedBy,
                oldStatus,
                newStatus,
                remark
            ]
        );

        await pool.execute(
            `INSERT INTO notifications
            (
                user_id,
                complaint_id,
                title,
                message,
                type,
                is_read
            )
            VALUES (?, ?, ?, ?, ?, 0)`,
            [
                complaint.user_id,
                complaintId,
                "Complaint Status Updated",
                `Your complaint status has been changed from "${oldStatus}" to "${newStatus}".`,
                "complaint"
            ]
        );

        return res.json({
            success: true,
            message: "Complaint status updated successfully."
        });

    } catch (error) {
        console.error("Update complaint status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update complaint status.",
            error: error.message
        });
    }
};