const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { verifyToken } = require("../middleware/auth");
const { upload, handleGcsUpload } = require("../utils/upload");
const { deleteFromGCS } = require("../utils/gcs");

const router = express.Router();

// Initialize Prisma client if DATABASE_URL is configured
let prisma = null;
try {
  if (process.env.DATABASE_URL) {
    prisma = new PrismaClient();
  } else {
    console.warn(
      "DATABASE_URL not set - running without database (read-only stub responses)"
    );
  }
} catch (err) {
  console.error("Failed to initialize Prisma client:", err);
  prisma = null;
}

// Development stub data (used only when DATABASE_URL is not provided)
const DEV_SAMPLE_ARTICLES = [
  {
    id: "article-1",
    title: "Women's Basketball Semifinals Preview And Schedule",
    slug: "womens-basketball-semifinals-preview",
    excerpt:
      "The inaugural Olympic basketball semifinals are set to showcase incredible talent with USA facing Australia in a highly anticipated matchup.",
    content:
      "<p>The women's basketball tournament reaches its climax with four powerhouse teams vying for Olympic glory. Team USA, led by their stellar guard play, will face a resilient Australian side that has shown remarkable form throughout the tournament.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?basketball,women",
    author: {
      id: "author-1",
      name: "Leslie Alexander",
      email: "leslie.alexander@olympics.com",
    },
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    readTime: 4,
  },
  {
    id: "article-2",
    title: "Boom, Snoop Dogg Breaking Electrifies Paris 2024 Olympics",
    slug: "breaking-olympics-snoop-dogg",
    excerpt:
      "The inaugural Olympic breaking competition kicked off at La Concorde with an unexpected guest performance.",
    content:
      "<p>Breaking's Olympic debut received a massive boost as hip-hop legend Snoop Dogg made a surprise appearance at the venue, elevating the already electric atmosphere to new heights.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?breakdancing",
    author: {
      id: "author-2",
      name: "Marcus Rodriguez",
      email: "m.rodriguez@olympics.com",
    },
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    readTime: 3,
  },
  {
    id: "article-3",
    title: "Carlos Nassar wins 89kg gold and breaks World Record",
    slug: "carlos-nassar-weightlifting-gold",
    excerpt:
      "Bulgaria's Carlos Nassar secured the men's weightlifting 89kg gold medal at Paris 2024 with a stunning world record performance.",
    content:
      "<p>In a display of sheer power and technique, Carlos Nassar not only claimed Olympic gold but also shattered the world record with an incredible lift of 175kg in the clean and jerk.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?weightlifting",
    author: {
      id: "author-3",
      name: "Elena Petrova",
      email: "e.petrova@olympics.com",
    },
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    readTime: 6,
  },
  {
    id: "article-4",
    title: "The People's Republic of China reigns supreme in men's team",
    slug: "china-mens-team-gold",
    excerpt:
      "The Chinese men's table tennis team continued their Olympic dominance with another gold medal performance.",
    content:
      "<p>China's supremacy in table tennis remained unchallenged as their men's team secured yet another Olympic gold, extending their remarkable winning streak in the sport.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?table-tennis",
    author: {
      id: "author-4",
      name: "Wei Chang",
      email: "w.chang@olympics.com",
    },
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    readTime: 5,
  },
  {
    id: "article-5",
    title: "3x3 Basketball Stars Shine: Top Highlights in Video",
    slug: "3x3-basketball-highlights",
    excerpt:
      "Watch the most spectacular plays from the 3x3 basketball tournament that has taken Paris by storm.",
    content:
      "<p>The fast-paced, high-intensity 3x3 basketball format has produced countless memorable moments. Here are the top plays that have defined the tournament so far.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?street-basketball",
    isVideo: true,
    videoDuration: "3:45",
    author: {
      id: "author-5",
      name: "Jerome Thompson",
      email: "j.thompson@olympics.com",
    },
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    readTime: 2,
  },
  {
    id: "article-6",
    title: "How to watch women's football Spain vs. Germany",
    slug: "womens-football-spain-germany-guide",
    excerpt:
      "Everything you need to know about the highly anticipated women's football semifinal between Spain and Germany.",
    content:
      "<p>Don't miss this crucial matchup between two of women's football's powerhouses. Here's your complete guide to watching the game, including broadcast times and expert predictions.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?soccer,women",
    isVideo: true,
    videoDuration: "2:30",
    author: {
      id: "author-6",
      name: "Sarah Mitchell",
      email: "s.mitchell@olympics.com",
    },
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    readTime: 2,
  },
  {
    id: "article-7",
    title: "Refugee athlete Farzad Mansouri falls just short of quarters",
    slug: "refugee-athlete-mansouri-olympic-journey",
    excerpt:
      "Despite a valiant effort, refugee athlete Farzad Mansouri's Olympic journey ends in a heartbreaking loss.",
    content:
      "<p>In one of the most inspiring stories of the Games, Farzad Mansouri came within points of making Olympic history for the Refugee Olympic Team.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?athlete,portrait",
    author: {
      id: "author-7",
      name: "Ahmed Hassan",
      email: "a.hassan@olympics.com",
    },
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
    readTime: 4,
  },
  {
    id: "article-8",
    title: "Uzbekistan's Rashitov defends Olympic men's -68kg taekwondo title",
    slug: "rashitov-taekwondo-gold-defense",
    excerpt:
      "Ulugbek Rashitov successfully defends his Olympic title in a thrilling final match.",
    content:
      "<p>The Uzbek champion showed why he's considered one of taekwondo's greatest as he secured his second consecutive Olympic gold medal in a masterful performance.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?martial-arts",
    author: {
      id: "author-8",
      name: "Kim Min-ji",
      email: "k.minji@olympics.com",
    },
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    readTime: 5,
  },
  {
    id: "article-9",
    title: "Olympic Spirit: Most Inspiring Moments So Far",
    slug: "olympic-spirit-inspiring-moments",
    excerpt:
      "From unexpected acts of sportsmanship to historic achievements, these moments define the Olympic spirit.",
    content:
      "<p>As we enter the final week of the Games, we look back at the moments that have touched hearts and exemplified the true meaning of the Olympic movement.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?olympic-ceremony",
    isVideo: true,
    videoDuration: "5:00",
    author: {
      id: "author-9",
      name: "Isabella Romano",
      email: "i.romano@olympics.com",
    },
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    readTime: 6,
  },
  {
    id: "article-10",
    title: "Paris 2024: Week One in Pictures",
    slug: "paris-2024-week-one-gallery",
    excerpt:
      "A stunning photo gallery capturing the most memorable moments from the first week of the Paris Olympics.",
    content:
      "<p>From record-breaking performances to emotional victories, our photographers have captured the essence of these extraordinary Games in this curated collection.</p>",
    status: "PUBLISHED",
    category: "Olympics",
    featuredImage: "https://source.unsplash.com/1200x630/?paris,sport",
    author: {
      id: "author-10",
      name: "Pierre Dubois",
      email: "p.dubois@olympics.com",
    },
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    readTime: 3,
  },
];

