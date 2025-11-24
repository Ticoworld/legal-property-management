import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcryptjs from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testAuth() {
  console.log('\n========== DIRECT AUTH TEST ==========\n');
  
  const email = 'admin@legalapp.com';
  const password = 'Admin123!';
  
  console.log('Testing credentials:');
  console.log('  Email:', email);
  console.log('  Password:', password);
  console.log('  Password length:', password.length);
  console.log('');
  
  console.log('Step 1: Fetching user from database...');
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.error('✗ User not found!');
    process.exit(1);
  }
  
  console.log('✓ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Hash:', user.password);
  console.log('  Hash length:', user.password.length);
  console.log('');
  
  console.log('Step 2: Comparing password with bcryptjs.compare...');
  console.log('  Input password:', password);
  console.log('  Stored hash:', user.password);
  
  const valid = await bcryptjs.compare(password, user.password);
  
  console.log('');
  console.log('Result:', valid ? '✓ PASSWORD MATCHES' : '✗ PASSWORD DOES NOT MATCH');
  console.log('');
  
  // Test with wrong password
  console.log('Step 3: Testing with wrong password...');
  const wrongValid = await bcryptjs.compare('WrongPassword123!', user.password);
  console.log('Wrong password result:', wrongValid ? '✓ MATCH (unexpected!)' : '✗ NO MATCH (expected)');
  
  await prisma.$disconnect();
  await pool.end();
  
  console.log('\n========== TEST COMPLETE ==========\n');
}

testAuth().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
