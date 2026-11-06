const pool = require("../config/db");

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const [notifications] = await pool.execute(
            `SELECT
                n.id,
                n.user_id,
                n.title,
                n.message,
                n.type,
                n.reference_id,
                n.is_read,
                n.created_at
             FROM notifications n
             WHERE n.user_id = ?
             ORDER BY n.created_at DESC`,
            [userId]
        );

        return res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error(
            "Get notifications error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch notifications.",
            error: error.message
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId =
            Number(req.params.id);

        if (
            !Number.isInteger(notificationId) ||
            notificationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID."
            });
        }

        const [result] = await pool.execute(
            `UPDATE notifications
             SET is_read = 1
             WHERE id = ?
               AND user_id = ?`,
            [
                notificationId,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found."
            });
        }

        return res.json({
            success: true,
            message:
                "Notification marked as read."
        });
    } catch (error) {
        console.error(
            "Mark notification as read error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update notification.",
            error: error.message
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.execute(
            `UPDATE notifications
             SET is_read = 1
             WHERE user_id = ?
               AND is_read = 0`,
            [userId]
        );

        return res.json({
            success: true,
            message:
                "All notifications marked as read."
        });
    } catch (error) {
        console.error(
            "Mark all notifications as read error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update notifications.",
            error: error.message
        });
    }
};

exports.deleteNotification = async (
    req,
    res
) => {
    try {
        const userId = req.user.id;
        const notificationId =
            Number(req.params.id);

        if (
            !Number.isInteger(notificationId) ||
            notificationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID."
            });
        }

        const [result] = await pool.execute(
            `DELETE FROM notifications
             WHERE id = ?
               AND user_id = ?`,
            [
                notificationId,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found."
            });
        }

        return res.json({
            success: true,
            message:
                "Notification deleted successfully."
        });
    } catch (error) {
        console.error(
            "Delete notification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete notification.",
            error: error.message
        });
    }
};