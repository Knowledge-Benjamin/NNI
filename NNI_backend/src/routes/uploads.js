const express = require("express");
const router = express.Router();
const { upload } = require("../utils/upload");

// POST /api/uploads/imgbb
// Accepts multipart/form-data file field named `image` and forwards
// the file to ImgBB using the server-side API key (process.env.IMGBB_KEY).
router.post("/imgbb", upload.single("image"), async (req, res) => {
  try {
    const key = process.env.IMGBB_KEY;
    if (!key) {
      return res
        .status(500)
        .json({ error: "Server missing IMGBB_KEY environment variable" });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ImgBB accepts base64-encoded image in the `image` field.
    const base64 = req.file.buffer.toString("base64");

    const params = new URLSearchParams();
    params.append("image", base64);

    const url = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const json = await resp.json().catch(() => null);
    if (!resp.ok || !json || json.status !== 200) {
      return res
        .status(502)
        .json({ error: "ImgBB upload failed", body: json || null });
    }

    // Return ImgBB data to the client so the frontend can insert the image
    // URL into the editor or use it as a featured image.
    return res.json({ data: json.data });
  } catch (error) {
    console.error("Error proxying upload to ImgBB:", error);
    return res
      .status(500)
      .json({ error: "Upload failed", message: error.message });
  }
});

module.exports = router;
