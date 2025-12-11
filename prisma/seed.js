import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING STARTED ---');
  
  const adminEmail = 'admin@legalapp.com';
  const defaultPassword = 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Admin already exists: ${existing.id} (${adminEmail})`);
    await prisma.$disconnect();
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
    select: { id: true, email: true, name: true },
  });

  console.log('✅ Seeded Admin User:', admin);

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
    console.log('✅ Seeded Firm Settings ID:', settings.id);
  } else {
    console.log('Firm Settings already exist:', existingSettings.id);
  }
  
  await prisma.$disconnect();
  console.log('--- SEEDING COMPLETED ---');
}

main().catch((e) => {
  console.error('❌ SEED ERROR:', e);
  process.exit(1);
});
