/**
 * Database Singleton Pattern
 * 
 * Purpose: Prevents Prisma Client from creating multiple connections during
 * Next.js Hot Module Replacement (HMR) in development.
 * 
 * Problem: Without this pattern, each hot reload creates a new PrismaClient
 * instance, eventually exhausting database connection pool.
 * 
 * Solution: Store PrismaClient on the global object which persists across HMR.
 * 
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

// Import from @prisma/client (updated for Payment model support)
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'server-only'; // Ensures this file is never imported on client-side

// Extend global type to include our prisma property
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Global PrismaClient instance
 * 
 * In production: Creates a single instance
 * In development: Reuses existing instance from global object to prevent
 *                 connection exhaustion during hot reloads
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = global.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// In development, store the client on global to persist across HMR
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Usage in Server Actions/API Routes:
 * 
 * import { prisma } from '@/lib/db';
 * 
 * const users = await prisma.user.findMany();
 */
