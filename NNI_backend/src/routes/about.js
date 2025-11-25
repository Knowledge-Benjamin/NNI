const express = require("express");
const prisma = require("../utils/prisma");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();


const ABOUT_SLUG = "about-nni";

function parseAboutContent(content) {
  // content may be plain HTML or a JSON stringified object with { type: 'about', sections: { ... } }
  if (!content) return { type: "legacy", sections: { html: "" } };
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.type === "about" && parsed.sections) {
      return parsed;
    }
    // not the expected structured format - return as legacy HTML
    return { type: "legacy", sections: { html: content } };
  } catch (e) {
    // not JSON
    return { type: "legacy", sections: { html: content } };
  }
}

// GET /api/about - returns the structured about sections (or legacy HTML fallback)
router.get("/", async (req, res) => {
  try {
    if (!prisma)
      return res.status(503).json({ error: "Database not configured" });

    const about = await prisma.about.findUnique({
      where: { slug: ABOUT_SLUG },
    });
    if (!about)
      return res.status(404).json({ error: "About record not found" });

    return res.json({
      slug: ABOUT_SLUG,
      data: { type: "about", sections: about.sections || {} },
    });
  } catch (error) {
    console.error("GET /api/about error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch about content", message: error.message });
  }
});

// GET single section
router.get("/sections/:section", async (req, res) => {
  try {
    const { section } = req.params;
    if (!prisma)
      return res.status(503).json({ error: "Database not configured" });

    const about = await prisma.about.findUnique({
      where: { slug: ABOUT_SLUG },
    });
    if (!about)
      return res.status(404).json({ error: "About record not found" });

    const sections = about.sections || {};
    const value = sections[section] || null;
    return res.json({ section, value, type: "about" });
  } catch (error) {
    console.error("GET /api/about/sections/:section error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch about section", message: error.message });
  }
});

// PATCH /api/about/sections/:section - update a single section (protected)
router.patch("/sections/:section", verifyToken, async (req, res) => {
  try {
    if (!prisma)
      return res.status(503).json({ error: "Database not configured" });
    const { section } = req.params;
    const payload = req.body && req.body.value;
    if (typeof payload === "undefined") {
      return res.status(400).json({ error: "Missing 'value' in request body" });
    }

    let about = await prisma.about.findUnique({ where: { slug: ABOUT_SLUG } });
    if (!about) {
      about = await prisma.about.create({
        data: { slug: ABOUT_SLUG, sections: { [section]: payload } },
      });
      return res.json({
        message: "About created",
        data: { type: "about", sections: about.sections || {} },
      });
    }

    const sections = Object.assign({}, about.sections || {});
    sections[section] = payload;
    const updated = await prisma.about.update({
      where: { id: about.id },
      data: { sections },
    });
    return res.json({
      message: "Section updated",
      data: { type: "about", sections: updated.sections || {} },
    });
  } catch (error) {
    console.error("PATCH /api/about/sections error:", error);
    res
      .status(500)
      .json({ error: "Failed to update section", message: error.message });
  }
});

// PUT /api/about - replace full sections object (protected)
router.put("/", verifyToken, async (req, res) => {
  try {
    if (!prisma)
      return res.status(503).json({ error: "Database not configured" });
    const sections = req.body && req.body.sections;
    if (!sections || typeof sections !== "object") {
      return res.status(400).json({
        error: "Missing or invalid 'sections' object in request body",
      });
    }

    let about = await prisma.about.findUnique({ where: { slug: ABOUT_SLUG } });
    if (!about) {
      about = await prisma.about.create({
        data: { slug: ABOUT_SLUG, sections },
      });
      return res.json({
        message: "About created",
        data: { type: "about", sections: about.sections || {} },
      });
    }

    const updated = await prisma.about.update({
      where: { id: about.id },
      data: { sections },
    });
    return res.json({
      message: "About updated",
      data: { type: "about", sections: updated.sections || {} },
    });
  } catch (error) {
    console.error("PUT /api/about error:", error);
    res.status(500).json({
      error: "Failed to replace about content",
      message: error.message,
    });
  }
});

module.exports = router;
