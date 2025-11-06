-- Migration: map legacy PUBLIC users to SUBSCRIBER
BEGIN;

-- Map existing rows (if any) using the old 'PUBLIC' value to the new 'SUBSCRIBER' value
-- This runs after the migration that added the SUBSCRIBER enum value.
-- Ensure the SUBSCRIBER enum value exists (idempotent)
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

-- Update any rows that have the legacy PUBLIC label. Use text cast when comparing
-- to avoid enum parsing errors in certain shadow DB states.
UPDATE "users" SET "role" = 'SUBSCRIBER' WHERE "role"::text = 'PUBLIC';

COMMIT;
