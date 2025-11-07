const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Generate dynamic sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.SITE_BASE_URL ||
      "https://nni.news";

    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const rows = articles
      .map((article) => {
        const slug = article.slug || "";
        const loc = `${baseUrl}/${encodeURIComponent(slug)}`;
        const lastmod = article.updatedAt
          ? new Date(article.updatedAt).toISOString()
          : new Date().toISOString();
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      })
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n${rows}\n</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (err) {
    req.log && req.log.error({ err }, "Failed to generate sitemap");
    res
      .status(500)
      .send('<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>');
  }
});

module.exports = router;
