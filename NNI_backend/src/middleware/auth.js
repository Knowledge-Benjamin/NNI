const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Role priority for simple hierarchy checks
const ROLE_PRIORITY = {
  SUBSCRIBER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function verifyToken(req, res, next) {
  try {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication token missing" });
    }

    const token = auth.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach minimal user info to req; fetch fresh user record when needed
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.error("verifyToken error:", error);
    res.status(500).json({ error: "Server error during authentication" });
  }
}

function requireRole(minRole) {
  return (req, res, next) => {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Not authenticated" });
      const userPriority = ROLE_PRIORITY[req.user.role] || 0;
      const requiredPriority = ROLE_PRIORITY[minRole] || 0;
      if (userPriority < requiredPriority) {
        return res.status(403).json({ error: "Insufficient role privileges" });
      }
      return next();
    } catch (err) {
      console.error("requireRole error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  };
}

// Utility: securely compare password
async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = {
  signToken,
  verifyToken,
  requireRole,
  verifyPassword,
};
