import { Page } from '@playwright/test';

export function generateUniqueEmail(base: string): string {
  const timestamp = Date.now();
  const [local, domain] = base.split('@');
  return `${local}+${timestamp}@${domain}`;
}

export async function login(page: Page, email: string, password = 'password123') {
  console.log(`[Login] Navigating to /login...`);
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  console.log(`[Login] Filling credentials for ${email}...`);
  
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  
  console.log(`[Login] Submitting form...`);
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.getByRole('button', { name: 'Sign In' }).click()
  ]);
  console.log(`[Login] Navigation complete.`);
}