// Count words in HTML content by stripping tags and splitting on whitespace.
function countWordsFromHtml(html) {
  if (!html) return 0;
  try {
    // strip tags and collapse whitespace
    const text = String(html)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  } catch (e) {
    return 0;
  }
}

// Ensure slug uniqueness by appending a numeric suffix if needed.
async function ensureUniqueSlug(base) {
  if (!prisma) return base;
  const maxLen = 200;
  let candidate = String(base).slice(0, maxLen);
  let i = 0;
  while (true) {
    const exists = await prisma.article.findUnique({
      where: { slug: candidate },
    });
    if (!exists) return candidate;
    i += 1;
    const suffix = `-${i}`;
    // ensure total length stays within maxLen
    const truncated = String(base).slice(0, maxLen - suffix.length);
    candidate = `${truncated}${suffix}`;
    // safety: if i gets huge, fallback to timestamp
    if (i > 1000) return `${truncated}-${Date.now()}`;
  }
}

// Get all articles (public)
// Search articles (public)
router.get("/search", async (req, res) => {
  try {
    const { q = "", status = "PUBLISHED", limit = 20 } = req.query;
    const max = Math.min(parseInt(limit, 10) || 20, 200);

    if (!prisma) {
      // fallback to searching the DEV_SAMPLE_ARTICLES array
      const term = String(q || "")
        .toLowerCase()
        .trim();
      const matches = DEV_SAMPLE_ARTICLES.filter((a) => {
        if (status && a.status !== status) return false;
        if (!term) return true;
        const hay = [a.title, a.excerpt, a.content, a.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const tags = (a.tags || []).join(" ").toLowerCase();
        return hay.includes(term) || tags.includes(term);
      }).slice(0, max);
      return res.json({ data: matches, count: matches.length, status, q });
    }

    const trimmed = String(q || "").trim();
    // If no query provided, return recent articles by status
    if (!trimmed) {
      const articles = await prisma.article.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
        take: max,
      });
      return res.json({ data: articles, count: articles.length, status });
    }

    // Basic multi-field contains search (case-insensitive)
    const where = {
      status,
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { content: { contains: trimmed, mode: "insensitive" } },
        { excerpt: { contains: trimmed, mode: "insensitive" } },
        { category: { contains: trimmed, mode: "insensitive" } },
        // tags: try exact tag match in array
        { tags: { has: trimmed } },
      ],
    };

    // Try to run the query. If the Prisma schema doesn't include `tags`
    // (e.g. migration not applied) the query will fail with an 'Unknown
    // argument `tags`' error. In that case, retry without the tags
    // condition so search still works against title/content/excerpt/category.
    let articles;
    try {
      articles = await prisma.article.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: max,
      });
    } catch (innerErr) {
      const msg = String(innerErr && (innerErr.message || innerErr));
      // If the error is about an unknown 'tags' argument, remove that clause and retry
      if (
        /unknown\s+argument\s+`?tags`?/i.test(msg) ||
        /Unknown argument `tags`/i.test(msg)
      ) {
        console.warn(
          "Prisma schema appears to be missing 'tags' field - retrying search without tags condition"
        );
        // clone where but filter out the tags condition from OR
        const safeWhere = Object.assign({}, where, {
          OR: (where.OR || []).filter((c) => {
            // detect the tags condition by checking for a 'tags' key
            return !(c && Object.prototype.hasOwnProperty.call(c, "tags"));
          }),
        });

        articles = await prisma.article.findMany({
          where: safeWhere,
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: max,
        });
      } else {
        // rethrow other errors to be handled by outer catch
        throw innerErr;
      }
    }

    res.json({ data: articles, count: articles.length, status, q: trimmed });
  } catch (error) {
    console.error("Error searching articles:", error);
    res
      .status(500)
      .json({ error: "Failed to search articles", message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    console.log("GET /articles - Query:", req.query);
    const { status = "PUBLISHED" } = req.query;

    // Validate status
    const validStatuses = ["PUBLISHED", "DRAFT"];
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid status requested: ${status}`);
      return res.status(400).json({
        error: "Invalid status parameter",
        validValues: validStatuses,
      });
    }

    if (!prisma) {
      console.warn(
        "Prisma client not available - returning development sample articles list"
      );
      // Return a filtered set of sample articles matching the requested status
      const sample = DEV_SAMPLE_ARTICLES.filter((a) => a.status === status);
      return res.json({
        data: sample,
        count: sample.length,
        status,
        source: "dev-sample",
      });
    }

    console.log("Querying articles with status:", status);
    const articles = await prisma.article.findMany({
      where: {
        status: status,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Found ${articles.length} articles with status: ${status}`);

    // Set cache headers for published articles
    if (status === "PUBLISHED") {
      res.set("Cache-Control", "public, max-age=300"); // Cache for 5 minutes
    }

    res.json({ data: articles, count: articles.length, status });
  } catch (error) {
    console.error("Error fetching articles:", {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    res
      .status(500)
      .json({ error: "Failed to fetch articles", message: error.message });
  }
});

// Create new article (protected)
router.post(
  "/",
  verifyToken,
  upload.single("featuredImage"),
  handleGcsUpload,
  async (req, res) => {
    try {
      if (!prisma)
        return res.status(503).json({ error: "Database not configured" });

      const {
        title,
        content,
        excerpt,
        status = "DRAFT",
        category,
        tags,
        metaTitle,
        metaDescription,
        metaKeywords,
        canonical,
        featuredImageName,
        featuredImageAlt,
      } = req.body;

      // Normalize tags: accept JSON string, comma-separated string, or array
      let tagsArr = undefined;
      if (typeof tags !== "undefined" && tags !== null) {
        if (Array.isArray(tags)) {
          tagsArr = tags.map((t) => String(t).trim()).filter(Boolean);
        } else if (typeof tags === "string") {
          try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
              tagsArr = parsed.map((t) => String(t).trim()).filter(Boolean);
            } else {
              // fallback: comma-separated
              tagsArr = tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            }
          } catch (e) {
            tagsArr = tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
          }
        }
      }

      // Enforce server-side 5000-word limit for article content
      const wc = countWordsFromHtml(content);
      if (wc > 5000) {
        return res.status(400).json({
          error: "Content exceeds 5000-word limit",
          wordCount: wc,
          max: 5000,
        });
      }

      // Generate slug from title and ensure uniqueness
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const slug = await ensureUniqueSlug(baseSlug || `article-${Date.now()}`);

      let featuredImageUrl = req.file
        ? req.file.location
        : req.body && req.body.featuredImage
        ? req.body.featuredImage
        : null;

      // If no explicit featuredImage provided, try to infer from first
      // <img src="..."> in the HTML content. This handles cases where the
      // editor inserted an inline image (e.g., ImgBB URL) but the client
      // didn't send featuredImage as a separate field.
      if (!featuredImageUrl && content) {
        try {
          const m = String(content).match(
            /<img[^>]+src=["']?([^"'>\s]+)["']?/i
          );
          if (m && m[1]) {
            featuredImageUrl = m[1];
          }
        } catch (e) {
          // ignore regex errors
        }
      }

      // TEMP DEBUG: use request logger (pino) where available so logs appear
      try {
        if (req && req.log && typeof req.log.info === "function") {
          req.log.info(
            { headers: req.headers },
            "POST /api/articles - headers"
          );
          req.log.info({ body: req.body }, "POST /api/articles - body");
          req.log.info({ file: req.file }, "POST /api/articles - file");
          req.log.info({ featuredImageUrl }, "Computed featuredImageUrl");
        } else {
          console.log("POST /api/articles - headers:", req.headers);
          console.log("POST /api/articles - body:", req.body);
          console.log("POST /api/articles - file:", req.file);
          console.log("Computed featuredImageUrl:", featuredImageUrl);
        }
      } catch (logErr) {
        console.error("Error while logging debug info:", logErr);
      }

      // build create payload; declare outside so catch/retry handlers can
      // access and mutate it in case of slug conflicts
      // server-side fallbacks: ensure metaTitle/metaDescription are at least
      // derived from title/excerpt if not provided to improve SEO metadata
      const safeMetaTitle = metaTitle || title || null;
      const safeMetaDescription = metaDescription || excerpt || null;

      let createData = {
        title,
        slug,
        content,
        excerpt,
        status,
        category: category || undefined,
        tags: typeof tagsArr !== "undefined" ? tagsArr : undefined,
        featuredImage: featuredImageUrl,
        featuredImageName:
          featuredImageName || (req.file && req.file.originalname) || undefined,
        featuredImageAlt: featuredImageAlt || undefined,
        metaTitle: safeMetaTitle,
        metaDescription: safeMetaDescription,
        metaKeywords: metaKeywords || undefined,
        canonical: canonical || undefined,
        author: {
          connect: {
            id: req.user.id,
          },
        },
        ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
      };

      // TEMP DEBUG: log the exact object passed to Prisma
      console.log("Prisma create data:", createData);

      const article = await prisma.article.create({ data: createData });

      // TEMP DEBUG: confirm what was passed to prisma (sanitized) by re-logging
      console.log(
        "Article created with featuredImage stored as:",
        article.featuredImage
      );

      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      const msg = String(error && (error.message || error));

      // Robust detection for Prisma unique constraint on slug:
      // - Prisma error code P2002
      // - Prisma error.meta.target includes 'slug'
      // - Fallback: message contains 'unique' and 'slug' (case-insensitive)
      const isUniqueSlugError =
        (error && error.code === "P2002") ||
        (error &&
          error.meta &&
          Array.isArray(error.meta.target) &&
          error.meta.target.includes("slug")) ||
        /unique\s+constraint[\s\S]*slug/i.test(msg) ||
        (/unique/i.test(msg) && /slug/i.test(msg));

      if (isUniqueSlugError) {
        // Try a safe retry: generate a fallback unique slug using timestamp
        try {
          const fallbackBase =
            (createData && createData.slug) || `article-${Date.now()}`;
          const fallback = await ensureUniqueSlug(
            `${fallbackBase}-${Date.now()}`
          );
          createData.slug = fallback;
          const retried = await prisma.article.create({ data: createData });
          console.log("Article created with fallback slug:", retried.slug);
          return res.status(201).json(retried);
        } catch (retryErr) {
          console.error("Retry create after slug conflict failed:", retryErr);
          return res.status(409).json({
            error: "Article slug conflict",
            message:
              "An article with that slug already exists. Try a different title.",
          });
        }
      }

      res
        .status(500)
        .json({ error: "Failed to create article", message: error.message });
    }
  }
);

