// scripts/seed-admin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Create or update an admin user with the requested credentials
  const email = "admin@nni.news";
  // Password must be supplied via environment variable to avoid committing it.
  const plainPassword = process.env.ADMIN_PASSWORD;
  if (!plainPassword) {
    throw new Error(
      "ADMIN_PASSWORD environment variable must be set to seed admin account."
    );
  }
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
