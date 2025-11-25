const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");
const { signToken, verifyToken } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const router = express.Router();


// Rate limiter for login attempts (per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts from this IP, please try again later.",
  },
});

// Precompute a dummy bcrypt hash to mitigate timing attacks when user not found
const DUMMY_HASH = bcrypt.hashSync(
  process.env.DUMMY_PASSWORD || "invalid_password",
  parseInt(process.env.BCRYPT_ROUNDS || "12", 10)
);

// Lockout policy
const MAX_FAILED = parseInt(process.env.MAX_FAILED_LOGIN || "5", 10);
const LOCK_MINUTES = parseInt(process.env.ACCOUNT_LOCK_MINUTES || "15", 10);

// Register - creates a SUBSCRIBER by default
router.post("/register", async (req, res) => {
  try {
    // Sanitize and normalize inputs
    const rawName = req.body.name;
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    const name = typeof rawName === "string" ? sanitizeName(rawName) : null;
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";

    // Basic presence checks
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    // Validate email format and length
    if (email.length > 254 || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Password policy: minimum length and complexity
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 10 characters and include uppercase, lowercase and a number",
      });
    }

    // Limit name length and sanitize
    if (name && name.length > 100)
      return res.status(400).json({ error: "Name is too long" });

    // Normalize email uniqueness check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    // Bcrypt rounds configurable (env) with safe default
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10) || 12;
    const salt = await bcrypt.genSalt(rounds);
    const hashed = await bcrypt.hash(password, salt);

    // Create user - Prisma uses parameterized queries so SQL injection is mitigated
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "SUBSCRIBER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Try to create a newsletter subscription in Beehiiv for this user.
    // This is best-effort: do not fail the registration if the newsletter
    // provider is unavailable. Use the Publication Subscriptions endpoint.
    (async () => {
      try {
        const apiKey = process.env.BEEHIIV_KEY;
        const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
        if (!apiKey || !publicationId) return;

        const fetchFn =
          typeof fetch === "function"
            ? fetch
            : (await import("node-fetch")).default;
        const url = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`;

        // Split name into first/last
        let first_name = "";
        let last_name = "";
        if (user.name) {
          const parts = user.name.trim().split(/\s+/);
          first_name = parts.shift() || "";
          last_name = parts.join(" ") || "";
        }

        const payload = {
          email: user.email,
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          reactivate_existing: false,
          send_welcome_email: false,
        };
        Object.keys(payload).forEach(
          (k) => payload[k] === undefined && delete payload[k]
        );

        const resp = await fetchFn(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          let data;
          try {
            data = await resp.json();
          } catch (e) {
            data = null;
          }
          console.warn(
            "Beehiiv subscription failed for",
            user.email,
            data || resp.status
          );
        }
      } catch (e) {
        console.warn("Beehiiv subscription attempt error", e && e.message);
      }
    })();

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    res.status(201).json({ user, token });
  } catch (err) {
    // Don't leak internal error details to clients
    console.error("/register error", err);
    res.status(500).json({ error: "Failed to register" });
  }
});

// --- Helpers (sanitization & validation) ---
function sanitizeName(input) {
  // Remove tags and control characters, collapse whitespace
  const noTags = input.replace(/<[^>]*>?/gm, "");
  const noControl = noTags.replace(/[\x00-\x1F\x7F]/g, "");
  return noControl.trim().replace(/\s{2,}/g, " ");
}

function isValidEmail(email) {
  // Simple but robust email validation. Avoid full RFC complexity here.
  const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return rx.test(email);
}

function isStrongPassword(pw) {
  // Minimum 10 chars, at least one lowercase, one uppercase and one digit
  if (pw.length < 10) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
}

// Login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    if (!isValidEmail(email))
      return res.status(400).json({ error: "Invalid email format" });

    const user = await prisma.user.findUnique({ where: { email } });

    const now = new Date();

    // If user exists and is locked, respond with locked status
    if (user && user.lockedUntil && new Date(user.lockedUntil) > now) {
      return res.status(423).json({
        error:
          "Account temporarily locked due to multiple failed login attempts. Try again later.",
      });
    }

    // Compare password (use dummy hash if user not found to mitigate timing attacks)
    const hashToCompare = user ? user.password : DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!passwordMatch) {
      // If user exists, increment failed attempts and possibly lock the account
      if (user) {
        const newCount = (user.failedLoginAttempts || 0) + 1;
        const updates = { failedLoginAttempts: { set: newCount } };
        if (newCount >= MAX_FAILED) {
          const lockUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
          updates.lockedUntil = lockUntil;
          updates.failedLoginAttempts = { set: 0 };
        }
        await prisma.user.update({ where: { id: user.id }, data: updates });
      }

      // Generic message to avoid revealing whether user exists
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Successful login: reset counters
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { set: 0 }, lockedUntil: null },
      });
    }

    // Issue JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("/login error", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Get current user
router.get("/me", verifyToken, async (req, res) => {
  try {
    // req.user is attached by verifyToken
    res.json({ user: req.user });
  } catch (err) {
    console.error("/me error", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
