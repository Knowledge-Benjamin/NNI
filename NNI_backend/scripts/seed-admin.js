// scripts/seed-admin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create or update an admin user with the requested credentials
  const email = "admin@nni.news";
  const plainPassword = "Knowben0181?"; // change this after first run in production
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  // Use upsert so this is idempotent: create if missing, otherwise update password
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      email,
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  if (user) {
    console.log(`Ensured admin user: ${email}`);
    console.log(`Login: ${email} / ${plainPassword}`);
  } else {
    console.log("Failed to ensure admin user");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
