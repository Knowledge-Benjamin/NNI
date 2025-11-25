const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");


// Generate dynamic sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
  try {
    // THIS IS THE ONLY LINE THAT MATTERS
    const baseUrl = "https://www.nni.news/article";

    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const rows = articles
      .map((article) => {
        const slug = article.slug?.trim();
        if (!slug) return "";

        const loc = `${baseUrl}/${encodeURIComponent(slug)}`;
        const lastmod = article.updatedAt
          ? new Date(article.updatedAt).toISOString()
          : new Date().toISOString();

        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .filter(Boolean)
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.nni.news/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${rows}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (err) {
    console.error("Sitemap error:", err);
    res
      .status(500)
      .header("Content-Type", "application/xml")
      .send(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
      );
  }
});

module.exports = router;
