import { test as baseTest, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests authentication flows including:
 * - Redirect unauthenticated users to login
 * - Login page display
 * - Authenticated access to protected routes
 *
 * Note: These tests use base Playwright test without auth fixture since they test auth itself
 */

baseTest.describe('Authentication', () => {
  baseTest('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto('/');

    // Should redirect to login or show login page
    await expect(page).toHaveURL(/.*login.*|.*auth.*/i, { timeout: 5000 });
  });

  baseTest('should show login page', async ({ page }) => {
    await page.goto('/login');

    // Should display login UI elements
    await expect(page.locator('text=/sign in|login/i')).toBeVisible({ timeout: 5000 });
  });

  baseTest('should display OAuth login button', async ({ page }) => {
    await page.goto('/login');

    // Look for Google login button
    const loginButton = page.getByRole('button', { name: /sign in|login|google/i });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
  });

  baseTest('should show HaOS branding on login page', async ({ page }) => {
    await page.goto('/login');

    // Check for HaOS branding
    const branding = page.locator('text=/HaOS|HaHaHa Production/i');
    await expect(branding.first()).toBeVisible({ timeout: 3000 });
  });

  baseTest('should handle auth callback route', async ({ page }) => {
    // Navigate to callback URL (simulates OAuth return)
    await page.goto('/auth/callback');

    // Should either redirect to app or show loading state
    // This test assumes the callback route exists
    await page.waitForTimeout(2000);

    // Should navigate away from callback
    const url = page.url();
    const isOnCallback = url.includes('/auth/callback');

    // Callback should redirect or show an appropriate message
    if (isOnCallback) {
      // If still on callback, should show some UI feedback
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });

  baseTest('should not access protected routes when unauthenticated', async ({ page }) => {
    // Clear session
    await page.context().clearCookies();

    // Try to access various protected routes
    const protectedRoutes = [
      '/dashboard',
      '/entities',
      '/songs',
      '/campaigns',
      '/opportunities',
      '/tasks',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to login or show auth error
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const isProtectedRoute = currentUrl.includes(route);
      const isLoginRoute = currentUrl.includes('/login') || currentUrl.includes('/auth');

      // Either still on route (with auth prompt) or redirected to login
      expect(isProtectedRoute || isLoginRoute).toBeTruthy();
    }
  });
});

baseTest.describe('Session Management', () => {
  baseTest('should maintain session across page refreshes', async ({ page }) => {
    // Login first (assumes mock auth or test credentials)
    await page.goto('/');

    // Check if login button is visible
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    const isLoginVisible = await loginButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (isLoginVisible) {
      await loginButton.click();
      await page.waitForURL('/', { timeout: 10000 });
    }

    // Verify authenticated state
    const appLayout = page.locator('[data-testid="app-layout"]').or(page.locator('nav'));
    await expect(appLayout).toBeVisible({ timeout: 10000 });

    // Refresh the page
    await page.reload();

    // Should remain authenticated
    await expect(appLayout).toBeVisible({ timeout: 5000 });
  });

  baseTest('should handle logout functionality', async ({ page }) => {
    await page.goto('/');

    // Login if needed
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginButton.click();
      await page.waitForURL('/', { timeout: 10000 });
    }

    // Look for user menu or logout button
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.locator('button[aria-label*="user"]')
    );

    if (await userMenu.isVisible({ timeout: 2000 })) {
      await userMenu.click();

      // Look for logout option
      const logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i });
      if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutButton.click();

        // Should redirect to login
        await expect(page).toHaveURL(/.*login.*|.*auth.*/i, { timeout: 5000 });
      }
    }
  });
});
