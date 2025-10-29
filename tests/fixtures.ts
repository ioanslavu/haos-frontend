import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Test fixtures and utilities for CRM E2E tests
 */

export interface AuthUser {
  email: string;
  name: string;
  id: number;
}

// Extend base test with custom fixtures
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/');

    // Check if already authenticated
    const isAuthenticated = await page.locator('[data-testid="app-layout"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (!isAuthenticated) {
      // If not authenticated, handle login
      // NOTE: This assumes mock auth is enabled in dev mode
      // For real auth, you'd need to handle OAuth flow or use a test account
      const loginButton = page.getByRole('button', { name: /login|sign in/i });
      if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await loginButton.click();
        await page.waitForURL('/', { timeout: 10000 });
      }
    }

    // Verify we're authenticated by checking for app layout
    await expect(page.locator('[data-testid="app-layout"]').or(page.locator('nav'))).toBeVisible({ timeout: 10000 });

    await use(page);
  },
});

export { expect };

/**
 * Helper to navigate to CRM page
 */
export async function navigateToCRM(page: Page) {
  await page.goto('/crm');
  await expect(page).toHaveURL('/crm');
  await expect(page.getByRole('heading', { name: 'CRM' })).toBeVisible();
}

/**
 * Helper to wait for campaigns to load
 */
export async function waitForCampaignsLoaded(page: Page) {
  // Wait for loading spinner to disappear
  await page.waitForSelector('[data-testid="campaigns-loading"]', { state: 'hidden', timeout: 5000 }).catch(() => {});

  // Alternative: wait for kanban or table to be visible
  await page.waitForSelector('[data-testid="campaign-kanban"], [data-testid="campaign-table"]', { timeout: 5000 }).catch(() => {});
}

/**
 * Helper to switch campaign view mode
 */
export async function switchCampaignView(page: Page, mode: 'kanban' | 'table') {
  const button = mode === 'kanban'
    ? page.getByRole('button', { name: /kanban view/i }).or(page.locator('button[aria-label*="kanban"]'))
    : page.getByRole('button', { name: /table view/i }).or(page.locator('button[aria-label*="table"]'));

  await button.click();

  // Wait for view to change
  if (mode === 'kanban') {
    await expect(page.locator('[data-testid="campaign-kanban"]').or(page.locator('.kanban'))).toBeVisible({ timeout: 3000 });
  } else {
    await expect(page.locator('[data-testid="campaign-table"]').or(page.locator('table'))).toBeVisible({ timeout: 3000 });
  }
}

/**
 * Helper to open new campaign dialog
 */
export async function openNewCampaignDialog(page: Page) {
  const newCampaignButton = page.getByRole('button', { name: /new campaign|create campaign|add campaign/i });
  await newCampaignButton.click();

  // Wait for dialog to open
  await expect(page.locator('[role="dialog"]').or(page.locator('.dialog'))).toBeVisible({ timeout: 3000 });
}

/**
 * Helper to fill campaign form
 */
export async function fillCampaignForm(page: Page, data: {
  campaignName: string;
  client?: string;
  artist?: string;
  brand?: string;
  value: string;
  status?: string;
}) {
  // Fill campaign name
  const nameInput = page.locator('input[name="campaign_name"]').or(page.getByLabel(/campaign name/i));
  await nameInput.fill(data.campaignName);

  // Fill value
  const valueInput = page.locator('input[name="value"]').or(page.getByLabel(/value|amount/i));
  await valueInput.fill(data.value);

  // Select client if provided
  if (data.client) {
    await selectEntity(page, 'client', data.client);
  }

  // Select artist if provided
  if (data.artist) {
    await selectEntity(page, 'artist', data.artist);
  }

  // Select brand if provided
  if (data.brand) {
    await selectEntity(page, 'brand', data.brand);
  }

  // Select status if provided
  if (data.status) {
    const statusSelect = page.locator('select[name="status"]').or(page.getByLabel(/status/i));
    await statusSelect.click();
    await page.getByRole('option', { name: new RegExp(data.status, 'i') }).click();
  }
}

/**
 * Helper to select an entity in a combobox/search field
 */
