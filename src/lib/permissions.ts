/**
 * Centralized Permission Matrix for 4-Tier RBAC
 * 
 * Role Hierarchy:
 * 1. SUPER_ADMIN - Business Owner (Full access)
 * 2. MANAGER     - Head of Operations (Team + Approvals)
 * 3. ASSOCIATE   - Staff (Create/Edit records)
 * 4. VIEWER      - Read-only access
 */

import { UserRole } from "@prisma/client";

/**
 * Can view financial data (Revenue, Payment reports)
 * Only SUPER_ADMIN (Business Owner) should see financials
 */
export function canViewFinancials(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

/**
 * Can delete clients and properties (destructive operations)
 * Only SUPER_ADMIN can permanently delete assets
 */
export function canDeleteAssets(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

/**
 * Can manage team members (create/delete/reset users)
 * SUPER_ADMIN and MANAGER can manage team
 */
export function canManageTeam(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

/**
 * Can approve pending records (Maker-Checker workflow)
 * SUPER_ADMIN and MANAGER can approve records
 */
export function canApproveRecords(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

/**
 * Can export data (CSV exports)
 * Only SUPER_ADMIN can export sensitive data
 */
export function canExportData(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

/**
 * Can create and edit records (clients, properties, tenancies)
 * SUPER_ADMIN, MANAGER, and ASSOCIATE can create/edit
 */
export function canCreateRecords(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "ASSOCIATE";
}

/**
 * Check if role can access the executive dashboard
 * SUPER_ADMIN and MANAGER can access dashboard
 */
export function canAccessDashboard(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

/**
 * Get the roles that a user can assign when creating new users
 * MANAGER cannot create SUPER_ADMIN users
 */
export function getAllowedRolesToCreate(role: UserRole): UserRole[] {
  if (role === "SUPER_ADMIN") {
    return ["SUPER_ADMIN", "MANAGER", "ASSOCIATE", "VIEWER"];
  }
  if (role === "MANAGER") {
    return ["ASSOCIATE", "VIEWER"];
  }
  return [];
}

/**
 * Check if a user can modify/delete another user based on roles
 * MANAGER cannot modify/delete SUPER_ADMIN users
 */
export function canModifyUser(currentRole: UserRole, targetRole: UserRole): boolean {
  if (currentRole === "SUPER_ADMIN") {
    return true; // SUPER_ADMIN can modify anyone
  }
  if (currentRole === "MANAGER") {
    // MANAGER cannot modify SUPER_ADMIN or other MANAGER
    return targetRole !== "SUPER_ADMIN" && targetRole !== "MANAGER";
  }
  return false;
}
