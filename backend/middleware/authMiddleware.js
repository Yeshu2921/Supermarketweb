
const jwt = require("jsonwebtoken");
const pool = require("../db");

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      console.error("JWT_SECRET is missing or too short.");

      return res.status(500).json({
        message: "Authentication is not configured correctly.",
      });
    }

    const decoded = jwt.verify(token, secret);
    const userId = Number(decoded.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const [users] = await pool.execute(
      `SELECT id, role, is_active
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (users.length === 0 || Number(users[0].is_active) !== 1) {
      return res.status(401).json({
        message: "Your account is unavailable. Please log in again.",
      });
    }

    req.auth = {
      id: users[0].id,
      role: users[0].role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Your session is invalid or expired. Please log in again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Unable to verify your session.",
    });
  }
}

function requireOwner(req, res, next) {
  if (req.auth?.role !== "owner") {
    return res.status(403).json({
      message: "Only the owner can perform this action.",
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireOwner,
};