export async function selectEntity(page: Page, entityType: 'client' | 'artist' | 'brand', searchTerm: string) {
  // Look for the entity search combobox
  const combobox = page.getByLabel(new RegExp(entityType, 'i')).or(
    page.locator(`[data-testid="${entityType}-search"]`)
  );

  // Click to open dropdown
  await combobox.click();

  // Type search term
  await combobox.fill(searchTerm);

  // Wait for results
  await page.waitForTimeout(500);

  // Select first result
  await page.getByRole('option', { name: new RegExp(searchTerm, 'i') }).first().click();
}

/**
 * Helper to quick-add a new entity
 */
export async function quickAddEntity(page: Page, entityType: 'client' | 'artist' | 'brand', data: {
  displayName: string;
  kind: 'PF' | 'PJ';
  email?: string;
}) {
  // Click the quick-add button
  const quickAddButton = page.locator(`button:has-text("Add ${entityType}")`).or(
    page.locator(`[data-testid="quick-add-${entityType}"]`)
  );
  await quickAddButton.click();

  // Wait for entity form dialog
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

  // Fill entity form
  await page.getByLabel(/display name/i).fill(data.displayName);

  // Select kind
  const kindSelect = page.getByLabel(/kind|type/i);
  await kindSelect.click();
  await page.getByRole('option', { name: data.kind }).click();

  // Fill email if provided
  if (data.email) {
    await page.getByLabel(/email/i).fill(data.email);
  }

  // Submit
  await page.getByRole('button', { name: /save|create|add/i }).click();

  // Wait for success
  await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });
}

/**
 * Helper to save campaign form
 */
export async function saveCampaignForm(page: Page) {
  const saveButton = page.getByRole('button', { name: /save|create|add/i }).last();
  await saveButton.click();

  // Wait for dialog to close
  await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });
}

/**
 * Helper to drag a campaign card to a new status column
 */
export async function dragCampaignToStatus(page: Page, campaignName: string, targetStatus: string) {
  // Find the campaign card
  const card = page.locator(`[data-campaign-name="${campaignName}"]`).or(
    page.locator(`.campaign-card:has-text("${campaignName}")`)
  ).first();

  await expect(card).toBeVisible({ timeout: 5000 });

  // Find the target column
  const targetColumn = page.locator(`[data-status="${targetStatus}"]`).or(
    page.locator(`.kanban-column:has-text("${targetStatus}")`)
  ).first();

  await expect(targetColumn).toBeVisible({ timeout: 5000 });

  // Get bounding boxes
  const cardBox = await card.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  if (!cardBox || !targetBox) {
    throw new Error('Could not get bounding boxes for drag operation');
  }

  // Perform drag and drop
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
  await page.waitForTimeout(500);
  await page.mouse.up();

  // Wait for animation
  await page.waitForTimeout(500);
}

/**
 * Helper to verify campaign appears in status column
 */
export async function verifyCampaignInStatus(page: Page, campaignName: string, status: string) {
  const column = page.locator(`[data-status="${status}"]`).or(
    page.locator(`.kanban-column:has-text("${status}")`)
  ).first();

  const campaignInColumn = column.locator(`:has-text("${campaignName}")`).first();
  await expect(campaignInColumn).toBeVisible({ timeout: 5000 });
}

/**
 * Helper to delete a campaign
 */
export async function deleteCampaign(page: Page, campaignName: string) {
  // Find the campaign card
  const card = page.locator(`:has-text("${campaignName}")`).first();

  // Hover to show menu
  await card.hover();

  // Click menu button
  const menuButton = card.locator('button[aria-label*="menu"]').or(card.locator('button:has-text("⋮")')).first();
  await menuButton.click();

  // Click delete option
  await page.getByRole('menuitem', { name: /delete/i }).click();

  // Confirm deletion
  await page.getByRole('button', { name: /delete|confirm/i }).last().click();

  // Wait for deletion
  await expect(card).toBeHidden({ timeout: 5000 });
}

/**
 * Helper to switch to a specific tab
 */
export async function switchToTab(page: Page, tabName: 'clients' | 'campaigns' | 'brands') {
  const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') });
  await tab.click();

  // Wait for tab content to load
  await page.waitForTimeout(500);
}
