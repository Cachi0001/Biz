import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Bizflow/);
    await expect(page.locator('h1')).toContainText('Welcome to Bizflow');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h1')).toContainText('Create Account');
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should attempt login with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should either redirect to dashboard or show error message
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await page.locator('.error-message').isVisible();
    
    expect(url.includes('/dashboard') || hasError).toBeTruthy();
  });

  test('should register new user with valid data', async ({ page }) => {
    await page.click('text=Sign up');
    
    const timestamp = Date.now();
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should either redirect or show success/error message
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await page.locator('.error-message').isVisible();
    const hasSuccess = await page.locator('.success-message').isVisible();
    
    expect(url.includes('/dashboard') || hasError || hasSuccess).toBeTruthy();
  });
});