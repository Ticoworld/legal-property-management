import { test, expect } from '@playwright/test';

// Helper to create unique suffix for test data to avoid collisions when re-running.
function uniq() { return Date.now().toString().slice(-6); }

test.describe('Full Asset Lifecycle', () => {
  test('Complete flow with Bank Details and Unit Generator', async ({ page }) => {
    // Increase timeout for this comprehensive test
    test.setTimeout(60000);
    const suffix = uniq();
    
    // Test data
    const clientFirst = 'TestClient';
    const clientLast = 'Owner';
    const clientFull = `${clientFirst} ${clientLast}`;
    const clientEmail = `client${suffix}@test.com`;
    const clientPhone = '08012345678';
    const bankName = 'Zenith Bank';
    const accountNumber = `10${suffix.padStart(8, '0')}`; // 10 digits
    const accountName = `${clientFirst} ${clientLast}`;
    const propertyAddress = `Plot 500 Test Estate ${suffix}`;

    // Setup: Set viewport to 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ========================================
    // Step 1: Login
    // ========================================
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.getByLabel('Email').fill('admin@legalapp.com');
    await page.getByLabel('Password').fill('Admin123!');
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In' }).click()
    ]);
    
    // Assert redirection to Dashboard
    await expect(page).toHaveURL(/\/$/);
    console.log('✅ Step 1: Login successful');

    // ========================================
    // Step 2: Create Client (With Bank Info)
    // ========================================
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: 'Add Client' }).click();
    await page.waitForTimeout(1000); // Wait for sheet to open
    
    // Fill basic client info
    await page.getByLabel('First Name').fill(clientFirst);
    await page.getByLabel('Last Name').fill(clientLast);
    await page.getByLabel('Email').fill(clientEmail);
    await page.getByLabel('Phone').fill(clientPhone);
    await page.getByLabel('Address').fill('123 Test Street, Lagos State');
    
    // Fill Bank Details
    await page.getByLabel('Bank Name').fill(bankName);
    await page.getByLabel('Account Number').fill(accountNumber);
    await page.getByLabel('Account Name').fill(accountName);
    
    // Save and wait
    await page.getByRole('button', { name: 'Save Client' }).click();
    await page.waitForTimeout(3000);
    
    // Refresh if needed to see new client
    const clientExists = await page.locator(`text=${clientFirst}`).first().isVisible().catch(() => false);
    if (!clientExists) {
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    // Assert success
    await expect(page.locator(`text=${clientFirst}`).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 2: Client created with bank details');

    // ========================================
    // Step 3: Create Multi-Unit Property
    // ========================================
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: 'Add Property' }).click();
    await page.waitForTimeout(1000); // Wait for sheet to open
    
    // Select the new Client as Owner
    const ownerTrigger = page.getByRole('combobox').first();
    await ownerTrigger.click();
    await page.waitForTimeout(500);
    
    // Select client from dropdown
    await page.getByRole('option').filter({ hasText: clientFull }).first().click().catch(async () => {
      // Fallback: CommandItem might not have role option
      await page.getByText(clientFull, { exact: true }).click();
    });
    
    await page.waitForTimeout(500);
    
    // Fill property address
    await page.getByLabel('Address').fill(propertyAddress);
    await page.getByLabel('City').fill('Lagos');
    await page.getByLabel('Registration Number').fill(`LR/2024/${suffix}`);
    
    // Structure Type: Select "Block of Flats / Multi-Tenanted"
    // Find the Structure Type select trigger
    const structureTypeTrigger = page.locator('[name="structureType"]').or(
      page.getByText('Structure Type').locator('..').getByRole('combobox')
    );
    await structureTypeTrigger.click();
    await page.waitForTimeout(500);
    
    // Select "Block of Flats / Multi-Tenanted" from the dropdown
    await page.getByRole('option', { name: /Block of Flats|Multi-Tenanted/i }).click().catch(async () => {
      // Fallback: try text locator
      await page.getByText('Block of Flats / Multi-Tenanted').click();
    });
    
    await page.waitForTimeout(1000); // Wait for Unit Generator to appear
    
    // Unit Generator: Row 1 - "2 Bedroom" x 4
    // The first row should be visible by default with a Select dropdown
    const unitType1Trigger = page.locator('button:has-text("Select type")').first();
    await unitType1Trigger.click();
    await page.waitForTimeout(500);
    
    // Select "2 Bedroom" from the dropdown
    await page.getByRole('option', { name: '2 Bedroom' }).click();
    await page.waitForTimeout(500);
    
    // Set quantity to 4
    const quantity1Input = page.locator('input[type="number"]').first();
    await quantity1Input.fill('4');
    
    // Click "Add Unit Type" to add second row
    await page.getByRole('button', { name: 'Add Unit Type' }).click();
    await page.waitForTimeout(1000); // Wait for new row to render
    
    // Unit Generator: Row 2 - "Self Contain" x 2
    // After selecting the first unit type, only the NEW row shows "Select type"
    // So we can use .last() to get the most recently added row
    const unitType2Trigger = page.locator('button:has-text("Select type")').last();
    await unitType2Trigger.waitFor({ state: 'visible', timeout: 5000 });
    await unitType2Trigger.click();
    await page.waitForTimeout(500);
    
    // Select "Self Contain" from the dropdown
    await page.getByRole('option', { name: 'Self Contain' }).click();
    await page.waitForTimeout(500);
    
    // Set quantity to 2 - find all number inputs and use the third one (0=qty1, 1=rent1, 2=qty2)
    const allQuantityInputs = page.locator('input[type="number"]');
    const quantity2Input = allQuantityInputs.nth(2);
    await quantity2Input.fill('2');
    
    // Save Property
    await page.getByRole('button', { name: 'Save Property' }).click();
    await page.waitForTimeout(3000);
    
    // Refresh if needed to see new property
    const propertyExists = await page.locator(`text=Plot 500`).first().isVisible().catch(() => false);
    if (!propertyExists) {
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    // Assert success
    await expect(page.locator(`text=Plot 500`).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 3: Multi-unit property created');

    // ========================================
    // Step 4: Verify Units (The Audit)
    // ========================================
    // Click "View" on the new property
    const viewButton = page.getByRole('button', { name: 'View' }).first();
    await viewButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Assert that the "Unit Inventory" section is visible
    await expect(page.getByText('Unit Inventory', { exact: true })).toBeVisible({ timeout: 10000 });
    
    // Assert Occupancy Rate
    await expect(page.getByText('0/6 Units Occupied')).toBeVisible();

    // Assert that exactly 6 Units are listed in the table
    // We can look for "Assign Tenant" buttons, there should be 6
    const assignButtons = page.getByRole('link', { name: 'Assign Tenant' });
    const unitCount = await assignButtons.count();
    expect(unitCount).toBe(6);
    
    // Assert that "Flat 1" (generated name) and "Two Bedroom" text is present
    await expect(page.locator('text=Flat 1').first()).toBeVisible();
    await expect(page.locator('text=Two Bedroom').first()).toBeVisible();
    
    console.log('✅ Step 4: Unit verification complete - 6 units created and visible in inventory');
    console.log('🎉 Full E2E Flow Complete: Login → Client (with Bank) → Multi-Unit Property → Unit Inventory');
  });
});
