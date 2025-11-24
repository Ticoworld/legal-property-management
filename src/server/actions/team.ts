"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helper";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "ASSOCIATE", "VIEWER"]),
});

function normalize(input: FormData | Record<string, unknown>): Record<string, unknown> {
  if (input instanceof FormData) {
    const o: Record<string, unknown> = {};
    input.forEach((value, key) => {
      o[key] = typeof value === "string" ? value : String(value);
    });
    return o;
  }
  return input;
}

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: unknown;
};

export async function createUser(input: FormData | Record<string, unknown>): Promise<ActionResult> {
  try {
    const current = await getCurrentUser();
    if (current.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const parsed = CreateUserSchema.safeParse(normalize(input));
    if (!parsed.success) {
      return { success: false, message: "Validation failed", errors: parsed.error.flatten() };
    }

    const { name, email, password, role } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return { success: false, message: "Email already exists" };
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, password: hashed, role },
        select: { id: true, email: true, role: true, name: true },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE_USER",
          entityType: "User",
          entityId: created.id,
          performedBy: current.id,
          details: { email: created.email, role: created.role },
        },
      });

      return created;
    });

    revalidatePath("/settings");
    return { success: true, message: "User created" };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create user" };
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const current = await getCurrentUser();
    if (current.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: userId } });
      await tx.auditLog.create({
        data: {
          action: "DELETE_USER",
          entityType: "User",
          entityId: userId,
          performedBy: current.id,
          details: { email: user.email, role: user.role },
        },
      });
    });

    revalidatePath("/settings");
    return { success: true, message: "User deleted" };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to delete user" };
  }
}

// Convenience wrapper to use as a form action from Client Components
export async function deleteUserAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("userId") || "");
  return deleteUser(id);
}
