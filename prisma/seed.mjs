// Simple seed script using ES modules
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING STARTED ---');
  
  const adminEmail = 'admin@legalapp.com';
  const defaultPassword = 'Admin123!';

  try {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      console.log(`✅ Admin already exists: ${existing.id} (${adminEmail})`);
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
    });

    console.log('✅ Seeded Admin User:', admin.id, admin.email, admin.name);

    // Seed Firm Settings
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
      console.log('✅ Seeded Firm Settings:', settings.id);
    }
    
    console.log('--- SEEDING COMPLETED ---');
  } catch (error) {
    console.error('❌ SEED ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
