import { test, expect } from '@playwright/test';

// Helper to create unique suffix for test data
function uniq() { return Date.now().toString().slice(-6); }

test.describe('Security Patch Verification', () => {

  // ========================================
  // Scenario 1: VIEWER Cannot Create Tenancy
  // ========================================
  test('Viewer cannot create tenancy (RBAC)', async ({ page }) => {
    test.setTimeout(60000);
    const suffix = uniq();
    const viewerEmail = `viewer${suffix}@test.com`;
    const viewerPassword = 'Viewer123!';
    const viewerName = `Test Viewer ${suffix}`;

    await page.setViewportSize({ width: 1920, height: 1080 });

    // Step 1: Login as Admin and create Viewer user
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

    // Create Viewer user
    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('Full name').fill(viewerName);
    await page.getByPlaceholder('email@example.com').fill(viewerEmail);
    await page.getByPlaceholder('Min 8 characters').fill(viewerPassword);
    // Default role is VIEWER
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Viewer user created');

    // Step 2: Logout as Admin
    await page.locator('button:has-text("PP")').first().click().catch(async () => {
      // Try alternative avatar button text
      await page.locator('[data-testid="user-menu"]').first().click();
    });
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await page.waitForLoadState('networkidle');

    // Step 3: Login as Viewer
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill(viewerEmail);
    await page.getByLabel('Password').fill(viewerPassword);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In' }).click()
    ]);

    await expect(page).toHaveURL(/\/$/);
    console.log('✅ Viewer logged in');

    // Step 4: Navigate to Tenancies page
    await page.goto('/tenancies');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Assert: "Add Tenancy" button should NOT be visible for VIEWER
    const addTenancyButton = page.getByRole('button', { name: 'Add Tenancy' });
    await expect(addTenancyButton).not.toBeVisible();

    console.log('✅ RBAC Verified: Viewer cannot see Add Tenancy button');
  });

  // ========================================
  // Scenario 2: Associate Sees Masked PII
  // ========================================
  test('Associate sees masked PII in client list', async ({ page }) => {
    test.setTimeout(60000);
    const suffix = uniq();
    const associateEmail = `associate${suffix}@test.com`;
    const associatePassword = 'Associate123!';
    const associateName = `Test Associate`; // Shortened for avatar check
    const clientEmail = `piitest${suffix}@test.com`;
    const clientFirst = 'PIITest';
    const clientLast = 'Client';
    const clientPhone = '08012345678';
    const bankName = 'Test Bank';
    const accountNumber = '1234567890';

    await page.setViewportSize({ width: 1920, height: 1080 });

    // Step 1: Login as Admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill('admin@legalapp.com');
    await page.getByLabel('Password').fill('Admin123!');
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In' }).click()
    ]);

    // Step 2: Create a client with bank details
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add Client' }).click();
    await page.waitForTimeout(1000);
    
    await page.getByLabel('First Name').fill(clientFirst);
    await page.getByLabel('Last Name').fill(clientLast);
    await page.getByLabel('Email').fill(clientEmail);
    await page.getByLabel('Phone').fill(clientPhone);
    await page.getByLabel('Bank Name').fill(bankName);
    await page.getByLabel('Account Number').fill(accountNumber);
    await page.getByLabel('Account Name').fill(`${clientFirst} ${clientLast}`);
    
    await page.getByRole('button', { name: 'Save Client' }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Client with bank details created');

    // Step 3: Create Associate user
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('team-tab').click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('Full name').fill(associateName);
    await page.getByPlaceholder('email@example.com').fill(associateEmail);
    await page.getByPlaceholder('Min 8 characters').fill(associatePassword);
    
    await page.locator('button:has-text("VIEWER")').click();
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: 'ASSOCIATE' }).click();

    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(2000);
    console.log('✅ Associate user created');

    // Step 4: Logout as Admin
    await page.locator('button:has-text("PP")').first().click().catch(async () => {
      await page.locator('[data-testid="user-menu"]').first().click();
    });
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await page.waitForLoadState('networkidle');

    // Step 5: Login as Associate
    await page.goto('/login');
    await page.getByLabel('Email').fill(associateEmail);
    await page.getByLabel('Password').fill(associatePassword);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In' }).click()
    ]);

    await expect(page).toHaveURL(/\/$/);
    // Verify we are logged in as Associate (AVATAR "TA")
    await expect(page.locator('button:has-text("TA")').first()).toBeVisible();
    console.log('✅ Associate logged in');

    // Step 6: Navigate to Clients and check for masked data
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent).toContain('***MASKED***');
    
    console.log('✅ PII Verified: Associate sees masked bank details');
  });

  // ========================================
  // Scenario 3: Duplicate Tenancy Prevention
  // ========================================
  test('Prevents duplicate tenancy for same property', async ({ page }) => {
    test.setTimeout(90000);
    const suffix = uniq();
    
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Step 1: Login as Admin
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@legalapp.com');
    await page.getByLabel('Password').fill('Admin123!');
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In' }).click()
    ]);
    
    await expect(page).toHaveURL(/\/$/);
    console.log('✅ Step 1: Admin logged in');

    // Step 2: Create a new Client
    const clientFirst = 'DupTest';
    const clientLast = 'Owner';
    const clientEmail = `duptest${suffix}@test.com`;
    
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add Client' }).click();
    await page.waitForTimeout(1000);
    
    await page.getByLabel('First Name').fill(clientFirst);
    await page.getByLabel('Last Name').fill(clientLast);
    await page.getByLabel('Email').fill(clientEmail);
    await page.getByLabel('Phone').fill('08099999999');
    
    await page.getByRole('button', { name: 'Save Client' }).click();
    await page.waitForTimeout(2000);

    // Step 3: Create a new Property (Single Unit)
    const propertyAddress = `DupTest Street ${suffix}`;
    
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add Property' }).click();
    await page.waitForTimeout(1000);

    const ownerTrigger = page.getByRole('combobox').first();
    await ownerTrigger.click();
    await page.waitForTimeout(500);
    await page.getByRole('option').filter({ hasText: `${clientFirst} ${clientLast}` }).first().click().catch(async () => {
      await page.getByText(`${clientFirst} ${clientLast}`, { exact: true }).click();
    });
    await page.waitForTimeout(500);

    await page.getByLabel('Address').fill(propertyAddress);
    await page.getByLabel('City').fill('Lagos');
    await page.getByLabel('Registration Number').fill(`DUP/${suffix}`);
    
    await page.getByRole('button', { name: 'Save Property' }).click();
    await page.waitForTimeout(3000);

    // Step 4: Create FIRST Tenancy - Full Details
    await page.goto('/tenancies');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Add Tenancy' }).click();
    await page.waitForTimeout(1000);

    // Select new property
    const propertyTrigger = page.getByRole('combobox').first();
    await propertyTrigger.click();
    await page.waitForTimeout(500);
    const firstProperty = page.locator('[cmdk-item]').first();
    await firstProperty.click();
    await page.waitForTimeout(500);

    // Fill ALL Fields
    await page.getByLabel('Tenant Name').fill('First Tenant');
    await page.getByLabel('Tenant Email').fill('tenant1@test.com');
    await page.getByLabel('Tenant Phone').fill('08011111111');
    
    // Dates (default usually fine, but let's assert existing value or leave default)
    // Rent
    await page.getByLabel(/Annual Rent/i).fill('1000000');
    
    // Guarantor
    await page.getByLabel('Guarantor Name').fill('Dr. Guarantor');
    await page.getByLabel('Guarantor Phone').fill('09012345678');
    await page.getByLabel('Guarantor Address').fill('10 Guarantor Way');
    
    // Next of Kin
    await page.getByLabel('Next of Kin Name').fill('Next Kin');
    await page.getByLabel('Next of Kin Phone').fill('07012345678');
    await page.getByLabel('Relationship').fill('Brother');

    // Save
    const saveTenancyButton = page.getByRole('button', { name: 'Save Tenancy' });
    await saveTenancyButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveTenancyButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Step 4: First tenancy created with full details');

    // Step 5: Try to create SECOND Tenancy for SAME property
    await page.getByRole('button', { name: 'Add Tenancy' }).click();
    await page.waitForTimeout(1000);

    // Select the same property
    const propertyTrigger2 = page.getByRole('combobox').first();
    await propertyTrigger2.click();
    await page.waitForTimeout(500);
    const sameProperty = page.locator('[cmdk-item]').first();
    await sameProperty.click();
    await page.waitForTimeout(500);

    // Fill minimal details for second attempt (just to trigger validation)
    await page.getByLabel('Tenant Name').fill('Second Tenant');
    await page.getByLabel('Tenant Phone').fill('08022222222');
    await page.getByLabel(/Annual Rent/i).fill('1000000');
    
    const saveTenancyButton2 = page.getByRole('button', { name: 'Save Tenancy' });
    await saveTenancyButton2.click();
    await page.waitForTimeout(1000);

    // Step 6: Assert error message appears
    const errorToast = page.locator('text=/occupied|already active/i');
    await expect(errorToast).toBeVisible({ timeout: 10000 });

    console.log('✅ Step 5: Duplicate tenancy prevented - error message shown');
    console.log('🎉 Duplicate Tenancy Prevention Verified');
  });
});
