const express = require("express");

const {
  authenticateToken,
  requireOwner,
} = require("../middleware/authMiddleware");

const {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  resetPassword,
} = require("../controllers/userController");

const router = express.Router();

// Every user-management endpoint requires owner authentication.
router.use(authenticateToken, requireOwner);

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);
router.post("/:id/reset-password", resetPassword);

module.exports = router;