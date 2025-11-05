const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nni.news";
  const name = "Admin";
  const plain = "Admin123";
  const saltRounds = process.env.BCRYPT_ROUNDS
    ? parseInt(process.env.BCRYPT_ROUNDS, 10)
    : 12;

  const hashed = bcrypt.hashSync(plain, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashed,
      role: "ADMIN",
    },
    create: {
      name,
      email,
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log("Admin user created/updated:", {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error("Error seeding admin:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
