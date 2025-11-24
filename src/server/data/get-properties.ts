"use server";

import { prisma } from '@/lib/db';

/**
 * getProperties
 *
 * Fetches all properties with their owner details
 * for display in the properties table.
 * Optionally filters by ownerId.
 */
export async function getProperties(ownerId?: string) {
  const properties = await prisma.property.findMany({
    where: ownerId ? { ownerId } : undefined,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return properties;
}

/**
 * getClientsForSelect
 *
 * Lightweight fetch for populating the owner combobox.
 * Returns only essential fields for selection.
 */
export async function getClientsForSelect() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: {
      lastName: 'asc',
    },
  });

  return clients.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    label: `${c.firstName} ${c.lastName}`,
  }));
}
