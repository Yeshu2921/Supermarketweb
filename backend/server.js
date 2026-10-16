
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("./db");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

const ALLOWED_ROLES = ["admin", "worker", "supplier"];

// ========================
// VALIDATION HELPERS
// ========================

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Normalize Ethiopian phone numbers.
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0") && digits.length === 10) {
    return "+251" + digits.slice(1);
  }

  if (digits.startsWith("251") && digits.length === 12) {
    return "+" + digits;
  }

  if (digits.length === 9) {
    return "+251" + digits;
  }

  if (digits.length >= 7 && digits.length <= 15) {
    return "+" + digits;
  }

  return null;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validText(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function validateAddress(address) {
  return (
    address === undefined ||
    address === null ||
    (typeof address === "string" && address.trim().length <= 255)
  );
}

function handleError(error, res) {
  if (error.code === "ER_DUP_ENTRY") {
    const detail = error.message.toLowerCase();

    if (detail.includes("email")) {
      return res.status(409).json({
        message: "This email is already registered.",
        field: "email",
      });
    }

    if (detail.includes("phone")) {
      return res.status(409).json({
        message: "This phone number is already registered.",
        field: "phone",
      });
    }

    return res.status(409).json({
      message: "This information already exists.",
    });
  }

  console.error("API error:", error.message);

  return res.status(500).json({
    message: "A server error occurred. Please try again.",
  });
}

// ========================
// AUTHENTICATION
// ========================

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    return res.status(500).json({
      message: "Server authentication is not configured.",
    });
  }

  try {
    req.auth = jwt.verify(authorization.slice(7), secret);
    next();
  } catch {
    return res.status(401).json({
      message: "Your session has expired. Please log in again.",
    });
  }
}

function requireOwner(req, res, next) {
  if (req.auth.role !== "owner") {
    return res.status(403).json({
      message: "Only the owner can manage user accounts.",
    });
  }

  next();
}

// ========================
// HEALTH CHECK
// ========================

app.get("/api/health", (req, res) => {
  res.json({
    message: "FreshMart API is running successfully!",
  });
});

// ========================
// OWNER LOGIN
// ========================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, email,
              phone, address, password_hash, role, is_active
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizeEmail(email)]
    );

    const user = rows[0];

    if (!user || user.role !== "owner" || !user.is_active) {
      return res.status(401).json({
        message: "Invalid owner email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid owner email or password.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      return res.status(500).json({
        message: "Server authentication is not configured.",
      });
    }

    const token = jwt.sign(
      {
        sub: String(user.id),
        role: user.role,
      },
      secret,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
});

// ========================
// GET AND SEARCH USERS
// ========================

app.get(
  "/api/users",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const search = String(req.query.search || "").trim();

      const [users] = await pool.execute(
        `SELECT id, first_name, last_name, email, phone,
                address, role, is_active, created_at
         FROM users
         WHERE (
           ? = ''
           OR CAST(id AS CHAR) LIKE ?
           OR first_name LIKE ?
           OR last_name LIKE ?
           OR CONCAT(first_name, ' ', last_name) LIKE ?
           OR email LIKE ?
           OR phone LIKE ?
         )
         ORDER BY id DESC`,
        [
          search,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
        ]
      );

      return res.json({ users });
    } catch (error) {
      return handleError(error, res);
    }
  }
);

// ========================
// ADD USER
// Owner enters the default password.
// ========================

