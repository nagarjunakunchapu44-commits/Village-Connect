
const pool = require("../config/db");

// ============================================
// USER AND ROLE HELPERS
// ============================================

function getRole(req) {
    return String(req.user.role || "").toLowerCase();
}

function isAdmin(req) {
    return getRole(req) === "admin";
}

function isSarpanch(req) {
    return (
        getRole(req) === "official" &&
        String(req.user.occupation || "").toLowerCase() === "sarpanch"
    );
}

function canManagePolls(req) {
    return isAdmin(req) || isSarpanch(req);
}

async function getUserVillageId(userId) {
    const [users] = await pool.execute(
        `SELECT village_id
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
    );

    if (users.length === 0) return null;

    return users[0].village_id;
}

async function canAccessPoll(req, poll) {
    if (isAdmin(req)) return true;

    const villageId = await getUserVillageId(req.user.id);

    return (
        villageId &&
        poll.village_id &&
        Number(villageId) === Number(poll.village_id)
    );
}

async function getPollOptions(pollId) {
    const [options] = await pool.execute(
        `SELECT
            po.id,
            po.option_text,
            COUNT(pv.id) AS vote_count
         FROM poll_options po
         LEFT JOIN poll_votes pv
            ON pv.option_id = po.id
         WHERE po.poll_id = ?
         GROUP BY po.id, po.option_text
         ORDER BY po.id ASC`,
        [pollId]
    );

    return options;
}

function cleanAndValidateOptions(options) {
    if (!Array.isArray(options) || options.length < 2) {
        throw new Error("At least two poll options are required.");
    }

    const cleanOptions = options
        .map(option => String(option).trim())
        .filter(Boolean);

    if (cleanOptions.length < 2) {
        throw new Error("At least two valid poll options are required.");
    }

    const uniqueOptions = [
        ...new Set(cleanOptions.map(option => option.toLowerCase()))
    ];

    if (uniqueOptions.length !== cleanOptions.length) {
        throw new Error("Poll options must be unique.");
    }

    return cleanOptions;
}

// ============================================
// GET ALL POLLS
// ============================================

exports.getPolls = async (req, res) => {
    try {
        console.log("========== POLL ACCESS DEBUG ==========");
    console.log("Logged-in user ID:", req.user.id);
    console.log("Logged-in role:", req.user.role);
    console.log("Logged-in occupation:", req.user.occupation);

    const villageId = await getUserVillageId(req.user.id);

    console.log("Database village ID:", villageId);
    console.log("Is admin:", isAdmin(req));
    console.log("=======================================");
        let query = `
            SELECT
                p.id,
                p.question,
                p.village_id,
                v.name AS village_name,
                p.created_at
            FROM polls p
            LEFT JOIN villages v
                ON v.id = p.village_id
        `;

        const params = [];

        // Only Admin can see polls across all villages.
        if (!isAdmin(req)) {
            const villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.json({
                    success: true,
                    polls: []
                });
            }

            query += ` WHERE p.village_id = ?`;
            params.push(villageId);
        }

        query += ` ORDER BY p.created_at DESC`;

        const [polls] = await pool.execute(query, params);

        for (const poll of polls) {
            poll.options = await getPollOptions(poll.id);
        }

        return res.json({
            success: true,
            polls
        });

    } catch (error) {
        console.error("Get polls error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch polls."
        });
    }
};

// ============================================
// GET ONE POLL
// ============================================

exports.getPollById = async (req, res) => {
    try {
        const pollId = Number(req.params.id);

        if (!Number.isInteger(pollId) || pollId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid poll ID."
            });
        }

        const [polls] = await pool.execute(
            `SELECT
                p.id,
                p.question,
                p.village_id,
                v.name AS village_name,
                p.created_at
             FROM polls p
             LEFT JOIN villages v
                ON v.id = p.village_id
             WHERE p.id = ?
             LIMIT 1`,
            [pollId]
        );

        if (polls.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll not found."
            });
        }

        const poll = polls[0];

        if (!(await canAccessPoll(req, poll))) {
            return res.status(403).json({
                success: false,
                message: "You can access only polls from your village."
            });
        }

        const options = await getPollOptions(pollId);

        const [myVotes] = await pool.execute(
            `SELECT
                pv.id,
                pv.option_id
             FROM poll_votes pv
             WHERE pv.poll_id = ?
               AND pv.user_id = ?
             LIMIT 1`,
            [pollId, req.user.id]
        );

        return res.json({
            success: true,
            poll: {
                ...poll,
                options,
                my_vote: myVotes.length > 0 ? myVotes[0] : null
            }
        });

    } catch (error) {
        console.error("Get poll by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch poll."
        });
    }
};

// ============================================
// CREATE POLL
// ============================================

exports.createPoll = async (req, res) => {
    let connection;

    try {
        const { question, options, village_id } = req.body;

        const cleanQuestion = String(question || "").trim();

        if (!cleanQuestion) {
            return res.status(400).json({
                success: false,
                message: "Poll question is required."
            });
        }

        let cleanOptions;

        try {
            cleanOptions = cleanAndValidateOptions(options);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        let villageId;

        if (isAdmin(req)) {
            villageId =
                village_id === undefined ||
                village_id === null ||
                village_id === ""
                    ? null
                    : Number(village_id);

            if (
                villageId !== null &&
                (!Number.isInteger(villageId) || villageId <= 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid village ID."
                });
            }
        } else {
            // Every non-admin creator is restricted to their own village.
            villageId = await getUserVillageId(req.user.id);

            if (!villageId) {
                return res.status(400).json({
                    success: false,
                    message: "Your account is not linked to a village."
                });
            }
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [pollResult] = await connection.execute(
            `INSERT INTO polls (question, village_id)
             VALUES (?, ?)`,
            [cleanQuestion, villageId]
        );

        for (const option of cleanOptions) {
            await connection.execute(
                `INSERT INTO poll_options (poll_id, option_text)
                 VALUES (?, ?)`,
                [pollResult.insertId, option]
            );
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Poll created successfully.",
            poll: {
                id: pollResult.insertId,
                question: cleanQuestion,
                village_id: villageId,
                options: cleanOptions
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Create poll error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create poll."
        });

    } finally {
        if (connection) connection.release();
    }
};

// ============================================
// UPDATE POLL
// Only Admin and Sarpanch can manage polls.
// Sarpanch can update only their own village.
// ============================================

exports.updatePoll = async (req, res) => {
    let connection;

    try {
        if (!canManagePolls(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Admin or Sarpanch can manage polls."
            });
        }

        const pollId = Number(req.params.id);

        if (!Number.isInteger(pollId) || pollId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid poll ID."
            });
        }

        const [polls] = await pool.execute(
            `SELECT id, village_id
             FROM polls
             WHERE id = ?
             LIMIT 1`,
            [pollId]
        );

        if (polls.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll not found."
            });
        }

        const poll = polls[0];

        if (!(await canAccessPoll(req, poll))) {
            return res.status(403).json({
                success: false,
                message: "You can manage polls only in your village."
            });
        }

        const updates = [];
        const values = [];

        if (req.body.question !== undefined) {
            const question = String(req.body.question).trim();

            if (!question) {
                return res.status(400).json({
                    success: false,
                    message: "Poll question cannot be empty."
                });
            }

            updates.push("question = ?");
            values.push(question);
        }

        let cleanOptions = null;

        if (req.body.options !== undefined) {
            try {
                cleanOptions = cleanAndValidateOptions(req.body.options);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }

        // Only Admin can move a poll to another village.
        if (req.body.village_id !== undefined) {
            if (!isAdmin(req)) {
                return res.status(403).json({
                    success: false,
                    message: "Only Admin can change a poll's village."
                });
            }

            const newVillageId =
                req.body.village_id === null ||
                req.body.village_id === ""
                    ? null
                    : Number(req.body.village_id);

            if (
                newVillageId !== null &&
                (!Number.isInteger(newVillageId) || newVillageId <= 0)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid village ID."
                });
            }

            updates.push("village_id = ?");
            values.push(newVillageId);
        }

        if (updates.length === 0 && cleanOptions === null) {
            return res.status(400).json({
                success: false,
                message: "No poll information was provided to update."
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (updates.length > 0) {
            values.push(pollId);

            await connection.execute(
                `UPDATE polls
                 SET ${updates.join(", ")}
                 WHERE id = ?`,
                values
            );
        }

        if (cleanOptions !== null) {
            // Changing options removes previous votes for this poll.
            await connection.execute(
                `DELETE pv
                 FROM poll_votes pv
                 INNER JOIN poll_options po
                    ON po.id = pv.option_id
                 WHERE po.poll_id = ?`,
                [pollId]
            );

            await connection.execute(
                `DELETE FROM poll_options
                 WHERE poll_id = ?`,
                [pollId]
            );

            for (const option of cleanOptions) {
                await connection.execute(
                    `INSERT INTO poll_options (poll_id, option_text)
                     VALUES (?, ?)`,
                    [pollId, option]
                );
            }
        }

        await connection.commit();

        return res.json({
            success: true,
            message: "Poll updated successfully."
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Update poll error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update poll."
        });

    } finally {
        if (connection) connection.release();
    }
};

// ============================================
// DELETE POLL
// Only Admin and Sarpanch can delete polls.
// ============================================

exports.deletePoll = async (req, res) => {
    try {
        if (!canManagePolls(req)) {
            return res.status(403).json({
                success: false,
                message: "Only Admin or Sarpanch can delete polls."
            });
        }

        const pollId = Number(req.params.id);

        if (!Number.isInteger(pollId) || pollId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid poll ID."
            });
        }

        const [polls] = await pool.execute(
            `SELECT id, village_id
             FROM polls
             WHERE id = ?
             LIMIT 1`,
            [pollId]
        );

        if (polls.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll not found."
            });
        }

        if (!(await canAccessPoll(req, polls[0]))) {
            return res.status(403).json({
                success: false,
                message: "You can delete polls only in your village."
            });
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                `DELETE pv
                 FROM poll_votes pv
                 INNER JOIN poll_options po
                    ON po.id = pv.option_id
                 WHERE po.poll_id = ?`,
                [pollId]
            );

            await connection.execute(
                `DELETE FROM poll_options
                 WHERE poll_id = ?`,
                [pollId]
            );

            await connection.execute(
                `DELETE FROM polls
                 WHERE id = ?`,
                [pollId]
            );

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }

        return res.json({
            success: true,
            message: "Poll deleted successfully."
        });

    } catch (error) {
        console.error("Delete poll error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete poll."
        });
    }
};

// ============================================
// VOTE IN POLL
// All residents can vote in their own village.
// One vote per user per poll.
// ============================================

exports.votePoll = async (req, res) => {
    try {
        const pollId = Number(req.params.id);
        const userId = req.user.id;
        const optionId = Number(req.body.option_id);

        if (!Number.isInteger(pollId) || pollId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid poll ID."
            });
        }

        if (!Number.isInteger(optionId) || optionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid poll option."
            });
        }

        const [polls] = await pool.execute(
            `SELECT id, village_id
             FROM polls
             WHERE id = ?
             LIMIT 1`,
            [pollId]
        );

        if (polls.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll not found."
            });
        }

        const poll = polls[0];

        // All non-admin accounts, including residents and officials,
        // must belong to the poll's village.
        if (!(await canAccessPoll(req, poll))) {
            return res.status(403).json({
                success: false,
                message: "You can vote only in polls from your village."
            });
        }

        const [options] = await pool.execute(
            `SELECT id
             FROM poll_options
             WHERE id = ?
               AND poll_id = ?
             LIMIT 1`,
            [optionId, pollId]
        );

        if (options.length === 0) {
            return res.status(400).json({
                success: false,
                message: "The selected option does not belong to this poll."
            });
        }

        const [existingVote] = await pool.execute(
            `SELECT id
             FROM poll_votes
             WHERE poll_id = ?
               AND user_id = ?
             LIMIT 1`,
            [pollId, userId]
        );

        if (existingVote.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You have already voted in this poll."
            });
        }

        await pool.execute(
            `INSERT INTO poll_votes
             (poll_id, option_id, user_id)
             VALUES (?, ?, ?)`,
            [pollId, optionId, userId]
        );

        return res.status(201).json({
            success: true,
            message: "Your vote has been recorded."
        });

    } catch (error) {
        console.error("Vote poll error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to record your vote."
        });
    }
};

// ============================================
// GET LOGGED-IN USER'S VOTE
// ============================================

exports.getMyVote = async (req, res) => {
    try {
        const pollId = Number(req.params.id);

        if (!Number.isInteger(pollId) || pollId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid poll ID."
            });
        }

        const [polls] = await pool.execute(
            `SELECT id, village_id
             FROM polls
             WHERE id = ?
             LIMIT 1`,
            [pollId]
        );

        if (polls.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Poll not found."
            });
        }

        if (!(await canAccessPoll(req, polls[0]))) {
            return res.status(403).json({
                success: false,
                message: "You can access only polls from your village."
            });
        }

        const [votes] = await pool.execute(
            `SELECT
                pv.id,
                pv.poll_id,
                pv.option_id,
                po.option_text
             FROM poll_votes pv
             INNER JOIN poll_options po
                ON po.id = pv.option_id
             WHERE pv.poll_id = ?
               AND pv.user_id = ?
             LIMIT 1`,
            [pollId, req.user.id]
        );

        return res.json({
            success: true,
            voted: votes.length > 0,
            vote: votes.length > 0 ? votes[0] : null
        });

    } catch (error) {
        console.error("Get my poll vote error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your vote."
        });
    }
};
