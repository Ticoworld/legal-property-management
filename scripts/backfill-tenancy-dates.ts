
import { prisma } from '../src/lib/db';

async function main() {
  console.log('Starting backfill of Tenancy startDate...');
  
  const tenancies = await prisma.tenancy.findMany(); // Fetch all
  
  let updatedCount = 0;
  for (const tenancy of tenancies) {
    // We want to reset startDate to createdAt.
    // Logic: If startDate is close to "Now" (default) but createdAt is old, it means it was just backfilled with default.
    // Or we simply force sync it to createdAt for ALL existing records as per "Backfill: ... equal createdAt".
    // We'll trust createdAt is the source of truth for "Start Date" for legacy data.
    
    await prisma.tenancy.update({
      where: { id: tenancy.id },
      data: { startDate: tenancy.createdAt }
    });
    updatedCount++;
  }

  console.log(`Backfilled ${updatedCount} tenancies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