app.post(
  "/api/users",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        role,
        password,
      } = req.body;

      if (
        !validText(firstName, 100) ||
        !validText(lastName, 100) ||
        !validText(email, 190) ||
        !validText(phone, 30)
      ) {
        return res.status(400).json({
          message:
            "First name, last name, email, and phone are required.",
        });
      }

      if (!validateAddress(address)) {
        return res.status(400).json({
          message: "Address must be 255 characters or fewer.",
          field: "address",
        });
      }

      if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 72
      ) {
        return res.status(400).json({
          message: "Password must be between 8 and 72 characters.",
          field: "password",
        });
      }

      const cleanEmail = normalizeEmail(email);
      const cleanPhone = normalizePhone(phone);
      const cleanAddress = address?.trim() || null;

      if (!validEmail(cleanEmail)) {
        return res.status(400).json({
          message: "Enter a valid email address.",
          field: "email",
        });
      }

      if (!cleanPhone) {
        return res.status(400).json({
          message: "Enter a valid phone number.",
          field: "phone",
        });
      }

      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          message: "Choose Admin, Worker, or Supplier.",
          field: "role",
        });
      }

      const [duplicates] = await pool.execute(
        `SELECT email, phone
         FROM users
         WHERE email = ? OR phone = ?`,
        [cleanEmail, cleanPhone]
      );

      if (
        duplicates.some(
          (user) => user.email.toLowerCase() === cleanEmail
        )
      ) {
        return res.status(409).json({
          message: "This email is already registered.",
          field: "email",
        });
      }

      if (
        duplicates.some((user) => user.phone === cleanPhone)
      ) {
        return res.status(409).json({
          message: "This phone number is already registered.",
          field: "phone",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [result] = await pool.execute(
        `INSERT INTO users
          (first_name, last_name, email, phone, address,
           password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          firstName.trim(),
          lastName.trim(),
          cleanEmail,
          cleanPhone,
          cleanAddress,
          passwordHash,
          role,
        ]
      );

      return res.status(201).json({
        message: "User created successfully.",
        user: {
          id: result.insertId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          address: cleanAddress,
          role,
          is_active: 1,
        },
      });
    } catch (error) {
      return handleError(error, res);
    }
  }
);

// ========================
// EDIT USER
// ========================

app.put(
  "/api/users/:id",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    let connection;

    try {
      const userId = Number(req.params.id);

      if (!Number.isSafeInteger(userId) || userId < 1) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        role,
      } = req.body;

      if (
        !validText(firstName, 100) ||
        !validText(lastName, 100) ||
        !validText(email, 190) ||
        !validText(phone, 30)
      ) {
        return res.status(400).json({
          message:
            "First name, last name, email, and phone are required.",
        });
      }

      if (!validateAddress(address)) {
        return res.status(400).json({
          message: "Address must be 255 characters or fewer.",
          field: "address",
        });
      }

      const cleanEmail = normalizeEmail(email);
      const cleanPhone = normalizePhone(phone);
      const cleanAddress = address?.trim() || null;

      if (!validEmail(cleanEmail)) {
        return res.status(400).json({
          message: "Enter a valid email address.",
          field: "email",
        });
      }

      if (!cleanPhone) {
        return res.status(400).json({
          message: "Enter a valid phone number.",
          field: "phone",
        });
      }

      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          message: "Choose Admin, Worker, or Supplier.",
          field: "role",
        });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [currentRows] = await connection.execute(
        `SELECT id, role
         FROM users
         WHERE id = ?
         FOR UPDATE`,
        [userId]
      );

      if (!currentRows.length) {
        await connection.rollback();

        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (currentRows[0].role === "owner") {
        await connection.rollback();

        return res.status(403).json({
          message: "The owner account cannot be edited here.",
        });
      }

      const [duplicates] = await connection.execute(
        `SELECT email, phone
         FROM users
         WHERE (email = ? OR phone = ?)
           AND id <> ?`,
        [cleanEmail, cleanPhone, userId]
      );

      if (
        duplicates.some(
          (user) => user.email.toLowerCase() === cleanEmail
        )
      ) {
        await connection.rollback();

        return res.status(409).json({
          message: "This email is already registered.",
          field: "email",
        });
      }

      if (
        duplicates.some((user) => user.phone === cleanPhone)
      ) {
        await connection.rollback();

        return res.status(409).json({
          message: "This phone number is already registered.",
          field: "phone",
        });
      }

      await connection.execute(
        `UPDATE users
         SET first_name = ?, last_name = ?, email = ?,
             phone = ?, address = ?, role = ?
         WHERE id = ?`,
        [
          firstName.trim(),
          lastName.trim(),
          cleanEmail,
          cleanPhone,
          cleanAddress,
          role,
          userId,
        ]
      );

      await connection.commit();

      return res.json({
        message: "User updated successfully.",
      });
    } catch (error) {
      if (connection) await connection.rollback();
      return handleError(error, res);
    } finally {
      if (connection) connection.release();
    }
  }
);

// ========================
// ACTIVATE / DEACTIVATE
// ========================

app.patch(
  "/api/users/:id/status",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { isActive } = req.body;

      if (!Number.isSafeInteger(userId) || userId < 1) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          message: "isActive must be true or false.",
        });
      }

      const [rows] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [userId]
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (rows[0].role === "owner") {
        return res.status(403).json({
          message: "The owner account cannot be deactivated here.",
        });
      }

      await pool.execute(
        "UPDATE users SET is_active = ? WHERE id = ?",
        [isActive, userId]
      );

      return res.json({
        message: isActive
          ? "User activated successfully."
          : "User deactivated successfully.",
      });
    } catch (error) {
      return handleError(error, res);
    }
  }
);

// ========================
// DELETE ACTION
// Soft-delete to preserve records.
// ========================

app.delete(
  "/api/users/:id",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      if (!Number.isSafeInteger(userId) || userId < 1) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      const [rows] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [userId]
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (rows[0].role === "owner") {
        return res.status(403).json({
          message: "The owner account cannot be deleted.",
        });
      }

      await pool.execute(
        "UPDATE users SET is_active = 0 WHERE id = ?",
        [userId]
      );

      return res.json({
        message: "User account deactivated. Historical records are preserved.",
      });
    } catch (error) {
      return handleError(error, res);
    }
  }
);

// ========================
// RESET PASSWORD
// ========================

app.post(
  "/api/users/:id/reset-password",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { password } = req.body;

      if (!Number.isSafeInteger(userId) || userId < 1) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      // Owner supplies a new temporary password.
      if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 72
      ) {
        return res.status(400).json({
          message: "New password must be between 8 and 72 characters.",
          field: "password",
        });
      }

      const [rows] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [userId]
      );

      if (!rows.length) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (rows[0].role === "owner") {
        return res.status(403).json({
          message: "The owner password cannot be reset here.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await pool.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [passwordHash, userId]
      );

      return res.json({
        message: "Password reset successfully.",
      });
    } catch (error) {
      return handleError(error, res);
    }
  }
);

// ========================
// START SERVER
// ========================

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  const connection = await pool.getConnection();
  connection.release();

  app.listen(PORT, () => {
    console.log(
      `FreshMart API running at http://localhost:${PORT}`
    );
  });
}

startServer().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});
