import { test, expect } from '@playwright/test';
import { generateUniqueEmail, login } from './utils';

test.describe('The Full Firm Lifecycle (Master E2E)', () => {
  // Shared state variables
  const suffix = Date.now().toString().slice(-6);
  const managerEmail = generateUniqueEmail(`manager${suffix}@legalapp.com`);
  const associateEmail = generateUniqueEmail(`clerk${suffix}@legalapp.com`);
  const managerName = `Mr. Manager ${suffix}`;
  const associateName = `Nkechi Clerk ${suffix}`;
  
  const clientName = { first: 'Dangote', last: 'Refinery' };
  const clientFull = `${clientName.first} ${clientName.last}`;
  const clientEmail = `client${suffix}@refinery.com`;
  const propertyName = `Refinery Housing Estate ${suffix}`;
  const tenantName = `John Doe ${suffix}`;

  test('Master Workflow: Founder -> Clerk -> Manager -> Clerk -> Founder', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for full flow
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ========================================
    // Act 1: The Founder (SUPER_ADMIN)
    // ========================================
    await test.step('Act 1: The Founder (Create Team)', async () => {
      await login(page, 'admin@legalapp.com', 'Admin123!');
      await expect(page).toHaveURL(/\/$/);
      
      await page.goto('/settings');
      await page.getByTestId('team-tab').click();
      
      // Create Manager
      await page.getByRole('button', { name: 'Add Member' }).click();
      await page.waitForTimeout(500); // Wait for sheet animation
      await page.getByPlaceholder('Full name').fill(managerName);
      await page.getByPlaceholder('email@example.com').fill(managerEmail);
      await page.getByPlaceholder('Min 8 characters').fill('password123');
      // Select MANAGER role
      await page.waitForTimeout(200);
      const roleTrigger = page.getByRole('dialog').getByRole('combobox');
      await roleTrigger.click();
      await page.getByRole('option', { name: 'MANAGER' }).click();
      await page.waitForTimeout(200);
      await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click({ force: true });
      
      // Wait for user creation to complete (API call)
      await page.waitForTimeout(2000); // Give time for API call
      
      // Wait for modal to close and row to appear
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
      await expect(page.locator(`text=${managerName}`)).toBeVisible();
      
      // Create Associate
      await page.getByRole('button', { name: 'Add Member' }).click();
      await page.waitForTimeout(500);
      await page.getByPlaceholder('Full name').fill(associateName);
      await page.getByPlaceholder('email@example.com').fill(associateEmail);
      await page.getByPlaceholder('Min 8 characters').fill('password123');
      // Select ASSOCIATE role
      await page.waitForTimeout(200);
      await roleTrigger.click();
      await page.getByRole('option', { name: 'ASSOCIATE' }).click();
      // Wait for dropdown to close (it should auto-close) and click Create
      await page.waitForTimeout(200);
      await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click({ force: true });
      
      // Wait for user creation to complete
      await page.waitForTimeout(2000);
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
      await expect(page.locator(`text=${associateName}`)).toBeVisible();
      
      // Logout
      await page.locator('button:has-text("PP")').click(); // Admin avatar
      await page.getByRole('menuitem', { name: 'Log out' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/login/);
      console.log('✅ Act 1: Founder created users and logged out');
    });

    // ========================================
    // Act 2: The Clerk (ASSOCIATE)
    // ========================================
    await test.step('Act 2: The Clerk (Create Assets)', async () => {
      await login(page, associateEmail, 'password123');
      
      // Verify Dashboard redirects to clients or doesn't show revenue
      // RBAC typically redirects Associate to /clients on login if they can't see dashboard
      // Or if they go to dashboard, they see limited view. 
      // Requirement: "Dashboard redirects to /clients (Cannot see Revenue)"
      await expect(page).toHaveURL(/clients/); 
      
      // Create Client
      await page.getByRole('button', { name: 'Add Client' }).click();
      await page.getByLabel('First Name').fill(clientName.first);
      await page.getByLabel('Last Name').fill(clientName.last);
      await page.getByLabel('Email').fill(clientEmail);
      await page.getByLabel('Phone').fill('08012345678');
      await page.getByLabel('Address').fill('Lekki Free Zone');
      await page.getByLabel('Bank Name').fill('GTBank');
      await page.getByLabel('Account Number').fill('0123456789');
      await page.getByLabel('Account Name').fill(clientFull);
      await page.getByRole('button', { name: 'Save Client' }).click();
      await page.waitForTimeout(1000);
      
      // Create Property
      await page.goto('/properties');
      await page.getByRole('button', { name: 'Add Property' }).click();
      
      // Select Owner
      await page.getByRole('combobox').first().click();
      await page.getByRole('option').filter({ hasText: clientFull }).first().click().catch(async () => {
          await page.getByText(clientFull, { exact: true }).click();
      });
      
      await page.getByLabel('Address').fill(propertyName);
      await page.getByLabel('City').fill('Lagos');
      await page.getByLabel('Registration Number').fill(`REF/${suffix}`);
      
      // Select Structure: Block of Flats
      const structureTypeTrigger = page.locator('[name="structureType"]').or(
        page.getByText('Structure Type').locator('..').getByRole('combobox')
      );
      await structureTypeTrigger.click();
      await page.waitForTimeout(200);
      await page.getByRole('option', { name: /Block of Flats/i }).click({ force: true });
      
      // Units: 4 Units
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Select type")').first().click();
      await page.waitForTimeout(300);
      // Select a unit type that's visible (e.g., 2 Bedroom)
      await page.getByRole('option', { name: '2 Bedroom' }).click({ force: true });
      await page.waitForTimeout(200);
      await page.locator('input[type="number"]').first().fill('4');
      
      await page.getByRole('button', { name: 'Save Property' }).click();
      await page.waitForTimeout(2000);
      
      // Verify Pending Approval
      const propertyCard = page.locator(`text=${propertyName}`).first();
      await expect(propertyCard).toBeVisible();
      await expect(page.locator('text=PENDING').first()).toBeVisible(); // Use .first() to avoid strict mode violation
      
      // Logout - find the avatar button in the header (more generic approach)
      // Look for the user menu trigger button in the top right
      const userMenuButton = page.locator('header button[type="button"]').last();
      await userMenuButton.click();
      await page.getByRole('menuitem', { name: 'Log out' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/login/);
    });

    // ========================================
    // Act 3: The Boss (MANAGER)
    // ========================================
    await test.step('Act 3: The Boss (Approve)', async () => {
      await login(page, managerEmail, 'password123');
      
      // Navigate directly to properties page
      await page.goto('/properties');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Find the property row and click its action menu
      const propertyRow = page.locator('tr', { hasText: propertyName }).first();
      await expect(propertyRow).toBeVisible({ timeout: 10000 });
      
      // Click the action menu button (three dots) in that row
      await propertyRow.locator('button').click();
      await page.waitForTimeout(300);
      
      // Click "Approve" from dropdown (the Approve button is in the dropdown, not on detail page)
      await page.getByRole('menuitem', { name: 'Approve' }).click();
      await page.waitForTimeout(1000);
      
      // Verify Badge turns Green (Approved) - page should refresh
      await page.waitForLoadState('networkidle');
      await expect(page.locator('tr', { hasText: propertyName }).first().getByText('APPROVED')).toBeVisible({ timeout: 10000 });
      
      // Logout
      const managerMenuButton = page.locator('header button[type="button"]').last();
      await managerMenuButton.click();
      await page.getByRole('menuitem', { name: 'Log out' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/login/);
      console.log('✅ Act 3: Manager approved property and logged out');
    });

    // ========================================
    // Act 4: The Execution (ASSOCIATE)
    // ========================================
    await test.step('Act 4: The Execution (Tenancy & Finance)', async () => {
      await login(page, associateEmail, 'password123');
      
      await page.goto('/properties');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Find the property row and click its action menu
      const propertyRow = page.locator('tr', { hasText: propertyName }).first();
      await expect(propertyRow).toBeVisible({ timeout: 10000 });
      
      // Click the action menu button (three dots) in that row
      await propertyRow.locator('button').click();
      await page.waitForTimeout(300);
      
      // Click "View Details" from dropdown
      await page.getByRole('menuitem', { name: 'View Details' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      // Inventory: Assign Tenant - click the first "Assign Tenant" button
      await page.getByRole('button', { name: 'Assign Tenant' }).first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Create Tenancy - the form opens in a Sheet (side panel)
      // Wait for the sheet to be visible
      const tenancySheet = page.locator('[data-state="open"]').first();
      await expect(tenancySheet).toBeVisible({ timeout: 10000 });
      
      // Fill form fields with waits between each to ensure they complete
      // Tenant Name
      await page.getByPlaceholder('John Doe').fill(tenantName);
      await page.waitForTimeout(300);
      
      // Tenant Email
      await page.getByPlaceholder('john@example.com').fill(`tenant${suffix}@test.com`);
      await page.waitForTimeout(300);
      
      // Tenant Phone
      await page.getByPlaceholder('08012345678').fill('08012345678');
      await page.waitForTimeout(300);
      
      // Annual Rent - find by placeholder
      await page.getByPlaceholder('2000000.00').fill('5000000');
      await page.waitForTimeout(300);
      
      // Dates have default values, skip them
      // Payment Frequency has default value (Annually), skip it
      
      // Click Save Tenancy button
      await page.getByRole('button', { name: 'Save Tenancy' }).click();
      await page.waitForTimeout(3000); // Wait for save and redirect
      
      // Finance: Record Payment
      // usually redirect goes to Tenancy Dashboard. Look for "Record Payment"
      await page.getByRole('button', { name: 'Record Payment' }).click();
      await page.getByLabel('Amount').fill('5000000');
      // Payment Date default today
      await page.getByRole('button', { name: 'Save Payment' }).click();
      await page.waitForTimeout(1000);
      
      // Docs: Download Receipt
      // Trigger download
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download Receipt' }).first().click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('receipt');
      
      // Ops: Record Expense
      await page.getByRole('tab', { name: 'Expenses' }).click();
      await page.getByRole('button', { name: 'Record Expense' }).click();
      await page.getByLabel('Description').fill('Repairs');
      await page.getByLabel('Amount').fill('50000');
      await page.getByLabel('Category').fill('Maintenance'); // If select?
      // If category is a select, we might need click/option. 
      // Assuming text input for simplicity or default select.
      // If it fails, I'll debug.
      // Try to just submit if category is optional or prefilled, or fill if text.
      await page.getByRole('button', { name: 'Save Expense' }).click();
      
      // Logout
      const associateMenuButton2 = page.locator('header button[type="button"]').last();
      await associateMenuButton2.click();
      await page.getByRole('menuitem', { name: 'Log out' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/login/);
    });

    // ========================================
    // Act 5: The Audit (SUPER_ADMIN)
    // ========================================
    await test.step('Act 5: The Audit', async () => {
      await login(page, 'admin@legalapp.com', 'Admin123!');
      
      // Dashboard: Verify Revenue matches 5M
      // Need to ensure the dashboard shows THIS payment.
      // It might show total revenue. Since we just added 5M, it should be at least 5M.
      // Text might be "₦5,000,000" or similar formatted.
      await expect(page.locator('text=5,000,000')).toBeVisible();
      
      // Audit Log
      await page.goto('/settings');
      await page.getByTestId('audit-tab').click(); // Assuming audit tab exists
      
      // Verify logs
      // Look for "RECORD_PAYMENT" and "Nkechi Clerk"
      await expect(page.locator('table')).toContainText('RECORD_PAYMENT');
      await expect(page.locator('table')).toContainText(associateName); // might be just "Nkechi Clerk"
    });
  });
});
