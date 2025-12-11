"use server";

import { prisma } from '@/lib/db';

/**
 * getProperties
 *
 * Fetches all properties with their owner details
 * for display in the properties table.
 * Optionally filters by ownerId.
 * Includes unit stats for occupancy filtering.
 */
export async function getProperties(ownerId?: string) {
  const now = new Date();
  
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
      units: {
        select: {
          id: true,
        },
      },
      tenancies: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          expiryDate: { gte: now },
        },
        select: {
          id: true,
          unitId: true,
        },
      },
    },
  });

  // Calculate occupancy for each property
  return properties.map(p => {
    const totalUnits = p.units.length || 1; // Default to 1 for single-unit properties
    const occupiedUnits = p.tenancies.length;
    const isOccupied = occupiedUnits > 0;
    
    return {
      ...p,
      totalUnits,
      occupiedUnits,
      isOccupied,
    };
  });
}

/**
 * getClientsForSelect
 *
 * Lightweight fetch for populating the owner combobox.
 * Returns only essential fields for selection.
 * Includes PENDING clients with visual indicator.
 */
export async function getClientsForSelect() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      verificationStatus: true,
    },
    orderBy: {
      lastName: 'asc',
    },
  });

  return clients.map((c) => {
    const isPending = c.verificationStatus === 'PENDING';
    const baseName = `${c.firstName} ${c.lastName}`;
    
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      status: c.verificationStatus,
      label: isPending ? `${baseName} (Pending)` : baseName,
    };
  });
}

/**
 * getPropertiesForSelect
 *
 * Lightweight fetch for populating the property combobox in tenancy form.
 * Returns only essential fields for selection.
 */
export async function getPropertiesForSelect() {
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      address: true,
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      address: 'asc',
    },
  });

  return properties.map((p) => ({
    id: p.id,
    address: p.address,
    ownerName: `${p.owner.firstName} ${p.owner.lastName}`,
    label: `${p.address} (Owner: ${p.owner.firstName} ${p.owner.lastName})`,
  }));
}
