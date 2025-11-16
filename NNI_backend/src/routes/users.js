const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Basic /api/users endpoints (protected by middleware in index.js)
// GET /api/users - list users (admin only)
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ users });
  } catch (err) {
    console.error("/api/users error:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

module.exports = router;
