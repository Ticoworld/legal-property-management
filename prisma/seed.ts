/*
  Prisma Seed Script (Genesis Block)
  - Creates initial admin user if not present
*/

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING STARTED ---');
  console.log('Database URL present:', !!process.env.DATABASE_URL);
  
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
      name: 'K. C. Ogodo',
      password: hashed,
      role: 'SUPER_ADMIN',
    },
    select: { id: true, email: true },
  });

  console.log('Seeded Admin User ID:', admin.id);
  console.log('Use this ID for MOCK_ADMIN_USER_ID or rely on auth-helper fetching by email.');

  // --- Seed Firm Settings (singleton) ---
  const existingSettings = await prisma.firmSettings.findFirst();
  if (!existingSettings) {
    const settings = await prisma.firmSettings.create({
      data: {
        firmName: 'Ogodo, Ogodo & Co.',
        chambersName: 'Beracah Chambers',
        address: '14 Ojeawere Street, Abakaliki, Ebonyi State',
        city: 'Abakaliki',
        state: 'Ebonyi',
        solicitorName: 'K. O. Ogboso, Esq.',
        solicitorTitle: 'Legal Practitioner',
      },
    });
    console.log('Seeded Firm Settings ID:', settings.id);
  } else {
    console.log('Firm Settings already exist:', existingSettings.id);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
