"use server";

import { prisma } from "@/lib/db";

export type SearchResult = {
  clients: { id: string; name: string; email: string }[];
  properties: { id: string; address: string; city: string }[];
  tenants: { id: string; tenantName: string; propertyAddress: string; tenancyId: string }[];
};

/**
 * Global search across Clients, Properties, and Tenants.
 * Returns top 5 results per category for fast response.
 */
export async function globalSearch(query: string): Promise<SearchResult> {
  const trimmedQuery = query.trim();
  
  // Return empty results for empty queries
  if (!trimmedQuery || trimmedQuery.length < 2) {
    return { clients: [], properties: [], tenants: [] };
  }

  const [clients, properties, tenancies] = await Promise.all([
    // Search Clients by name or email
    prisma.client.findMany({
      where: {
        OR: [
          { firstName: { contains: trimmedQuery, mode: "insensitive" } },
          { lastName: { contains: trimmedQuery, mode: "insensitive" } },
          { email: { contains: trimmedQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 5,
    }),
    // Search Properties by address or city
    prisma.property.findMany({
      where: {
        OR: [
          { address: { contains: trimmedQuery, mode: "insensitive" } },
          { city: { contains: trimmedQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        address: true,
        city: true,
      },
      take: 5,
    }),
    // Search Tenants by name
    prisma.tenancy.findMany({
      where: {
        OR: [
          { tenantName: { contains: trimmedQuery, mode: "insensitive" } },
          { tenantEmail: { contains: trimmedQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        tenantName: true,
        property: {
          select: { address: true },
        },
      },
      take: 5,
    }),
  ]);

  return {
    clients: clients.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
    })),
    properties: properties.map((p) => ({
      id: p.id,
      address: p.address,
      city: p.city,
    })),
    tenants: tenancies.map((t) => ({
      id: t.id,
      tenantName: t.tenantName,
      propertyAddress: t.property.address,
      tenancyId: t.id,
    })),
  };
}
