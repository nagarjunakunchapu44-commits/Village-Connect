const db = require("../config/db");

/*
    Create an in-app notification.

    This function expects a notifications table.
*/
exports.createNotification = async (
    userId,
    title,
    message
) => {
    try {
        const [result] = await db.execute(
            `INSERT INTO notifications
            (
                user_id,
                title,
                message
            )
            VALUES (?, ?, ?)`,
            [
                userId,
                title,
                message
            ]
        );

        return result.insertId;
    } catch (error) {
        /*
            Notifications are an optional feature.

            If the notifications table does not exist yet,
            do not stop the main application operation.
        */
        console.error(
            "Notification service error:",
            error.message
        );

        return null;
    }
};


/*
    Get notifications for a user
*/
exports.getUserNotifications = async (
    userId
) => {
    try {
        const [notifications] =
            await db.execute(
                `SELECT *
                 FROM notifications
                 WHERE user_id = ?
                 ORDER BY created_at DESC`,
                [userId]
            );

        return notifications;
    } catch (error) {
        console.error(
            "Get notifications error:",
            error.message
        );

        return [];
    }
};


/*
    Mark a notification as read
*/
exports.markAsRead = async (
    notificationId,
    userId
) => {
    try {
        const [result] = await db.execute(
            `UPDATE notifications
             SET is_read = 1
             WHERE id = ?
             AND user_id = ?`,
            [
                notificationId,
                userId
            ]
        );

        return result.affectedRows > 0;
    } catch (error) {
        console.error(
            "Mark notification error:",
            error.message
        );

        return false;
    }
};