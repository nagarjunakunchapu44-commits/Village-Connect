require("dotenv").config();

const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function createAdmin() {

    try {

        const name = "Village Connect Admin";
        const mobile = "9502123851";
        const email = "srinivasaraokunchapu09@gmail.com";
        const password = "123456789";

        const passwordHash =
            await bcrypt.hash(password, 10);

        const [existing] = await db.execute(
            "SELECT id FROM users WHERE mobile = ?",
            [mobile]
        );

        if (existing.length > 0) {

            await db.execute(
                `UPDATE users
                 SET role = 'admin',
                     password_hash = ?,
                     status = 'active'
                 WHERE mobile = ?`,
                [passwordHash, mobile]
            );

            console.log("Admin account updated.");

        } else {

            await db.execute(
                `INSERT INTO users
                (
                    name,
                    mobile,
                    email,
                    password_hash,
                    role,
                    status
                )
                VALUES (?, ?, ?, ?, 'admin', 'active')`,
                [
                    name,
                    mobile,
                    email,
                    passwordHash
                ]
            );

            console.log("Admin account created.");
        }

        console.log("");
        console.log("Admin Mobile: 9502123851");
        console.log("Admin Password: 123456789");

        process.exit(0);

    } catch (error) {

        console.error(
            "Admin creation failed:",
            error.message
        );

        process.exit(1);
    }
}

createAdmin();