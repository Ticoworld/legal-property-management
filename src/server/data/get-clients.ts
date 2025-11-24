"use server";

import { prisma } from '@/lib/db';
import { decrypt } from '@/utils/encryption';

/**
 * getClients
 *
 * Read-only operation that returns all clients.
 * - Decrypts NIN before returning to the caller so the lawyer
 *   can read it in the UI.
 * - BVN is left as-is; you can decrypt similarly if required.
 * - Includes property count for each client.
 */
export async function getClients() {
  const clients = await prisma.client.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: {
          properties: true,
        },
      },
    },
  });

  return clients.map((client) => {
    let nin: string | null = null;

    if (client.nin) {
      try {
        nin = decrypt(client.nin);
      } catch {
        // If decryption fails, we avoid breaking the UI.
        // You may choose to log this via AuditLog or monitoring.
        nin = null;
      }
    }

    return {
      ...client,
      nin,
      propertyCount: client._count.properties,
    };
  });
}
