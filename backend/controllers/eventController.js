const pool = require("../config/db");

async function getUserVillageId(userId) {
    const [rows] = await pool.execute(
        `SELECT village_id FROM users WHERE id = ? LIMIT 1`,
        [userId]
    );

    return rows.length ? rows[0].village_id : null;
}

function isAdmin(req) {
    return String(req.user.role || "").toLowerCase() === "admin";
}

async function getSarpanchVillageId(userId) {
    const [rows] = await pool.execute(
        `SELECT village_id
         FROM users
         WHERE id = ?
           AND LOWER(TRIM(role)) = 'official'
           AND LOWER(TRIM(occupation)) = 'sarpanch'
         LIMIT 1`,
        [userId]
    );

    return rows.length ? rows[0].village_id : null;
}

async function canManageEvent(req, eventVillageId) {
    if (isAdmin(req)) return true;

    const villageId = await getSarpanchVillageId(req.user.id);

    return villageId !== null &&
        eventVillageId !== null &&
        Number(villageId) === Number(eventVillageId);
}

async function canViewEvent(req, eventVillageId) {
    if (isAdmin(req)) return true;

    const villageId = await getUserVillageId(req.user.id);

    return villageId !== null &&
        eventVillageId !== null &&
        Number(villageId) === Number(eventVillageId);
}

// GET ALL EVENTS
exports.getEvents = async (req, res) => {
    try {
        let sql = `
            SELECT
                e.*,
                v.name AS village_name,
                COUNT(DISTINCT er.id) AS participant_count
            FROM events e
            LEFT JOIN villages v ON v.id = e.village_id
            LEFT JOIN event_registrations er ON er.event_id = e.id
        `;

        const params = [];

        if (!isAdmin(req)) {
            const villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Your account is not assigned to a village."
                });
            }

            sql += ` WHERE e.village_id = ?`;
            params.push(villageId);
        }

        sql += `
            GROUP BY e.id
            ORDER BY e.date ASC, e.time ASC
        `;

        const [events] = await pool.execute(sql, params);

        return res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error("Get events error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch events."
        });
    }
};

// GET EVENT BY ID
exports.getEventById = async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const [events] = await pool.execute(
            `SELECT
                e.*,
                v.name AS village_name,
                COUNT(DISTINCT er.id) AS participant_count
             FROM events e
             LEFT JOIN villages v ON v.id = e.village_id
             LEFT JOIN event_registrations er ON er.event_id = e.id
             WHERE e.id = ?
             GROUP BY e.id
             LIMIT 1`,
            [eventId]
        );

        if (!events.length) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        const event = events[0];

        if (!(await canViewEvent(req, event.village_id))) {
            return res.status(403).json({
                success: false,
                message: "You cannot access events from another village."
            });
        }

        return res.json({
            success: true,
            event
        });
    } catch (error) {
        console.error("Get event by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch event."
        });
    }
};

// CREATE EVENT
exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            time,
            venue,
            organizer
        } = req.body;

        if (!title || !date) {
            return res.status(400).json({
                success: false,
                message: "Title and date are required."
            });
        }

        let villageId;

        if (isAdmin(req)) {
            villageId =
                req.body.village_id === undefined ||
                req.body.village_id === null ||
                req.body.village_id === ""
                    ? null
                    : Number(req.body.village_id);

            if (
                villageId !== null &&
                (!Number.isInteger(villageId) || villageId <= 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid village ID."
                });
            }

            if (villageId !== null) {
                const [villages] = await pool.execute(
                    `SELECT id FROM villages WHERE id = ? LIMIT 1`,
                    [villageId]
                );

                if (!villages.length) {
                    return res.status(404).json({
                        success: false,
                        message: "Village not found."
                    });
                }
            }
        } else {
            villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(403).json({
                    success: false,
                    message: "Your account is not assigned to a village."
                });
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO events
                (title, description, date, time, venue, organizer, village_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                description || null,
                date,
                time || null,
                venue || null,
                organizer || null,
                villageId,
                req.user.id
            ]
        );

        const [createdEvents] = await pool.execute(
            `SELECT e.*, v.name AS village_name
             FROM events e
             LEFT JOIN villages v ON v.id = e.village_id
             WHERE e.id = ?
             LIMIT 1`,
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            event: createdEvents[0]
        });
    } catch (error) {
        console.error("Create event error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create event."
        });
    }
};

