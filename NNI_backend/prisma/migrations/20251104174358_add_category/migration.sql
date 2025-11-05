/*
  Warnings:

  - The values [PUBLIC] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `articles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `password` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'EDITOR', 'SUBSCRIBER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SUBSCRIBER';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."articles" DROP CONSTRAINT "articles_authorId_fkey";

-- DropIndex
DROP INDEX "public"."articles_authorId_idx";

-- DropIndex
DROP INDEX "public"."articles_status_idx";

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "isVideo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readTime" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "videoDuration" TEXT,
ALTER COLUMN "content" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SUBSCRIBER',
ALTER COLUMN "password" SET NOT NULL;

-- DropEnum
DROP TYPE "public"."ArticleStatus";

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
