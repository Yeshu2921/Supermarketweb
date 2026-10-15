
const mysql = require("mysql2/promise");
require("dotenv").config();

async function createDatabase() {
  let connection;

  try {
    // Connect to MySQL without selecting a database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    });

    // Create the database
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS freshmart_db
    `);

    console.log("Database created successfully.");

    // Select the database
    await connection.query("USE freshmart_db");

    // Create the users table
    
await connection.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(30) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    about_me TEXT DEFAULT NULL,
    profile_image VARCHAR(255) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'admin', 'worker', 'supplier')
      NOT NULL DEFAULT 'worker',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ON UPDATE CURRENT_TIMESTAMP
  )
`);


    console.log("Users table created successfully.");
    console.log("FreshMart database setup completed.");
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase();
