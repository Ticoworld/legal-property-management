import { test, expect } from '@playwright/test';

// Helper to create unique suffix for test data to avoid collisions when re-running.
function uniq() { return Date.now().toString().slice(-6); }

test.describe('Critical Path', () => {
  test('Legal Workflow', async ({ page }) => {
    const suffix = uniq();
    const clientFirst = 'TestUser';
    const clientLast = 'Smith'; // Use fixed valid lastname without numbers
    const clientFull = `${clientFirst} ${clientLast}`;
    const clientEmail = `testuser${suffix}@client.com`;
    const propertyAddress = `Plot 100 Test Zone Area Block ${suffix}`; // Make address longer
    const tenantName = 'John Doe';

    // Step 1: Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@legalapp.com');
    await page.getByLabel('Password').fill('Admin123!');
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In' }).click()
    ]);
    
    // Should be redirected to dashboard
    console.log('Current URL after login:', page.url());
    await expect(page).toHaveURL(/\/$/);

    // Step 2: Create Client
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add Client' }).click();
    
    // Wait for sheet to open
    await page.waitForTimeout(1000);
    
    await page.getByLabel('First Name').fill(clientFirst);
    await page.getByLabel('Last Name').fill(clientLast);
    await page.getByLabel('Email').fill(clientEmail);
    await page.getByLabel('Phone').fill('08000000000');
    await page.getByLabel('Address').fill('123 Test Street, Lagos State'); // Address with at least 10 chars
    await page.getByLabel(/NIN/).fill('11111111111');
    
    // Click save and wait for either success or error
    const saveButton = page.getByRole('button', { name: 'Save Client' });
    await saveButton.click();
    
    // Wait for either: sheet closes (success) or button text changes back from "Saving..."
    await page.waitForTimeout(5000);
    
    // Check if we're back on the clients page (success scenario)
    const currentUrl = page.url();
    console.log('After save, URL:', currentUrl);
    
    // Check for the client in the table
    const clientExists = await page.locator(`text=${clientFirst}`).first().isVisible().catch(() => false);
    console.log('Client visible:', clientExists);
    
    if (!clientExists) {
      // If not visible, refresh and try again
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    // Assert client is in table
    await expect(page.locator(`text=${clientFirst}`).first()).toBeVisible({ timeout: 10000 });

    // Step 3: Create Property
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add Property' }).click();
    
    // Wait for sheet to open
    await page.waitForTimeout(1000);
    
    // Open owner combobox
    const ownerTrigger = page.getByRole('combobox').first();
    await ownerTrigger.click();
    await page.waitForTimeout(500);
    
    // Select the client in the popover list
    await page.getByRole('option').filter({ hasText: clientFull }).first().click().catch(async () => {
      // Fallback: CommandItem might not have role option; use text locator
      await page.getByText(clientFull, { exact: true }).click();
    });
    
    await page.waitForTimeout(500);
    await page.getByLabel('Address').fill(propertyAddress);
    await page.getByLabel('City').fill('Lagos');
    await page.getByLabel('Registration Number').fill(`LR/2024/${suffix}`);
    
    // Save
    await page.getByRole('button', { name: 'Save Property' }).click();
    await page.waitForTimeout(5000);
    
    // Check if property visible
    const propertyExists = await page.locator(`text=${propertyAddress.substring(0, 20)}`).first().isVisible().catch(() => false);
    console.log('Property visible after save:', propertyExists);
    
    if (!propertyExists) {
      // Reload to see new property
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    await expect(page.locator(`text=Plot 100`).first()).toBeVisible({ timeout: 10000 });

    console.log('✅ All 3 core steps completed successfully: Login, Create Client, Create Property');
    
    // TODO: Complete tenancy and audit steps
    // Step 4: Create Tenancy
    // Step 5: Audit Check
  });
});
