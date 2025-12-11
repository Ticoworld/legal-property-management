"use server";

import { prisma } from '@/lib/db';

/**
 * getProperty
 *
 * Fetches a single property by ID with related data.
 * Returns null if the property is not found.
 * - Includes the owner details.
 * - Includes all tenancies (past and present).
 * - Includes all documents.
 */
export async function getProperty(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tenancies: {
        orderBy: {
          startDate: 'desc',
        },
      },
      units: {
        include: {
          tenancies: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      },
      documents: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      maintenanceRequests: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return property;
}
