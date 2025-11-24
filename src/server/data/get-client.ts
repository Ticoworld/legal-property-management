"use server";

import { prisma } from '@/lib/db';
import { decrypt } from '@/utils/encryption';

/**
 * getClient
 *
 * Fetches a single client by ID with related properties.
 * Returns null if the client is not found.
 * - Decrypts NIN before returning.
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

  if (!client) {
    return null;
  }

  // Decrypt NIN for display
  let nin: string | null = null;
  if (client.nin) {
    try {
      nin = decrypt(client.nin);
    } catch {
      nin = null;
    }
  }

  return {
    ...client,
    nin,
  };
}
