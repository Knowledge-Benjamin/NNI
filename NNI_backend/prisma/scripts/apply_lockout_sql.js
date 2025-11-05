const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log("Applying lockout SQL...");
    await prisma.$executeRawUnsafe(
      'ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3) NULL;'
    );
    console.log("Lockout columns applied (if not present).");
  } catch (err) {
    console.error("Error applying lockout SQL:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
