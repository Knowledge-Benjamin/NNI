const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log("Updating users with role PUBLIC -> SUBSCRIBER...");
    const res = await prisma.$executeRawUnsafe(
      'UPDATE "users" SET "role" = \'SUBSCRIBER\' WHERE "role" = \'PUBLIC\''
    );
    console.log("Rows updated:", res);
  } catch (err) {
    console.error("Error updating roles:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
