-- Migration: add category column to articles
BEGIN;

-- Add category column with default 'Olympics' to match Prisma schema
ALTER TABLE IF EXISTS "articles" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Olympics';

COMMIT;
