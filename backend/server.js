
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const branchRoutes = require("./routes/branchRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    message: "FreshMart API is running successfully!",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/branches", branchRoutes);
app.use("/api/categories", categoryRoutes);

// Return a response for unknown API endpoints.
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    connection.release();

    app.listen(PORT, () => {
      console.log(`FreshMart API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
