const { PrismaClient } = require("@prisma/client");

/**
 * Singleton Prisma Client
 * Prevents multiple instances that could exhaust database connection pools.
 * In development, uses global to preserve instance across hot reloads.
 */

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance
  // across module reloads caused by HMR (Hot Module Replacement)
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
