// src/routes/users.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Validate email format
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// GET /api/users - List all users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: users, count: users.length });
  } catch (error) {
    req.log.error({ err: error, requestId: req.id }, "GET /api/users failed");
    res.status(500).json({ error: "Failed to fetch users", requestId: req.id });
  }
});

// POST /api/users - Create user
router.post("/", async (req, res) => {
  const { email, name, role } = req.body;

  // Validation
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  if (role && !["PUBLIC", "EDITOR", "ADMIN"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        role: role || "PUBLIC",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    req.log.info({ userId: user.id, email: user.email }, "User created");
    res.status(201).json({ data: user });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }
    req.log.error({ err: error, email }, "User creation failed");
    res.status(500).json({ error: "Failed to create user", requestId: req.id });
  }
});

// GET /api/users/:id - Get single user
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ data: user });
  } catch (error) {
    req.log.error({ err: error, userId: id }, "GET /api/users/:id failed");
    res.status(500).json({ error: "Failed to fetch user", requestId: req.id });
  }
});

module.exports = router;
