import { test, expect } from '@playwright/test';

// Helper to create unique suffix for test data
function uniq() { return Date.now().toString().slice(-6); }

test.describe('RBAC Security Verification', () => {
  
  // ========================================
  // Scenario 1: The Associate (Restricted Actions)
  // ========================================
  test.describe('Associate Restrictions', () => {
    const suffix = uniq();
    const associateEmail = `associate${suffix}@test.com`;
    const associatePassword = 'Associate123!';
    const associateName = `Test Associate ${suffix}`;

    test.beforeAll(async ({ browser }) => {
      // Create an Associate user as Admin first
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Login as Admin
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Email').fill('admin@legalapp.com');
      await page.getByLabel('Password').fill('Admin123!');
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }),
        page.getByRole('button', { name: 'Sign In' }).click()
      ]);

      // Navigate to Settings > Team
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('team-tab').click();
      await page.waitForTimeout(500);

      // Click "Add Member" button
      await page.getByRole('button', { name: 'Add Member' }).click();
      await page.waitForTimeout(500);

      // Fill the form to create Associate user
      await page.getByPlaceholder('Full name').fill(associateName);
      await page.getByPlaceholder('email@example.com').fill(associateEmail);
      await page.getByPlaceholder('Min 8 characters').fill(associatePassword);
      
      // Select ASSOCIATE role - click the trigger with current value "VIEWER"
      await page.locator('button:has-text("VIEWER")').click();
      await page.waitForTimeout(200);
      await page.getByRole('option', { name: 'ASSOCIATE' }).click();

      // Submit
      await page.getByRole('button', { name: 'Create' }).click();
      await page.waitForTimeout(2000);

      await page.close();
    });

    test('Associate cannot see Settings link in sidebar', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Login as Associate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Email').fill(associateEmail);
      await page.getByLabel('Password').fill(associatePassword);
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }),
        page.getByRole('button', { name: 'Sign In' }).click()
      ]);

      // Verify we're logged in
      await expect(page).toHaveURL(/\/$/);

      // Assert: Settings link should NOT be visible in sidebar
      const settingsLink = page.locator('nav').getByRole('link', { name: 'Settings' });
      await expect(settingsLink).not.toBeVisible();

      console.log('✅ Associate: Settings link is hidden');
    });

    test('Associate cannot see Danger Zone on Client page', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Login as Associate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Email').fill(associateEmail);
      await page.getByLabel('Password').fill(associatePassword);
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }),
        page.getByRole('button', { name: 'Sign In' }).click()
      ]);

      // Navigate to Clients and click on first client (if exists)
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');
      
      // Click "View" on the first client if available
      const viewButton = page.getByRole('button', { name: 'View' }).first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Assert: Danger Zone should NOT be visible
        const dangerZone = page.getByTestId('danger-zone');
        await expect(dangerZone).not.toBeVisible();

        console.log('✅ Associate: Danger Zone is hidden on Client page');
      } else {
        console.log('⚠️ No clients to test - skipping Danger Zone check');
      }
    });

    test('Associate cannot access Settings page directly', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Login as Associate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Email').fill(associateEmail);
      await page.getByLabel('Password').fill(associatePassword);
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }),
        page.getByRole('button', { name: 'Sign In' }).click()
      ]);

      // Try to navigate directly to Settings
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Should be redirected to home page (RBAC redirect)
      await expect(page).toHaveURL(/\/$/);

      console.log('✅ Associate: Redirected from Settings page');
    });
  });

  // ========================================
  // Scenario 2: The Admin (Offboarding)
  // ========================================
  test.describe('Admin Offboarding Flow', () => {
    const suffix = uniq();
    const testUserEmail = `offboard${suffix}@test.com`;
    const testUserPassword = 'Offboard123!';
    const testUserName = `Offboard User ${suffix}`;

    test('Admin can create and delete a user (offboarding)', async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Login as Admin
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Email').fill('admin@legalapp.com');
      await page.getByLabel('Password').fill('Admin123!');
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }),
        page.getByRole('button', { name: 'Sign In' }).click()
      ]);

      console.log('✅ Admin logged in');

      // Navigate to Settings > Team
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('team-tab').click();
      await page.waitForTimeout(500);

      // Step 1: Create a new user
      await page.getByRole('button', { name: 'Add Member' }).click();
      await page.waitForTimeout(500);

      await page.getByPlaceholder('Full name').fill(testUserName);
      await page.getByPlaceholder('email@example.com').fill(testUserEmail);
      await page.getByPlaceholder('Min 8 characters').fill(testUserPassword);
      
      // Role is already VIEWER by default, no need to change
      await page.waitForTimeout(200);

      await page.getByRole('button', { name: 'Create' }).click();
      await page.waitForTimeout(2000);

      // Refresh to see the new user
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.getByTestId('team-tab').click();
      await page.waitForTimeout(500);

      // Assert: User should be visible in the team list
      await expect(page.locator(`text=${testUserName}`).first()).toBeVisible({ timeout: 10000 });
      console.log('✅ User created successfully');

      // Step 2: Delete the user (Offboarding)
      // Find the row with the user and click "Remove"
      const userRow = page.locator('tr', { hasText: testUserName });
      const removeButton = userRow.getByTestId('delete-user-btn');
      await removeButton.click();
      await page.waitForTimeout(500);
      
      // Confirm deletion in the dialog
      await page.getByTestId('confirm-delete-user-btn').click();
      await page.waitForTimeout(2000);

      // Refresh to verify deletion
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.getByTestId('team-tab').click();
      await page.waitForTimeout(500);

      // Assert: User should be removed from the list
      await expect(page.locator(`text=${testUserName}`)).not.toBeVisible();
      console.log('✅ User deleted (offboarded) successfully');

      // Step 3: Verify deleted user cannot login
      // Logout first - click user avatar button (has initials like "PP") then "Log out"
      await page.locator('button:has-text("PP")').click();
      await page.waitForTimeout(200);
      await page.getByRole('menuitem', { name: 'Log out' }).click();
      await page.waitForLoadState('networkidle');

      // Try to login as the deleted user
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('Email').fill(testUserEmail);
      await page.getByLabel('Password').fill(testUserPassword);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForTimeout(3000);

      // Should still be on login page (login failed)
      await expect(page).toHaveURL(/\/login/);
      console.log('✅ Deleted user cannot login');

      console.log('🎉 Admin Offboarding Flow Complete');
    });
  });
});
