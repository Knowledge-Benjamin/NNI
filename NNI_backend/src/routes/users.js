const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");


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
    res.json({ users, count: users.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/:id - Get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("/api/users/:id error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// PUT /api/users/:id - Update user details
router.put("/:id", async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    console.error("/api/users PUT error:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to update user" });
  }
});

// PATCH /api/users/:id/role - Change user role (admin only)
router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["ADMIN", "EDITOR", "SUBSCRIBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be ADMIN, EDITOR, or SUBSCRIBER" });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    console.error("/api/users PATCH role error:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to update role" });
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/:id", async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("/api/users DELETE error:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
