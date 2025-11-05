// scripts/seed-admin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nni.com";
  const plainPassword = "admin123"; // Change this later
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const updated = await prisma.user.updateMany({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`Updated ${updated.count} user(s) with password.`);
  console.log(`Login: ${email} / ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
