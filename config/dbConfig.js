// Module to configure the connection for MySQL server
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
    // Set connection pool parameters
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 5
}).promise(); 

// Function to test the connection
async function testConnection() {
    try {
        await db.query('SELECT 1');
        console.log('Connected to MySQL');
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
}

testConnection();

module.exports = { db };
