
require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createOwner() {
  const firstName = process.env.OWNER_FIRST_NAME;
  const lastName = process.env.OWNER_LAST_NAME;
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;

  if (!firstName || !lastName || !email || !password) {
    throw new Error("Please configure all OWNER_* values in .env");
  }

  if (password.length < 12) {
    throw new Error("Owner password must be at least 12 characters.");
  }

  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (existing.length > 0) {
    console.log("An account with this email already exists.");
    console.log("No account was changed.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.execute(
    `INSERT INTO users
      (first_name, last_name, email, password_hash, role)
     VALUES (?, ?, ?, ?, 'owner')`,
    [firstName, lastName, email, passwordHash]
  );

  console.log("Owner account created successfully!");
  console.log("Email:", email);
  console.log("Role: owner");
}

createOwner()
  .catch((error) => {
    console.error("Owner setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
