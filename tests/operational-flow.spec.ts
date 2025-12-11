import { test, expect } from '@playwright/test';

test.describe('Real World Management Flow', () => {
  test('Create tenancy with guarantor and record expense', async ({ page }) => {
    // Increase timeout for this comprehensive test
    test.setTimeout(60000);

    // Setup: Set viewport to 1920x1080 (matching e2e-full-flow)
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
    // Step 2: Create Tenancy with Risk Data
    // ========================================
    await page.goto('/tenancies');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: 'Add Tenancy' }).click();
    await page.waitForTimeout(1000); // Wait for sheet to open
    
    // Select Property from dropdown
    const propertyTrigger = page.getByRole('combobox').first();
    await propertyTrigger.click();
    await page.waitForTimeout(500);
    
    // Select first property from dropdown
    const firstProperty = page.locator('[cmdk-item]').first();
    await firstProperty.click();
    await page.waitForTimeout(500);
    
    // Fill Tenant Details - Chief Obi
    await page.getByLabel('Tenant Name').fill('Chief Obi');
    await page.getByLabel('Tenant Email').fill('chiefobi@test.com');
    await page.getByLabel('Tenant Phone').fill('08099999901');
    
    // Fill Rent amount
    await page.getByLabel(/Annual Rent/i).fill('1000000');
    
    // Crucial: The Guarantor & Emergency Contact section is visible by default
    // Fill Guarantor Details - Dr. Emeka
    await page.getByLabel('Guarantor Name').fill('Dr. Emeka');
    await page.getByLabel('Guarantor Phone').fill('08099999999');
    
    // Save Tenancy - wait for button to be enabled
    const saveTenancyButton = page.getByRole('button', { name: 'Save Tenancy' });
    await saveTenancyButton.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500); // Give form validation time to complete
    await saveTenancyButton.click();
    await page.waitForTimeout(3000);

    
    // Refresh if needed to see new tenancy
    const tenancyExists = await page.locator('text=Chief Obi').first().isVisible().catch(() => false);
    if (!tenancyExists) {
      await page.reload();
      await page.waitForLoadState('networkidle');
    }
    
    // Assert success - find the new tenancy
    await expect(page.locator('text=Chief Obi').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 2: Tenancy created with guarantor data');

    // ========================================
    // Step 3: Navigate to Tenancy Detail Page
    // ========================================
    // Click on the tenancy link to view details
    const tenancyLink = page.getByRole('link', { name: /Chief Obi/i }).first();
    await tenancyLink.waitFor({ state: 'visible', timeout: 10000 });
    await tenancyLink.click();
    
    // Wait for navigation to detail page
    await page.waitForURL(/\/tenancies\/[a-z0-9]+$/i, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ Step 3: Navigated to tenancy detail page');

    // ========================================
    // Step 4: Record Payment (to have Total Paid)
    // ========================================
    const recordPaymentButton = page.getByRole('button', { name: 'Record Payment' });
    if (await recordPaymentButton.isVisible().catch(() => false)) {
      await recordPaymentButton.click();
      await page.waitForTimeout(1000);
      
      // Fill payment amount
      await page.getByLabel('Amount').fill('1000000');
      
      // Submit payment
      await page.getByRole('button', { name: 'Record Payment' }).last().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log('✅ Step 4: Payment recorded');
    }

    // Reload to see updated data
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ========================================
    // Step 5: Record Expense
    // ========================================
    const recordExpenseButton = page.getByRole('button', { name: 'Record Expense' });
    if (await recordExpenseButton.isVisible().catch(() => false)) {
      await recordExpenseButton.click();
      await page.waitForTimeout(1000);
      
      // Select Category: Repair
      const categoryTrigger = page.getByRole('combobox');
      if (await categoryTrigger.isVisible()) {
        await categoryTrigger.click();
        await page.waitForTimeout(300);
        await page.getByRole('option', { name: /Repair/i }).click().catch(async () => {
          await page.getByText('Repair').click();
        });
      }
      
      // Fill Amount: 50000
      await page.getByLabel('Amount').fill('50000');
      
      // Fill Description: Plumbing
      await page.getByLabel('Description').fill('Plumbing');
      
      // Save Expense
      await page.getByRole('button', { name: /Record Expense|Save/i }).last().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log('✅ Step 5: Expense recorded');
    }

    // ========================================
    // Step 6: Verify Financial Math
    // ========================================
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify Financial Card shows correct Net Remittance
    // Net Remittance should be 950,000 (1,000,000 - 50,000)
    await expect(page.getByText('Net Remittance')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/₦?950,000|950000/)).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Step 6: Financial verification complete - Net Remittance = ₦950,000');
    console.log('🎉 Operational Flow Complete: Login → Tenancy (with Guarantor) → Payment → Expense → Financial Verification');
  });
});
