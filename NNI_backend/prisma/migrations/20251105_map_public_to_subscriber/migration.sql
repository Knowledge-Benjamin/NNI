-- Migration: map legacy PUBLIC users to SUBSCRIBER
BEGIN;

-- Map existing rows (if any) using the old 'PUBLIC' value to the new 'SUBSCRIBER' value
-- This runs after the migration that added the SUBSCRIBER enum value.
UPDATE "users" SET "role" = 'SUBSCRIBER' WHERE "role" = 'PUBLIC';

COMMIT;
