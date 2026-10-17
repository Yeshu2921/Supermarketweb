
const pool = require("../db");

// Get all categories, including parent names and usage counts.
async function getCategories(req, res) {
  try {
    const [categories] = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.parent_id,
        c.description,
        c.is_active,
        c.created_at,
        parent.name AS parent_name,
        (
          SELECT COUNT(*)
          FROM categories child
          WHERE child.parent_id = c.id
        ) AS subcategory_count,
        (
          SELECT COUNT(*)
          FROM products p
          WHERE p.category_id = c.id
        ) AS product_count
      FROM categories c
      LEFT JOIN categories parent ON parent.id = c.parent_id
      ORDER BY c.name ASC
    `);

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Failed to load categories." });
  }
}

// Add a new category or subcategory.
async function createCategory(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const parentId =
      req.body.parent_id === "" ||
      req.body.parent_id === undefined ||
      req.body.parent_id === null
        ? null
        : Number(req.body.parent_id);

    if (!name) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        message: "Category name cannot exceed 100 characters.",
      });
    }

    if (
      parentId !== null &&
      (!Number.isInteger(parentId) || parentId <= 0)
    ) {
      return res.status(400).json({
        message: "Please select a valid parent category.",
      });
    }

    if (parentId !== null) {
      const [parents] = await pool.query(
        "SELECT id FROM categories WHERE id = ?",
        [parentId]
      );

      if (parents.length === 0) {
        return res.status(400).json({
          message: "The selected parent category does not exist.",
        });
      }
    }

    // Check duplicates, including duplicate top-level categories.
    const [duplicates] = await pool.query(
      `SELECT id FROM categories
       WHERE name = ?
       AND (
         (parent_id IS NULL AND ? IS NULL)
         OR parent_id = ?
       )`,
      [name, parentId, parentId]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: "This category already exists under the selected parent.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO categories (name, parent_id, description)
       VALUES (?, ?, ?)`,
      [name, parentId, description || null]
    );

    res.status(201).json({
      message: "Category created successfully!",
      categoryId: result.insertId,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Failed to create category." });
  }
}

// Edit an existing category.
async function updateCategory(req, res) {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const parentId =
      req.body.parent_id === "" ||
      req.body.parent_id === undefined ||
      req.body.parent_id === null
        ? null
        : Number(req.body.parent_id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    if (!name) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        message: "Category name cannot exceed 100 characters.",
      });
    }

    if (
      parentId !== null &&
      (!Number.isInteger(parentId) || parentId <= 0)
    ) {
      return res.status(400).json({
        message: "Please select a valid parent category.",
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM categories WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    if (parentId === id) {
      return res.status(400).json({
        message: "A category cannot be its own parent.",
      });
    }

    if (parentId !== null) {
      // A category cannot become its own descendant.
      const [descendants] = await pool.query(
        `WITH RECURSIVE category_tree AS (
           SELECT id FROM categories WHERE id = ?
           UNION ALL
           SELECT c.id
           FROM categories c
           INNER JOIN category_tree t ON c.parent_id = t.id
         )
         SELECT id FROM category_tree WHERE id = ? LIMIT 1`,
        [id, parentId]
      );

      if (descendants.length > 0) {
        return res.status(400).json({
          message: "You cannot select a subcategory as its own ancestor.",
        });
      }

      const [parents] = await pool.query(
        "SELECT id FROM categories WHERE id = ?",
        [parentId]
      );

      if (parents.length === 0) {
        return res.status(400).json({
          message: "The selected parent category does not exist.",
        });
      }
    }

    const [duplicates] = await pool.query(
      `SELECT id FROM categories
       WHERE name = ?
       AND id <> ?
       AND (
         (parent_id IS NULL AND ? IS NULL)
         OR parent_id = ?
       )`,
      [name, id, parentId, parentId]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: "This category already exists under the selected parent.",
      });
    }

    await pool.query(
      `UPDATE categories
       SET name = ?, parent_id = ?, description = ?
       WHERE id = ?`,
      [name, parentId, description || null, id]
    );

    res.json({ message: "Category updated successfully!" });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Failed to update category." });
  }
}

// Activate or deactivate a category.
async function updateCategoryStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const isActive = req.body.is_active;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "A valid category status is required.",
      });
    }

    const [result] = await pool.query(
      "UPDATE categories SET is_active = ? WHERE id = ?",
      [isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.json({
      message: `Category ${isActive ? "activated" : "deactivated"} successfully!`,
    });
  } catch (error) {
    console.error("Update category status error:", error);
    res.status(500).json({ message: "Failed to update category status." });
  }
}

// Delete only categories that have no subcategories or products.
async function deleteCategory(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    const [categories] = await pool.query(
      "SELECT id FROM categories WHERE id = ?",
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    const [children] = await pool.query(
      "SELECT COUNT(*) AS total FROM categories WHERE parent_id = ?",
      [id]
    );

    if (Number(children[0].total) > 0) {
      return res.status(409).json({
        message: "Move or delete this category's subcategories before deleting it.",
      });
    }

    const [products] = await pool.query(
      "SELECT COUNT(*) AS total FROM products WHERE category_id = ?",
      [id]
    );

    if (Number(products[0].total) > 0) {
      return res.status(409).json({
        message: "This category is used by products. Reassign those products before deleting it.",
      });
    }

    await pool.query("DELETE FROM categories WHERE id = ?", [id]);

    res.json({ message: "Category deleted successfully!" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Failed to delete category." });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
};