// Get article by slug
router.get("/:slug", async (req, res) => {
  try {
    if (!prisma)
      return res.status(503).json({ error: "Database not configured" });

    const article = await prisma.article.findUnique({
      where: { slug: req.params.slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch article", message: error.message });
  }
});

// Update article (protected)
router.put(
  "/:id",
  verifyToken,
  upload.single("featuredImage"),
  handleGcsUpload,
  async (req, res) => {
    try {
      if (!prisma)
        return res.status(503).json({ error: "Database not configured" });

      const {
        title,
        content,
        excerpt,
        status,
        category,
        tags,
        metaTitle,
        metaDescription,
        metaKeywords,
        canonical,
        featuredImageName,
        featuredImageAlt,
      } = req.body;

      // Normalize tags on update similar to create
      let tagsArr = undefined;
      if (typeof tags !== "undefined" && tags !== null) {
        if (Array.isArray(tags)) {
          tagsArr = tags.map((t) => String(t).trim()).filter(Boolean);
        } else if (typeof tags === "string") {
          try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
              tagsArr = parsed.map((t) => String(t).trim()).filter(Boolean);
            } else {
              tagsArr = tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            }
          } catch (e) {
            tagsArr = tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
          }
        }
      }

      // Enforce server-side 5000-word limit for article content on update as well
      const wc = countWordsFromHtml(content);
      if (wc > 5000) {
        return res.status(400).json({
          error: "Content exceeds 5000-word limit",
          wordCount: wc,
          max: 5000,
        });
      }
      // server-side fallbacks for metadata
      const safeUpdateMetaTitle = metaTitle || title || undefined;
      const safeUpdateMetaDescription = metaDescription || excerpt || undefined;

      const updates = {
        title,
        content,
        excerpt,
        status,
        ...(typeof category !== "undefined" ? { category } : {}),
        ...(typeof tagsArr !== "undefined" ? { tags: tagsArr } : {}),
        ...(req.file ? { featuredImage: req.file.location } : {}),
        ...(featuredImageName ? { featuredImageName } : {}),
        ...(featuredImageAlt ? { featuredImageAlt } : {}),
        ...(safeUpdateMetaTitle ? { metaTitle: safeUpdateMetaTitle } : {}),
        ...(typeof safeUpdateMetaDescription !== "undefined"
          ? { metaDescription: safeUpdateMetaDescription }
          : {}),
        ...(metaKeywords ? { metaKeywords } : {}),
        ...(canonical ? { canonical } : {}),
        // explicitly set publishedAt when publishing, or clear it when
        // changing back to draft/unpublished so the publishedAt value
        // correctly reflects the article state.
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      };

      // If the client passed a featuredImage URL in the JSON body and no
      // file was uploaded, prefer that URL. The upload middleware will set
      // req.file when a file was uploaded and handleGcsUpload will set
      // req.file.location accordingly.
      if (!req.file && req.body && req.body.featuredImage) {
        updates.featuredImage = req.body.featuredImage;
      }

      // If still no featuredImage, try to infer from the content's first <img>
      if (!updates.featuredImage && updates.content) {
        try {
          const mm = String(updates.content).match(
            /<img[^>]+src=["']?([^"'>\s]+)["']?/i
          );
          if (mm && mm[1]) updates.featuredImage = mm[1];
        } catch (e) {}
      }

      const article = await prisma.article.update({
        where: { id: req.params.id },
        data: updates,
      });

      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res
        .status(500)
        .json({ error: "Failed to update article", message: error.message });
    }
  }
);

// Delete article
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!prisma)
      return res.status(503).json({ error: "Database not configured" });

    // Get the article first to get the featured image URL
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      select: { featuredImage: true },
    });

    if (!article) return res.status(404).json({ error: "Article not found" });

    // Delete the article from the database
    await prisma.article.delete({ where: { id: req.params.id } });

    // If there was a featured image, delete it from GCS
    if (article.featuredImage) {
      try {
        await deleteFromGCS(article.featuredImage);
      } catch (error) {
        console.error("Error deleting image from GCS:", error);
        // Don't fail the request if image deletion fails
      }
    }

    res.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res
      .status(500)
      .json({ error: "Failed to delete article", message: error.message });
  }
});

module.exports = router;
module.exports.DEV_SAMPLE_ARTICLES = DEV_SAMPLE_ARTICLES;
