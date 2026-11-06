const pool = require("../config/db");

/*
|--------------------------------------------------------------------------
| Village Official Roles
|--------------------------------------------------------------------------
*/

const OFFICIAL_ROLES = [
    "Sarpanch",
    "MPP",
    "ZPH",
    "VRO"
];

const OFFICIAL_ROLE_FULL = {
    Sarpanch:
        "Village Sarpanch",

    MPP:
        "Mandal Parishad President",

    ZPH:
        "Zilla Parishad Representative",

    VRO:
        "Village Revenue Officer"
};

/*
|--------------------------------------------------------------------------
| GET /api/villages/officials
|
| Returns Sarpanch, MPP, ZPH and VRO belonging to the
| logged-in user's registered village.
|--------------------------------------------------------------------------
*/

exports.getVillageOfficials = async (req, res) => {
    try {
        const userId = req.user.id;

        /*
        |--------------------------------------------------------------------------
        | Get logged-in user's village
        |--------------------------------------------------------------------------
        */

        const [userRows] = await pool.execute(
            `
            SELECT
                u.village_id,
                v.name AS village_name
            FROM users u
            LEFT JOIN villages v
                ON v.id = u.village_id
            WHERE u.id = ?
            LIMIT 1
            `,
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const villageId =
            userRows[0].village_id;

        const villageName =
            userRows[0].village_name;

        if (!villageId) {
            return res.status(400).json({
                success: false,
                message:
                    "Your account is not associated with a village."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Get registered officials from SAME village only
        |--------------------------------------------------------------------------
        */

        const [officialRows] = await pool.execute(
            `
            SELECT
                id,
                name,
                mobile,
                email,
                occupation,
                status
            FROM users
            WHERE village_id = ?
              AND LOWER(TRIM(occupation))
                  IN ('sarpanch', 'mpp', 'zph', 'vro')
            ORDER BY id ASC
            `,
            [villageId]
        );

        /*
        |--------------------------------------------------------------------------
        | Create all four boxes
        |--------------------------------------------------------------------------
        */

        const officials = {};

        OFFICIAL_ROLES.forEach(role => {
            officials[role] = {
                role,
                title: OFFICIAL_ROLE_FULL[role],
                registered: false,
                id: null,
                name: null,
                mobile: null,
                status: null
            };
        });

        officialRows.forEach(user => {
            const role = OFFICIAL_ROLES.find(
                item =>
                    item.toLowerCase() ===
                    String(user.occupation)
                        .trim()
                        .toLowerCase()
            );

            if (!role) {
                return;
            }

            /*
            |--------------------------------------------------------------------------
            | First registered account for that official position
            |--------------------------------------------------------------------------
            */

            if (!officials[role].registered) {
                officials[role] = {
                    role,
                    title:
                        OFFICIAL_ROLE_FULL[role],
                    registered: true,
                    id: user.id,
                    name: user.name,
                    mobile: user.mobile,
                    status: user.status
                };
            }
        });

        return res.json({
            success: true,

            village: {
                id: villageId,
                name: villageName
            },

            officials
        });

    } catch (error) {
        console.error(
            "Get village officials error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch village officials."
        });
    }
};