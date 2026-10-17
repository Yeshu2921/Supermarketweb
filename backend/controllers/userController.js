const bcrypt = require("bcryptjs");
const pool = require("../db");
const handleError = require("../utils/handleError");

const {
  normalizeEmail,
  normalizePhone,
  validEmail,
  validText,
  validateAddress,
  validRole,
  validPassword,
} = require("../utils/validation");

function validId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

// GET /api/users
async function getUsers(req, res) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    // The frontend requests inactive users too so it can filter them.
    const includeInactive = req.query.includeInactive === "true";

    const sql = `
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        about_me,
        profile_image,
        role,
        is_active,
        created_at,
        updated_at
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
      AND (? = 1 OR is_active = 1)
      ORDER BY id DESC
    `;

    const searchTerm = `%${search}%`;

    const [users] = await pool.execute(sql, [
      search,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      includeInactive ? 1 : 0,
    ]);

    return res.json({ users });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/users
async function createUser(req, res) {
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

    if (!validText(firstName, 100)) {
      return res.status(400).json({
        message: "Enter a first name (maximum 100 characters).",
      });
    }

    if (!validText(lastName, 100)) {
      return res.status(400).json({
        message: "Enter a last name (maximum 100 characters).",
      });
    }

    if (typeof email !== "string" || !validEmail(email.trim())) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      phone !== "" &&
      !normalizePhone(phone)
    ) {
      return res.status(400).json({
        message: "Enter a valid phone number.",
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        message: "Address must not exceed 255 characters.",
      });
    }

    if (!validRole(role)) {
      return res.status(400).json({
        message: "Choose a valid role: admin, worker, or supplier.",
      });
    }

    if (!validPassword(password)) {
      return res.status(400).json({
        message: "Password must contain between 8 and 72 characters.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = phone ? normalizePhone(phone) : null;
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users
        (first_name, last_name, email, phone, address,
         password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        firstName.trim(),
        lastName.trim(),
        normalizedEmail,
        normalizedPhone,
        address?.trim() || null,
        passwordHash,
        role,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      userId: result.insertId,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PUT /api/users/:id
async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!validId(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      role,
    } = req.body;

    if (!validText(firstName, 100) || !validText(lastName, 100)) {
      return res.status(400).json({
        message: "First name and last name are required.",
      });
    }

    if (typeof email !== "string" || !validEmail(email.trim())) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      phone !== "" &&
      !normalizePhone(phone)
    ) {
      return res.status(400).json({
        message: "Enter a valid phone number.",
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        message: "Address must not exceed 255 characters.",
      });
    }

    if (!validRole(role)) {
      return res.status(400).json({ message: "Invalid user role." });
    }

    const [existing] = await pool.execute(
      "SELECT id, role FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    // The owner account must not be changed through worker management.
    if (existing[0].role === "owner") {
      return res.status(403).json({
        message: "The owner account cannot be edited here.",
      });
    }

    await pool.execute(
      `UPDATE users
       SET first_name = ?,
           last_name = ?,
           email = ?,
           phone = ?,
           address = ?,
           role = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        firstName.trim(),
        lastName.trim(),
        normalizeEmail(email),
        phone ? normalizePhone(phone) : null,
        address?.trim() || null,
        role,
        id,
      ]
    );

    return res.json({
      success: true,
      message: "User updated successfully.",
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// PATCH /api/users/:id/status
async function updateUserStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;

    if (!validId(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false.",
      });
    }

    const [users] = await pool.execute(
      "SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    if (users[0].role === "owner") {
      return res.status(403).json({
        message: "The owner account cannot be deactivated here.",
      });
    }

    await pool.execute(
      `UPDATE users
       SET is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [isActive ? 1 : 0, id]
    );

    return res.json({
      success: true,
      message: isActive
        ? "User activated successfully."
        : "User deactivated successfully.",
      userId: id,
      isActive,
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// DELETE /api/users/:id
// This deactivates the account; it does not physically erase the database row.
async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    // Check whether the user exists.
    const [users] = await pool.execute(
      "SELECT id, role FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found. It may already be deleted.",
      });
    }

    // Protect the owner account.
    if (users[0].role === "owner") {
      return res.status(403).json({
        message: "The owner account cannot be deleted.",
      });
    }

    // PERMANENTLY DELETE the user from MySQL.
    const [result] = await pool.execute(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found or already deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully!",
      deletedUserId: id,
    });
  } catch (error) {
    console.error("Delete user error:", error.code, error.message);

    // A related table may prevent deletion because of a foreign key.
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "This user is linked to other records, so MySQL prevented permanent deletion. Check the related foreign keys.",
      });
    }

    return handleError(error, res);
  }
}

// POST /api/users/:id/reset-password
async function resetPassword(req, res) {
  try {
    const id = Number(req.params.id);
    const { password } = req.body;

    if (!validId(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    if (!validPassword(password)) {
      return res.status(400).json({
        message: "Password must contain between 8 and 72 characters.",
      });
    }

    const [users] = await pool.execute(
      "SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    if (users[0].role === "owner") {
      return res.status(403).json({
        message: "The owner password cannot be reset here.",
      });
    }

    if (Number(users[0].is_active) !== 1) {
      return res.status(400).json({
        message: "Activate this user before resetting the password.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute(
      `UPDATE users
       SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, id]
    );

    return res.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    return handleError(error, res);
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  resetPassword,
};