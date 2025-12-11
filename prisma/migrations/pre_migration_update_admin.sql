-- Pre-migration script to update ADMIN users to SUPER_ADMIN
-- Run this BEFORE running the migration if you have existing ADMIN users

-- Update all ADMIN users to SUPER_ADMIN
UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';

-- Verify the update
SELECT id, email, role FROM "users" WHERE role = 'SUPER_ADMIN';
