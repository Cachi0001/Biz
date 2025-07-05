import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subscription_plan: 'weekly',
        subscription_status: 'trial'
      }));
    });
    await page.goto('/dashboard');
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for metric cards
    await expect(page.locator('text=Total Sales')).toBeVisible();
    await expect(page.locator('text=Total Customers')).toBeVisible();
    await expect(page.locator('text=Total Products')).toBeVisible();
    await expect(page.locator('text=Pending Invoices')).toBeVisible();
  });

  test('should navigate to customers page from quick action', async ({ page }) => {
    await page.click('text=Add Customer');
    await expect(page).toHaveURL(/.*customers/);
  });

  test('should navigate to products page from quick action', async ({ page }) => {
    await page.click('text=Add Product');
    await expect(page).toHaveURL(/.*products/);
  });

  test('should navigate to invoices page from quick action', async ({ page }) => {
    await page.click('text=Create Invoice');
    await expect(page).toHaveURL(/.*invoices/);
  });

  test('should display recent activities', async ({ page }) => {
    const recentActivities = page.locator('[data-testid="recent-activities"]');
    await expect(recentActivities).toBeVisible();
  });

  test('should show trial status for trial users', async ({ page }) => {
    const trialBanner = page.locator('text=7-Day Free Trial');
    await expect(trialBanner).toBeVisible();
  });
});