// UPDATE EVENT
exports.updateEvent = async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const [events] = await pool.execute(
            `SELECT * FROM events WHERE id = ? LIMIT 1`,
            [eventId]
        );

        if (!events.length) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        const existingEvent = events[0];

        if (!(await canManageEvent(req, existingEvent.village_id))) {
            return res.status(403).json({
                success: false,
                message: "Only the admin or the village Sarpanch can update this event."
            });
        }

        let villageId = existingEvent.village_id;

        if (isAdmin(req) && req.body.village_id !== undefined) {
            villageId =
                req.body.village_id === null || req.body.village_id === ""
                    ? null
                    : Number(req.body.village_id);

            if (
                villageId !== null &&
                (!Number.isInteger(villageId) || villageId <= 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid village ID."
                });
            }

            if (villageId !== null) {
                const [villages] = await pool.execute(
                    `SELECT id FROM villages WHERE id = ? LIMIT 1`,
                    [villageId]
                );

                if (!villages.length) {
                    return res.status(404).json({
                        success: false,
                        message: "Village not found."
                    });
                }
            }
        } else if (!isAdmin(req) && req.body.village_id !== undefined) {
            const sarpanchVillageId = await getSarpanchVillageId(req.user.id);

            if (Number(req.body.village_id) !== Number(sarpanchVillageId)) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot move an event to another village."
                });
            }
        }

        const title = req.body.title ?? existingEvent.title;
        const description = req.body.description ?? existingEvent.description;
        const eventDate = req.body.date ?? existingEvent.date;
        const eventTime = req.body.time ?? existingEvent.time;
        const venue = req.body.venue ?? existingEvent.venue;
        const organizer = req.body.organizer ?? existingEvent.organizer;

        await pool.execute(
            `UPDATE events
             SET title = ?,
                 description = ?,
                 date = ?,
                 time = ?,
                 venue = ?,
                 organizer = ?,
                 village_id = ?
             WHERE id = ?`,
            [
                title,
                description,
                eventDate,
                eventTime,
                venue,
                organizer,
                villageId,
                eventId
            ]
        );

        const [updatedEvents] = await pool.execute(
            `SELECT e.*, v.name AS village_name
             FROM events e
             LEFT JOIN villages v ON v.id = e.village_id
             WHERE e.id = ?
             LIMIT 1`,
            [eventId]
        );

        return res.json({
            success: true,
            message: "Event updated successfully.",
            event: updatedEvents[0]
        });
    } catch (error) {
        console.error("Update event error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update event."
        });
    }
};

// DELETE EVENT
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const [events] = await pool.execute(
            `SELECT village_id FROM events WHERE id = ? LIMIT 1`,
            [eventId]
        );

        if (!events.length) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (!(await canManageEvent(req, events[0].village_id))) {
            return res.status(403).json({
                success: false,
                message: "Only the admin or the village Sarpanch can delete this event."
            });
        }

        await pool.execute(
            `DELETE FROM events WHERE id = ?`,
            [eventId]
        );

        return res.json({
            success: true,
            message: "Event deleted successfully."
        });
    } catch (error) {
        console.error("Delete event error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete event."
        });
    }
};

// REGISTER FOR EVENT
exports.registerForEvent = async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const [events] = await pool.execute(
            `SELECT id, village_id FROM events WHERE id = ? LIMIT 1`,
            [eventId]
        );

        if (!events.length) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        const villageId = await getUserVillageId(req.user.id);

        if (
            !villageId ||
            !events[0].village_id ||
            Number(villageId) !== Number(events[0].village_id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can register only for events in your own village."
            });
        }

        const [existing] = await pool.execute(
            `SELECT id
             FROM event_registrations
             WHERE event_id = ? AND user_id = ?
             LIMIT 1`,
            [eventId, req.user.id]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "You are already registered for this event."
            });
        }

        await pool.execute(
            `INSERT INTO event_registrations (event_id, user_id)
             VALUES (?, ?)`,
            [eventId, req.user.id]
        );

        return res.status(201).json({
            success: true,
            message: "Registered for event successfully."
        });
    } catch (error) {
        console.error("Register for event error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to register for event."
        });
    }
};

// CANCEL EVENT REGISTRATION
exports.cancelRegistration = async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const [events] = await pool.execute(
            `SELECT village_id FROM events WHERE id = ? LIMIT 1`,
            [eventId]
        );

        if (!events.length) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (!(await canViewEvent(req, events[0].village_id))) {
            return res.status(403).json({
                success: false,
                message: "You cannot access registrations for another village."
            });
        }

        const [result] = await pool.execute(
            `DELETE FROM event_registrations
             WHERE event_id = ? AND user_id = ?`,
            [eventId, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Registration not found."
            });
        }

        return res.json({
            success: true,
            message: "Registration cancelled successfully."
        });
    } catch (error) {
        console.error("Cancel registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel registration."
        });
    }
};

// GET EVENT PARTICIPANTS
exports.getParticipants = async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID."
            });
        }

        const [events] = await pool.execute(
            `SELECT id, village_id
             FROM events
             WHERE id = ?
             LIMIT 1`,
            [eventId]
        );

        if (!events.length) {
            return res.status(404).json({
                success: false,
                message: "Event not found."
            });
        }

        if (!(await canViewEvent(req, events[0].village_id))) {
            return res.status(403).json({
                success: false,
                message: "You cannot view participants from another village."
            });
        }

        const [participants] = await pool.execute(
            `SELECT
                er.id,
                er.event_id,
                er.user_id,
                er.registered_at,
                u.name,
                u.mobile,
                u.occupation
             FROM event_registrations er
             INNER JOIN users u ON u.id = er.user_id
             WHERE er.event_id = ?
             ORDER BY er.registered_at ASC`,
            [eventId]
        );

        return res.json({
            success: true,
            participants
        });
    } catch (error) {
        console.error("Get event participants error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch event participants."
        });
    }
};