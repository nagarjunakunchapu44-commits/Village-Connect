const pool = require("../config/db");

exports.getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        const isAdmin =
            req.user.role === "admin" ||
            req.user.role === "official";

        let villageId = null;

        if (!isAdmin) {
            const [users] = await pool.execute(
                `SELECT village_id
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

            villageId = users[0].village_id;
        }

        const complaintParams = [];
        let complaintCondition = "";

        if (!isAdmin) {
            complaintCondition = "WHERE c.village_id = ?";
            complaintParams.push(villageId);
        }

        const [complaintStats] = await pool.execute(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN c.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN c.status = 'Forwarded' THEN 1 ELSE 0 END) AS forwarded,
                SUM(CASE WHEN c.status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
             FROM complaints c
             ${complaintCondition}`,
            complaintParams
        );

        const categoryParams = [];
        let categoryCondition = "";

        if (!isAdmin) {
            categoryCondition = "WHERE c.village_id = ?";
            categoryParams.push(villageId);
        }

        const [categoryStats] = await pool.execute(
            `SELECT
                c.category,
                COUNT(*) AS count
             FROM complaints c
             ${categoryCondition}
             GROUP BY c.category
             ORDER BY count DESC`,
            categoryParams
        );

        const eventParams = [];
        let eventCondition = "";

        if (!isAdmin) {
            eventCondition = "WHERE e.village_id = ?";
            eventParams.push(villageId);
        }

        const [eventStats] = await pool.execute(
            `SELECT
                COUNT(*) AS total_events
             FROM events e
             ${eventCondition}`,
            eventParams
        );

        const volunteerParams = [];
        let volunteerCondition = "";

        if (!isAdmin) {
            volunteerCondition = "WHERE v.village_id = ?";
            volunteerParams.push(villageId);
        }

        const [volunteerStats] = await pool.execute(
            `SELECT
                COUNT(*) AS total_volunteers,
                SUM(
                    CASE
                        WHEN v.approved = 1 THEN 1
                        ELSE 0
                    END
                ) AS approved_volunteers
             FROM volunteers v
             ${volunteerCondition}`,
            volunteerParams
        );

        const pollParams = [];
        let pollCondition = "";

        if (!isAdmin) {
            pollCondition = "WHERE p.village_id = ?";
            pollParams.push(villageId);
        }

        const [pollStats] = await pool.execute(
            `SELECT
                COUNT(*) AS total_polls
             FROM polls p
             ${pollCondition}`,
            pollParams
        );

        let village = null;

        if (!isAdmin && villageId) {
            const [villages] = await pool.execute(
                `SELECT
                    id,
                    name,
                    district,
                    state
                 FROM villages
                 WHERE id = ?
                 LIMIT 1`,
                [villageId]
            );

            if (villages.length > 0) {
                village = villages[0];
            }
        }

        const complaints = complaintStats[0] || {};
        const events = eventStats[0] || {};
        const volunteers = volunteerStats[0] || {};
        const polls = pollStats[0] || {};

        return res.json({
            success: true,

            scope: isAdmin
                ? "all_villages"
                : "my_village",

            village,

            complaints: {
                total: Number(complaints.total || 0),
                pending: Number(complaints.pending || 0),
                forwarded: Number(complaints.forwarded || 0),
                in_progress: Number(complaints.in_progress || 0),
                resolved: Number(complaints.resolved || 0)
            },

            complaints_by_category:
                categoryStats.map(item => ({
                    category: item.category,
                    count: Number(item.count || 0)
                })),

            events: {
                total: Number(events.total_events || 0)
            },

            volunteers: {
                total: Number(volunteers.total_volunteers || 0),
                approved: Number(
                    volunteers.approved_volunteers || 0
                )
            },

            polls: {
                total: Number(polls.total_polls || 0)
            }
        });
    } catch (error) {
        console.error(
            "Get analytics error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch analytics.",
            error: error.message
        });
    }
};