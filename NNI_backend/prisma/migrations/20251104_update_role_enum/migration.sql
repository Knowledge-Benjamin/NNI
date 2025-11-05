
-- Migration: add SUBSCRIBER value to existing Role enum
-- NOTE: This migration only adds the new enum label. Mapping existing rows
-- that reference the old value will be done in a follow-up migration.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'SUBSCRIBER'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'SUBSCRIBER';
  END IF;
END$$;

