import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('Checking for admin user...');
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@legalapp.com' }
    });
    
    if (admin) {
      console.log('✅ Admin user EXISTS:');
      console.log('  ID:', admin.id);
      console.log('  Email:', admin.email);
      console.log('  Name:', admin.name);
      console.log('  Role:', admin.role);
    } else {
      console.log('❌ Admin user NOT FOUND');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAdmin();
