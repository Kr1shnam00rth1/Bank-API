// Module to configure the connection for MySQL server

const mysql = require('mysql2');

const db = mysql.createPool({
    // Set connection pool parameters
    host: '127.0.0.1',
    user: 'root',
    password: 'mysql',
    database: 'bms',
    port: 3306,
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
