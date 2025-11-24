"use server";

import { prisma } from "@/lib/db";

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "ASSOCIATE" | "VIEWER";
  createdAt: Date;
};

export async function getTeamMembers(): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return users as TeamMember[];
}
