-- Migration: add_hierarchy_roles
-- Maps existing ADMIN users to SUPER_ADMIN and adds MANAGER role

-- Step 1: Add new enum values (PostgreSQL requires this approach)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MANAGER';

-- Step 2: Update existing ADMIN users to SUPER_ADMIN
-- Note: Cannot do this in same transaction as ALTER TYPE in PostgreSQL
-- This must be run separately after committing the above changes:
-- UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';

-- Important: After running the migration, you need to manually update 
-- users from ADMIN to SUPER_ADMIN if there are any existing ones.
-- The enum change allows the new values, but data migration must be separate.
