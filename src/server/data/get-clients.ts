"use server";

import { prisma } from '@/lib/db';
import { decrypt } from '@/utils/encryption';
import { getCurrentUser } from '@/lib/auth-helper';
import { canManageTeam } from '@/lib/permissions';

/**
 * getClients
 *
 * Read-only operation that returns all clients with their bank details.
 * - Includes property count for each client.
 * - 🔒 PII MASKING: Only SUPER_ADMIN and MANAGER can see full banking details
 */
export async function getClients() {
  const currentUser = await getCurrentUser();
  
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
    // 🛡️ PII MASKING - SUPER_ADMIN and MANAGER can see banking details
    const showPII = canManageTeam(currentUser.role);
    
    return {
      ...client,
      bankName: showPII ? client.bankName : (client.bankName ? '***MASKED***' : null),
      accountNumber: showPII ? client.accountNumber : (client.accountNumber ? '***MASKED***' : null),
      accountName: showPII ? client.accountName : (client.accountName ? '***MASKED***' : null),
      bvn: showPII ? (client.bvn ? decrypt(client.bvn) : null) : (client.bvn ? '***MASKED***' : null),
      propertyCount: client._count.properties,
      verificationStatus: client.verificationStatus,
    };
  });
}
