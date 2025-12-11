import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

test.describe("Security Force Change Password", () => {
    // Helper to create a user with mustChangePassword = true
    const createUser = async (email: string) => {
        const hash = await bcrypt.hash("Password123!", 10);
        return await prisma.user.upsert({
            where: { email },
            update: { 
                password: hash, 
                mustChangePassword: true,
                role: "ASSOCIATE" 
            },
            create: {
                name: "Test Force User",
                email,
                password: hash,
                role: "ASSOCIATE",
                mustChangePassword: true
            }
        });
    };

    const email = "forcechange@test.com";

    test.beforeAll(async () => {
        await createUser(email);
    });

    test.afterAll(async () => {
        await prisma.user.delete({ where: { email } }).catch(() => {});
        await prisma.$disconnect();
    });

    test("should redirect to force-change on login and allow update", async ({ page }) => {
        // 1. Login
        await page.goto("/login");
        await page.fill("input[name='email']", email);
        await page.fill("input[name='password']", "Password123!");
        await page.click("button[type='submit']");

        // 2. Expect redirect to /auth/force-change
        await expect(page).toHaveURL(/\/auth\/force-change/);
        
        // 3. Try to navigate away
        await page.goto("/");
        await expect(page).toHaveURL(/\/auth\/force-change/);

        // 4. Update Password
        await page.fill("input[name='password']", "NewStrongPassword1!");
        await page.fill("input[name='confirmPassword']", "NewStrongPassword1!");
        await page.click("button[type='submit']");

        // 5. Expect success and redirect to dashboard
        await expect(page).toHaveURL("/");
        
        // 6. Verify in DB (mustChangePassword should be false)
        const updatedUser = await prisma.user.findUnique({ where: { email } });
        expect(updatedUser?.mustChangePassword).toBe(false);
    });
});
