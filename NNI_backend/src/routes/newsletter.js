const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// stricter rate limit for newsletter signups to avoid abuse
const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // max 10 submissions per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many newsletter signups from this IP, try later." },
});

function sanitizeText(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", newsletterLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body || {};

    const fn = sanitizeText(firstName);
    const ln = sanitizeText(lastName);
    const em = sanitizeText(email).toLowerCase();

    if (!fn || !ln) {
      return res
        .status(400)
        .json({ error: "Please provide first and last name." });
    }
    if (!isValidEmail(em)) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    const apiKey = process.env.BEEHIIV_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

    if (!apiKey || !publicationId) {
      req.log &&
        req.log.warn("Beehiiv key or publication id not configured on server");
      return res
        .status(500)
        .json({ error: "Newsletter service not configured." });
    }

  // Use the documented v2 Create Subscription endpoint for a publication
  // Endpoint: POST https://api.beehiiv.com/v2/publications/:publicationId/subscriptions
  const url = `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`;

    // Use global fetch (Node 18+) or fallback to require('node-fetch') if available
    const fetchFn =
      typeof fetch === "function"
        ? fetch
        : (await import("node-fetch")).default;

    // According to the docs, create subscription for a publication expects at minimum an email.
    // Optional flags like `reactivate_existing` or `send_welcome_email` can be provided.
    const body = {
      email: em,
      // optional metadata
      first_name: fn || undefined,
      last_name: ln || undefined,
      reactivate_existing: false,
      send_welcome_email: false,
    };

    // Remove undefined values to keep payload small
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);


    let resp;
    try {
      resp = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      req.log &&
        req.log.error(
          { err: networkErr },
          "Network error when calling Beehiiv"
        );
      return res
        .status(502)
        .json({ error: "Failed to contact newsletter provider" });
    }

    // Try to parse JSON, otherwise capture text
    let data;
    let rawText = null;
    try {
      data = await resp.json();
    } catch (e) {
      try {
        rawText = await resp.text();
      } catch (e2) {
        rawText = null;
      }
      data = null;
    }


    if (!resp.ok) {
      // log full response for debugging
      req.log &&
        req.log.warn(
          { status: resp.status, beehiiv: data || rawText },
          "Beehiiv returned error"
        );
      const beeMsg =
        (data && (data.error || data.message)) ||
        rawText ||
        "Failed to subscribe";
      // Return a more descriptive error in dev to help debugging (keep generic in prod)
      const clientMsg =
        process.env.NODE_ENV === "production"
          ? "Failed to subscribe"
          : `Beehiiv error (status ${resp.status}): ${String(beeMsg)}`;
      return res.status(502).json({ error: clientMsg });
    }

    return res.status(201).json({ success: true });
  } catch (err) {
    req.log && req.log.error({ err }, "Newsletter signup failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
