
const express = require("express");

const {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  authenticateToken,
  requireOwner,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Category management is restricted to the owner.
router.use(authenticateToken, requireOwner);

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/:id/status", updateCategoryStatus);
router.delete("/:id", deleteCategory);

module.exports = router;
