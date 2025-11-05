const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = process.argv[2] || "test.user+1@example.com";
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("user not found for email:", email);
      return;
    }
    // Print user without password
    const { password, ...safe } = user;
    console.log(JSON.stringify(safe, null, 2));
  } catch (err) {
    console.error("error fetching user:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
