const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

exports.register = async (req, res) => {

    try {

        const {
            name,
            mobile,
            email,
            password,
            village_name,
            occupation
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | Required fields
        |--------------------------------------------------------------------------
        */

        if (
            !name ||
            !mobile ||
            !password ||
            !village_name
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, mobile, password and village name are required."

            });

        }


        const cleanName =
            String(name).trim();


        const cleanMobile =
            String(mobile).trim();


        const cleanEmail =
            email
                ? String(email).trim()
                : null;


        const cleanVillageName =
            String(village_name)
                .trim()
                .replace(/\s+/g, " ");


        const cleanOccupation =
            occupation
                ? String(occupation).trim()
                : null;


        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (!cleanName) {

            return res.status(400).json({

                success: false,

                message:
                    "Name is required."

            });

        }


        if (
            !/^[0-9]{10}$/.test(
                cleanMobile
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid 10-digit mobile number."

            });

        }


        if (
            !cleanVillageName ||
            cleanVillageName.length < 2
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Village name is required."

            });

        }


        if (
            cleanVillageName.length > 150
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Village name is too long."

            });

        }


        if (
            password.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Check mobile
        |--------------------------------------------------------------------------
        */

        const [
            existingMobile
        ] = await pool.execute(

            `SELECT
                id
             FROM users
             WHERE mobile = ?
             LIMIT 1`,

            [
                cleanMobile
            ]

        );


        if (
            existingMobile.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "An account with this mobile number already exists."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Check email
        |--------------------------------------------------------------------------
        */

        if (cleanEmail) {

            const [
                existingEmail
            ] = await pool.execute(

                `SELECT
                    id
                 FROM users
                 WHERE email = ?
                 LIMIT 1`,

                [
                    cleanEmail
                ]

            );


            if (
                existingEmail.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this email already exists."

                });

            }

        }


        /*
        |--------------------------------------------------------------------------
        | FIND OR CREATE VILLAGE
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | There is NO predefined resident village list.
        |
        | The village comes directly from registration.
        |
        | Same village name = same village_id.
        |
        */

        let [
            villages
        ] = await pool.execute(

            `SELECT
                id,
                name,
                district,
                state
             FROM villages
             WHERE LOWER(TRIM(name))
                 = LOWER(TRIM(?))
             LIMIT 1`,

            [
                cleanVillageName
            ]

        );


        let villageId;
        let finalVillageName;


        if (
            villages.length > 0
        ) {

            /*
            |--------------------------------------------------------------------------
            | Existing village
            |--------------------------------------------------------------------------
            */

            villageId =
                villages[0].id;

            finalVillageName =
                villages[0].name;

        } else {

            /*
            |--------------------------------------------------------------------------
            | New village
            |--------------------------------------------------------------------------
            */

            const [
                villageResult
            ] = await pool.execute(

                `INSERT INTO villages
                (
                    name
                )
                VALUES (?)`,

                [
                    cleanVillageName
                ]

            );


            villageId =
                villageResult.insertId;


            finalVillageName =
                cleanVillageName;

        }


        /*
        |--------------------------------------------------------------------------
        | Hash password
        |--------------------------------------------------------------------------
        */

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );


        /*
        |--------------------------------------------------------------------------
        | Create user
        |--------------------------------------------------------------------------
        */

        const [
            userResult
        ] = await pool.execute(

            `INSERT INTO users
            (
                name,
                mobile,
                email,
                password_hash,
                village_id,
                occupation,
                role,
                status
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                'resident',
                'active'
            )`,

            [
                cleanName,
                cleanMobile,
                cleanEmail,
                passwordHash,
                villageId,
                cleanOccupation
            ]

        );


        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(201).json({

            success: true,

            message:
                "Registration successful. Please login.",

            user: {

                id:
                    userResult.insertId,

                name:
                    cleanName,

                mobile:
                    cleanMobile,

                email:
                    cleanEmail,

                village_id:
                    villageId,

                /*
                | Demo-compatible property
                */

                village:
                    finalVillageName,

                /*
                | Backend property
                */

                village_name:
                    finalVillageName,

                occupation:
                    cleanOccupation,

                role:
                    "resident",

                status:
                    "active"

            }

        });


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Registration failed.",

            error:
                error.message

        });

    }

};


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

exports.login = async (
    req,
    res
) => {

    try {

        const {
            mobile,
            password
        } = req.body;


        if (
            !mobile ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile number and password are required."

            });

        }


        const cleanMobile =
            String(mobile).trim();


        const [
            users
        ] = await pool.execute(

            `SELECT
                u.id,
                u.name,
                u.mobile,
                u.email,
                u.password_hash,
                u.village_id,
                u.occupation,
                u.role,
                u.status,

                v.name AS village_name

             FROM users u

             LEFT JOIN villages v
                ON v.id = u.village_id

             WHERE u.mobile = ?

             LIMIT 1`,

            [
                cleanMobile
            ]

        );


        if (
            users.length === 0
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid mobile number or password."

            });

        }


        const user =
            users[0];


        /*
        |--------------------------------------------------------------------------
        | Account status
        |--------------------------------------------------------------------------
        */

        if (
            user.status &&
            user.status !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is inactive. Please contact an administrator."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Password
        |--------------------------------------------------------------------------
        */

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid mobile number or password."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | JWT
        |--------------------------------------------------------------------------
        */

        const jwtSecret =
            process.env.JWT_SECRET;


        if (!jwtSecret) {

            console.error(
                "JWT_SECRET is not configured in .env"
            );

            return res.status(500).json({

                success: false,

                message:
                    "Server authentication configuration is missing."

            });

        }


        const token =
            jwt.sign(

                {
                    id:
                        user.id,

                    role:
                        user.role

                },

                jwtSecret,

                {
                    expiresIn:
                        "7d"
                }

            );


        delete user.password_hash;


        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | The demo uses currentUser.village.
        |
        | Therefore both names are supplied.
        |
        */

        user.village =
            user.village_name;


        return res.json({

            success: true,

            message:
                "Login successful.",

            token,

            user

        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Login failed.",

            error:
                error.message

        });

    }

};


/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

exports.getMe = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;


        const [
            users
        ] = await pool.execute(

            `SELECT
                u.id,
                u.name,
                u.mobile,
                u.email,
                u.village_id,

                v.name AS village_name,

                u.occupation,
                u.role,
                u.status,
                u.created_at,
                u.updated_at

             FROM users u

             LEFT JOIN villages v
                ON v.id = u.village_id

             WHERE u.id = ?

             LIMIT 1`,

            [
                userId
            ]

        );


        if (
            users.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        const user =
            users[0];


        if (
            user.status &&
            user.status !== "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your account is inactive."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Demo-compatible village property
        |--------------------------------------------------------------------------
        */

        user.village =
            user.village_name;


        return res.json({

            success: true,

            user

        });


    } catch (error) {

        console.error(
            "Get current user error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch user information.",

            error:
                error.message

        });

    }

};