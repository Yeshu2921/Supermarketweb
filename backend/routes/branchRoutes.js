
const express = require("express");

const {
  getBranches,
  createBranch,
  updateBranch,
  updateBranchStatus,
  deleteBranch,
} = require("../controllers/branchController");

const {
  authenticateToken,
  requireOwner,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated owners can manage branches.
router.use(authenticateToken, requireOwner);

router.get("/", getBranches);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.patch("/:id/status", updateBranchStatus);
router.delete("/:id", deleteBranch);

module.exports = router;
