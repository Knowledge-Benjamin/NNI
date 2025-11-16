/**
 * One-off migration script to copy existing article with slug 'about-nni'
 * into the new About table. Run after applying Prisma migrations.
 *
 * Usage:
 *   node prisma/scripts/migrate_about_from_article.js
 */

const { PrismaClient } = require("@prisma/client");

async function run() {
  const prisma = new PrismaClient();
  try {
    const article = await prisma.article.findUnique({
      where: { slug: "about-nni" },
    });
    if (!article) {
      console.log(
        "No article with slug 'about-nni' found. Nothing to migrate."
      );
      return;
    }

    let sections = {};
    try {
      const parsed = JSON.parse(article.content || "");
      if (parsed && parsed.type === "about" && parsed.sections) {
        sections = parsed.sections;
      } else {
        // legacy HTML content - store as html fallback
        sections = { html: article.content };
      }
    } catch (e) {
      sections = { html: article.content };
    }

    // Upsert into About table
    const existing = await prisma.about.findUnique({
      where: { slug: "about-nni" },
    });
    if (existing) {
      const updated = await prisma.about.update({
        where: { id: existing.id },
        data: { sections },
      });
      console.log("Updated About record:", updated.id);
    } else {
      const created = await prisma.about.create({
        data: { slug: "about-nni", sections },
      });
      console.log("Created About record:", created.id);
    }

    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {}
  }
}

run();
