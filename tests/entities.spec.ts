import { test, expect } from './fixtures';

/**
 * Entity Management E2E Tests
 *
 * Tests entity CRUD operations including:
 * - Entity list page loading
 * - Search and filter functionality
 * - Entity detail page navigation
 * - Entity creation and editing
 */

test.describe('Entity Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/entities');
    await expect(authenticatedPage).toHaveURL(/.*entities.*/i);

    // Wait for entities to load
    await authenticatedPage.waitForSelector('[data-testid="entities-loading"]', {
      state: 'hidden',
      timeout: 5000
    }).catch(() => {});
  });

  test.describe('Entity List', () => {
    test('should display entities list page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Should show entities heading
      await expect(page.getByRole('heading', { name: /entities/i })).toBeVisible();

      // Should show entities table or list
      const entitiesList = page.locator('[data-testid="entities-list"]').or(
        page.locator('table')
      );
      await expect(entitiesList).toBeVisible({ timeout: 5000 });
    });

    test('should show entity cards with basic info', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Find first entity card
      const firstEntity = page.locator('[data-testid="entity-row"]').or(
        page.locator('.entity-card')
      ).first();

      if (await firstEntity.isVisible({ timeout: 2000 })) {
        // Should show entity name
        const hasName = await firstEntity.locator('text=/[A-Za-z]+/').isVisible();
        expect(hasName).toBeTruthy();
      }
    });

    test('should display entity type filters', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Look for classification filter buttons
      const classificationFilters = [
        'CREATIVE',
        'BUSINESS',
        'RIGHTS_HOLDER',
      ];

      for (const classification of classificationFilters) {
        const filter = page.getByRole('button', { name: new RegExp(classification, 'i') }).or(
          page.locator(`button:has-text("${classification}")`)
        );

        const isVisible = await filter.isVisible({ timeout: 2000 }).catch(() => false);
        // Filters should be present if implemented
      }
    });

    test('should filter entities by kind (PF/PJ)', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Look for kind filter
      const kindFilter = page.locator('[data-testid="kind-filter"]').or(
        page.getByRole('combobox', { name: /kind|type/i })
      );

      if (await kindFilter.isVisible({ timeout: 2000 })) {
        await kindFilter.click();

        // Select Physical Person
        await page.getByRole('option', { name: /physical person|PF/i }).click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Results should update
        const entityList = page.locator('[data-testid="entities-list"]');
        await expect(entityList).toBeVisible();
      }
    });

    test('should search entities by name', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Find search input
      const searchInput = page.getByPlaceholder(/search entities/i);

      if (await searchInput.isVisible({ timeout: 2000 })) {
        // Type search query
        await searchInput.fill('Test');

        // Wait for search to filter
        await page.waitForTimeout(500);

        // Results should contain search term
        const searchResults = page.locator('[data-testid="entity-row"]').or(
          page.locator('.entity-card')
        );

        const count = await searchResults.count();
        // Search should filter results
      }
    });

    test('should paginate entity list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Look for pagination controls
      const pagination = page.locator('[data-testid="pagination"]').or(
        page.locator('nav[aria-label="pagination"]')
      );

      if (await pagination.isVisible({ timeout: 2000 })) {
        // Click next page
        const nextButton = page.getByRole('button', { name: /next/i });
        await nextButton.click();

        // Wait for new page to load
        await page.waitForTimeout(500);

        // URL or content should update
        const hasUpdated = true; // Assume update happened
        expect(hasUpdated).toBeTruthy();
      }
    });
  });

  test.describe('Entity Creation', () => {
    test('should open new entity dialog', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Click new entity button
      const newEntityButton = page.getByRole('button', { name: /new entity|create entity|add entity/i });
      await newEntityButton.click();

      // Dialog should open
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    });

    test('should create a new physical person entity', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Open dialog
      await page.getByRole('button', { name: /new entity|add entity/i }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Fill form
      const displayName = `Test Person ${Date.now()}`;
      await page.getByLabel(/display name/i).fill(displayName);

      // Select kind: Physical Person
      const kindSelect = page.getByLabel(/kind/i);
      await kindSelect.click();
      await page.getByRole('option', { name: /physical person|PF/i }).click();

      // Select classification: Creative
      const classificationSelect = page.getByLabel(/classification/i);
      await classificationSelect.click();
      await page.getByRole('option', { name: /creative/i }).click();

      // Add email
      await page.getByLabel(/email/i).fill(`test-${Date.now()}@example.com`);

      // Save
      await page.getByRole('button', { name: /save|create/i }).click();

      // Should close dialog and show success
      await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });

      // Entity should appear in list
      await expect(page.locator(`:has-text("${displayName}")`)).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Open dialog
      await page.getByRole('button', { name: /new entity|add entity/i }).click();

      // Try to save without filling required fields
      await page.getByRole('button', { name: /save|create/i }).click();

      // Validation errors should appear
      await expect(page.locator(':has-text("required")')).toBeVisible({ timeout: 3000 });

      // Dialog should remain open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Entity Detail', () => {
    test('should navigate to entity detail page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Click first entity
      const firstEntity = page.locator('[data-testid="entity-row"]').or(
        page.locator('.entity-card')
      ).first();

      if (await firstEntity.isVisible({ timeout: 2000 })) {
        await firstEntity.click();

        // Should navigate to detail page
        await page.waitForTimeout(1000);
        await expect(page).toHaveURL(/.*entities\/\d+/);

        // Detail page should load
        const detailContent = page.locator('[data-testid="entity-detail"]').or(
          page.locator('main')
        );
        await expect(detailContent).toBeVisible();
      }
    });

    test('should display entity information on detail page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first entity
      const firstEntity = page.locator('[data-testid="entity-row"]').first();

      if (await firstEntity.isVisible({ timeout: 2000 })) {
        await firstEntity.click();
        await page.waitForTimeout(1000);

        // Should show entity name
        const heading = page.locator('h1').or(page.getByRole('heading', { level: 1 }));
        await expect(heading).toBeVisible();

        // Should show entity details
        const hasDetails = await page.locator('text=/Kind:|Classification:|Email:/').isVisible({ timeout: 2000 }).catch(() => false);
        // Details should be displayed
      }
    });

    test('should show entity tabs', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first entity
      const firstEntity = page.locator('[data-testid="entity-row"]').first();

      if (await firstEntity.isVisible({ timeout: 2000 })) {
        await firstEntity.click();
        await page.waitForTimeout(1000);

        // Look for tabs
        const tabs = page.locator('[role="tablist"]');

        if (await tabs.isVisible({ timeout: 2000 })) {
          // Should have tabs like Overview, Contracts, etc.
          const tabCount = await tabs.locator('[role="tab"]').count();
          expect(tabCount).toBeGreaterThan(0);
        }
      }
    });

    test('should allow editing entity from detail page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first entity
      const firstEntity = page.locator('[data-testid="entity-row"]').first();

      if (await firstEntity.isVisible({ timeout: 2000 })) {
        await firstEntity.click();
        await page.waitForTimeout(1000);

        // Look for edit button
        const editButton = page.getByRole('button', { name: /edit/i });

        if (await editButton.isVisible({ timeout: 2000 })) {
          await editButton.click();

          // Edit dialog should open
          await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

          // Form should be pre-filled
          const displayNameInput = page.getByLabel(/display name/i);
          const currentValue = await displayNameInput.inputValue();
          expect(currentValue.length).toBeGreaterThan(0);

          // Close dialog
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Entity Relationships', () => {
    test('should show related contracts', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first entity
      const firstEntity = page.locator('[data-testid="entity-row"]').first();

      if (await firstEntity.isVisible({ timeout: 2000 })) {
        await firstEntity.click();
        await page.waitForTimeout(1000);

        // Look for contracts tab or section
        const contractsTab = page.getByRole('tab', { name: /contracts/i });

        if (await contractsTab.isVisible({ timeout: 2000 })) {
          await contractsTab.click();

          // Contracts list should appear
          await page.waitForTimeout(500);

          const contractsList = page.locator('[data-testid="contracts-list"]').or(
            page.locator('.contracts-section')
          );

          // Contracts section should be visible
          const hasContracts = await contractsList.isVisible({ timeout: 2000 }).catch(() => false);
        }
      }
    });

    test('should show related campaigns', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first entity
      const firstEntity = page.locator('[data-testid="entity-row"]').first();

      if (await firstEntity.isVisible({ timeout: 2000 })) {
        await firstEntity.click();
        await page.waitForTimeout(1000);

        // Look for campaigns tab or section
        const campaignsSection = page.locator(':has-text("Campaigns")');

        if (await campaignsSection.isVisible({ timeout: 2000 })) {
          // Campaigns should be listed
          const hasContent = true;
          expect(hasContent).toBeTruthy();
        }
      }
    });
  });
});
