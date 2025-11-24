/*
  Prisma Seed Script (Genesis Block)
  - Creates initial admin user if not present
*/

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcryptjs from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@legalapp.com';
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin already exists: ${existing.id} (${adminEmail})`);
    return;
  }

  const hashed = await bcryptjs.hash(defaultPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Principal Partner',
      password: hashed,
      role: 'ADMIN',
    },
    select: { id: true, email: true },
  });

  console.log('Seeded Admin User ID:', admin.id);
  console.log('Use this ID for MOCK_ADMIN_USER_ID or rely on auth-helper fetching by email.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
