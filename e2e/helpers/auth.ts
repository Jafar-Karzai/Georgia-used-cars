import { Page, expect } from '@playwright/test'

export async function login(page: Page, email: string = 'admin@georgiaused.com', password: string = 'Admin@123') {
  await page.goto('/auth/signin')
  
  // Fill in login form
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  
  // Submit login
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/admin/**')
  
  // Verify we're logged in by checking for user navigation
  await expect(page.locator('[data-testid="user-nav"]')).toBeVisible()
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-nav"]')
  await page.click('text="Sign out"')
  
  // Wait for redirect to signin page
  await page.waitForURL('/auth/signin')
}

export async function setupTestUser(_page: Page) {
  // This would typically involve API calls to create a test user
  // For now, we'll assume the test user exists
  console.log('Setting up test user...')
}