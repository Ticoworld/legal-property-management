require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcryptjs = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking for admin user...');
  
  const adminEmail = 'admin@legalapp.com';
  const password = 'Admin123!';
  
  let user = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (user) {
    console.log('✓ Admin user found:', user.email);
    
    // Verify password
    const valid = await bcryptjs.compare(password, user.password);
    console.log('✓ Password valid:', valid);
    
    if (!valid) {
      console.log('Updating password...');
      const hashed = await bcryptjs.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed }
      });
      console.log('✓ Password updated');
    }
  } else {
    console.log('Creating admin user...');
    const hashed = await bcryptjs.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Principal Partner',
        password: hashed,
        role: 'ADMIN',
      }
    });
    console.log('✓ Admin user created:', user.email);
  }
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
