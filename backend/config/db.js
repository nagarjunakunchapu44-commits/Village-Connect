
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
    let connection;

    try {
        connection = await pool.getConnection();

        console.log("MySQL database connected successfully");
        console.log(`Database: ${dbName}`);
        console.log(`Host: ${dbHost}`);
        console.log(`Port: ${dbPort}`);
        console.log(`User: ${dbUser}`);

    } catch (error) {
        console.error("MySQL connection failed!");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

testDatabase();

module.exports = pool;
