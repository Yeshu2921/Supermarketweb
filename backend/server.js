
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

// Test whether the backend is running
app.get("/api/health", (req, res) => {
  res.json({
    message: "FreshMart API is running successfully!",
  });
});

// Owner login API
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
              password_hash, role, is_active
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (
      !user ||
      user.role !== "owner" ||
      !user.is_active
    ) {
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
      console.error("JWT_SECRET is missing or too short.");

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
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to process login.",
    });
  }
});

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
