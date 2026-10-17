
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { normalizeEmail, validEmail } = require("../utils/validation");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !validEmail(email.trim()) ||
      typeof password !== "string" ||
      password.length === 0
    ) {
      return res.status(400).json({
        message: "Enter a valid email and password.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const [users] = await pool.execute(
      `SELECT id, first_name, last_name, email, phone, address,
              password_hash, role, is_active
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    if (
      user.role !== "owner" ||
      Number(user.is_active) !== 1
    ) {
      return res.status(403).json({
        message: "This login is currently available to the owner only.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      console.error("JWT_SECRET is missing or too short.");

      return res.status(500).json({
        message: "Authentication is not configured correctly.",
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
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in right now.",
    });
  }
}

module.exports = { login };
