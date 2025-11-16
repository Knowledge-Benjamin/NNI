-- CreateTable
CREATE TABLE "about" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sections" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "about_slug_key" ON "about"("slug");
