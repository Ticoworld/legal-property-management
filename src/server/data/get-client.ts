"use server";

import { prisma } from '@/lib/db';
import { decrypt } from '@/utils/encryption';

/**
 * getClient
 *
 * Fetches a single client by ID with related properties.
 * Returns null if the client is not found.
 * - Includes all properties owned by this client.
 */
export async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      properties: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return client;
}
