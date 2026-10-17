
const pool = require("../db");

// GET /api/branches
// Get all branches from MySQL
async function getBranches(req, res) {
  try {
    const [branches] = await pool.execute(`
      SELECT
        id,
        branch_number AS branchNumber,
        name,
        location,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt
      FROM branches
      ORDER BY id DESC
    `);

    res.status(200).json({ branches });
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({ message: "Failed to load branches." });
  }
}

// POST /api/branches
// Create a new branch
async function createBranch(req, res) {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const location =
      typeof req.body.location === "string"
        ? req.body.location.trim()
        : "";

    if (!name || !location) {
      return res.status(400).json({
        message: "Branch name and location are required.",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO branches (name, location, status)
       VALUES (?, ?, 'Active')`,
      [name, location]
    );

    const branchNumber = `BR-${String(result.insertId).padStart(4, "0")}`;

    await pool.execute(
      "UPDATE branches SET branch_number = ? WHERE id = ?",
      [branchNumber, result.insertId]
    );

    const [rows] = await pool.execute(
      `SELECT
        id,
        branch_number AS branchNumber,
        name,
        location,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt
       FROM branches
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Branch created successfully.",
      branch: rows[0],
    });
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({ message: "Failed to create branch." });
  }
}

// PUT /api/branches/:id
// Update a branch's name and location
async function updateBranch(req, res) {
  try {
    const id = Number(req.params.id);
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const location =
      typeof req.body.location === "string"
        ? req.body.location.trim()
        : "";

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid branch ID." });
    }

    if (!name || !location) {
      return res.status(400).json({
        message: "Branch name and location are required.",
      });
    }

    const [result] = await pool.execute(
      "UPDATE branches SET name = ?, location = ? WHERE id = ?",
      [name, location, id]
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        "SELECT id FROM branches WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "Branch not found." });
      }
    }

    const [rows] = await pool.execute(
      `SELECT
        id,
        branch_number AS branchNumber,
        name,
        location,
        status,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt
       FROM branches
       WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      message: "Branch updated successfully.",
      branch: rows[0],
    });
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({ message: "Failed to update branch." });
  }
}

// PATCH /api/branches/:id/status
// Change a branch's status
async function updateBranchStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "Active",
      "Inactive",
      "Temporarily Closed",
    ];

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid branch ID." });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid branch status." });
    }

    const [result] = await pool.execute(
      "UPDATE branches SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        "SELECT id FROM branches WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "Branch not found." });
      }
    }

    res.status(200).json({
      message: "Branch status updated successfully.",
      id,
      status,
    });
  } catch (error) {
    console.error("Update branch status error:", error);
    res.status(500).json({
      message: "Failed to update branch status.",
    });
  }
}

// DELETE /api/branches/:id
// Delete a branch
async function deleteBranch(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid branch ID." });
    }

    const [result] = await pool.execute(
      "DELETE FROM branches WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Branch not found." });
    }

    res.status(200).json({ message: "Branch deleted successfully." });
  } catch (error) {
    console.error("Delete branch error:", error);
    res.status(500).json({ message: "Failed to delete branch." });
  }
}

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  updateBranchStatus,
  deleteBranch,
};
