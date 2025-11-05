const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { DEV_SAMPLE_ARTICLES } = require("../src/routes/articles");

async function main() {
  console.log("Start seeding...");

  // First create all the authors
  const authors = [];
  for (const article of DEV_SAMPLE_ARTICLES) {
    const existingAuthor = authors.find(
      (a) => a.email === article.author.email
    );
    if (!existingAuthor) {
      const author = await prisma.user.upsert({
        where: { email: article.author.email },
        update: {},
        create: {
          name: article.author.name,
          email: article.author.email,
          password:
            "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // 'password123'
          role: "EDITOR",
        },
      });
      authors.push(author);
      console.log(`Created author: ${author.name}`);
    }
  }

  // Create all articles
  for (const articleData of DEV_SAMPLE_ARTICLES) {
    const author = authors.find((a) => a.email === articleData.author.email);

    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        slug: articleData.slug,
        content: articleData.content,
        excerpt: articleData.excerpt,
        status: articleData.status,
        category: articleData.category,
        featuredImage: articleData.featuredImage,
        isVideo: articleData.isVideo || false,
        videoDuration: articleData.videoDuration,
        readTime: articleData.readTime,
        publishedAt: new Date(articleData.publishedAt),
        author: {
          connect: { id: author.id },
        },
      },
    });
    console.log(`Created article: ${article.title}`);
  }

  console.log("Seeding finished");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
