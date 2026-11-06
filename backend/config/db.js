require("dotenv").config();

const mysql = require("mysql2/promise");

const dbHost = process.env.DB_HOST || "localhost";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "village_connect";
const dbPort = Number(process.env.DB_PORT || 3306);

const pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDatabase() {
    try {
        const connection = await pool.getConnection();

        console.log("MySQL database connected successfully");
        console.log(
            `Database: ${dbName} | Host: ${dbHost}:${dbPort} | User: ${dbUser}`
        );

        connection.release();
    } catch (error) {
        console.error("MySQL connection failed:");
        console.error(error.message);
    }
}

testDatabase();

module.exports = pool;