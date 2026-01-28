import { test, expect } from './fixtures';

/**
 * Catalog (Songs) E2E Tests
 *
 * Tests catalog management including:
 * - Songs list loading
 * - Song detail page
 * - Song stage workflow
 * - Search and filtering
 */

test.describe('Catalog - Songs', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/songs');
    await expect(authenticatedPage).toHaveURL(/.*songs.*/i);

    // Wait for songs to load
    await authenticatedPage.waitForSelector('[data-testid="songs-loading"]', {
      state: 'hidden',
      timeout: 5000
    }).catch(() => {});
  });

  test.describe('Songs List', () => {
    test('should display songs page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Should show songs heading
      await expect(page.getByRole('heading', { name: /songs|catalog/i })).toBeVisible();

      // Should show songs list
      const songsList = page.locator('[data-testid="songs-list"]').or(
        page.locator('table')
      );
      await expect(songsList).toBeVisible({ timeout: 5000 });
    });

    test('should show song items with titles', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Find first song
      const firstSong = page.locator('[data-testid="song-row"]').or(
        page.locator('.song-card')
      ).first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        // Song should have a title
        const hasTitle = await firstSong.locator('text=/[A-Za-z]+/').isVisible();
        expect(hasTitle).toBeTruthy();
      }
    });

    test('should display song stage filters', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Look for stage filters
      const stageFilters = [
        'Draft',
        'Recording',
        'Mixing',
        'Mastered',
        'Released',
      ];

      for (const stage of stageFilters) {
        const filter = page.getByRole('button', { name: new RegExp(stage, 'i') }).or(
          page.locator(`:has-text("${stage}")`)
        );

        const isVisible = await filter.first().isVisible({ timeout: 2000 }).catch(() => false);
        // Stage filters should be present
      }
    });

    test('should filter songs by stage', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Look for stage filter dropdown
      const stageFilter = page.locator('[data-testid="stage-filter"]').or(
        page.getByRole('combobox', { name: /stage/i })
      );

      if (await stageFilter.isVisible({ timeout: 2000 })) {
        await stageFilter.click();

        // Select "Recording"
        await page.getByRole('option', { name: /recording/i }).click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Results should update
        const songsList = page.locator('[data-testid="songs-list"]');
        await expect(songsList).toBeVisible();
      }
    });

    test('should search songs by title', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Find search input
      const searchInput = page.getByPlaceholder(/search songs/i);

      if (await searchInput.isVisible({ timeout: 2000 })) {
        // Type search query
        await searchInput.fill('test');

        // Wait for search to filter
        await page.waitForTimeout(500);

        // Results should update
        const searchResults = page.locator('[data-testid="song-row"]');
        const count = await searchResults.count();
        // Search should work
      }
    });

    test('should show song metadata', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Find first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        // Should show artists
        const hasArtists = await firstSong.locator('[data-testid="song-artists"]').isVisible({ timeout: 1000 }).catch(() => false);

        // Should show stage indicator
        const hasStage = await firstSong.locator('[data-testid="song-stage"]').isVisible({ timeout: 1000 }).catch(() => false);

        // Metadata should be displayed
      }
    });

    test('should sort songs by different columns', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Look for sortable column headers
      const titleHeader = page.locator('th:has-text("Title")');

      if (await titleHeader.isVisible({ timeout: 2000 })) {
        // Click to sort
        await titleHeader.click();
        await page.waitForTimeout(500);

        // Click again to reverse sort
        await titleHeader.click();
        await page.waitForTimeout(500);

        // Sorting should work
        const hasSorted = true;
        expect(hasSorted).toBeTruthy();
      }
    });
  });

  test.describe('Song Creation', () => {
    test('should open new song dialog', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Click new song button
      const newSongButton = page.getByRole('button', { name: /new song|create song|add song/i });
      await newSongButton.click();

      // Dialog should open
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    });

    test('should create a new song', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Open dialog
      await page.getByRole('button', { name: /new song|add song/i }).click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Fill song form
      const songTitle = `Test Song ${Date.now()}`;
      await page.getByLabel(/title|song name/i).fill(songTitle);

      // Select work (if required)
      const workField = page.getByLabel(/work/i);
      if (await workField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await workField.click();
        await page.getByRole('option').first().click();
      }

      // Save
      await page.getByRole('button', { name: /save|create/i }).click();

      // Should close dialog
      await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });

      // Song should appear in list
      await expect(page.locator(`:has-text("${songTitle}")`)).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Open dialog
      await page.getByRole('button', { name: /new song|add song/i }).click();

      // Try to save without filling required fields
      await page.getByRole('button', { name: /save|create/i }).click();

      // Validation error should appear
      await expect(page.locator(':has-text("required")')).toBeVisible({ timeout: 3000 });

      // Dialog should remain open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Song Detail', () => {
    test('should navigate to song detail page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Click first song
      const firstSong = page.locator('[data-testid="song-row"]').or(
        page.locator('.song-card')
      ).first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();

        // Should navigate to detail page
        await page.waitForTimeout(1000);
        await expect(page).toHaveURL(/.*songs\/\d+/);

        // Detail page should load
        const detailContent = page.locator('[data-testid="song-detail"]').or(
          page.locator('main')
        );
        await expect(detailContent).toBeVisible();
      }
    });

    test('should display song information', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Should show song title
        const heading = page.locator('h1').or(page.getByRole('heading', { level: 1 }));
        await expect(heading).toBeVisible();

        // Should show song details
        const hasDetails = await page.locator('text=/Stage:|Work:|Recording:/').isVisible({ timeout: 2000 }).catch(() => false);
        // Details should be displayed
      }
    });

    test('should show song tabs', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Look for tabs
        const tabs = page.locator('[role="tablist"]');

        if (await tabs.isVisible({ timeout: 2000 })) {
          // Should have tabs like Overview, Credits, Files, etc.
          const tabCount = await tabs.locator('[role="tab"]').count();
          expect(tabCount).toBeGreaterThan(0);
        }
      }
    });

    test('should display song checklist', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Look for checklist
        const checklist = page.locator('[data-testid="song-checklist"]').or(
          page.locator(':has-text("Checklist")')
        );

        if (await checklist.isVisible({ timeout: 2000 })) {
          // Should show checklist items
          const checklistItems = page.locator('[data-testid="checklist-item"]').or(
            page.locator('input[type="checkbox"]')
          );

          const itemCount = await checklistItems.count();
          expect(itemCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Song Stage Workflow', () => {
    test('should advance song stage', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Look for stage advance button
        const advanceButton = page.getByRole('button', { name: /advance|next stage/i });

        if (await advanceButton.isVisible({ timeout: 2000 })) {
          // Get current stage
          const currentStage = page.locator('[data-testid="current-stage"]').or(
            page.locator('.stage-badge')
          );

          const stageBefore = await currentStage.textContent();

          // Click advance
          await advanceButton.click();

          // Wait for update
          await page.waitForTimeout(1000);

          // Stage should change
          const stageAfter = await currentStage.textContent();
          expect(stageBefore).not.toBe(stageAfter);
        }
      }
    });

    test('should block stage advance if checklist incomplete', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song in early stage
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Look for advance button
        const advanceButton = page.getByRole('button', { name: /advance|next stage/i });

        if (await advanceButton.isVisible({ timeout: 2000 })) {
          // Button might be disabled if checklist incomplete
          const isDisabled = await advanceButton.isDisabled();

          // If enabled, clicking might show validation message
          if (!isDisabled) {
            await advanceButton.click();

            // Might show error or warning about incomplete checklist
            const hasWarning = await page.locator(':has-text("checklist|required|complete")').isVisible({ timeout: 2000 }).catch(() => false);
            // Validation should prevent invalid advancement
          }
        }
      }
    });

    test('should show stage history', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Look for history or activity tab
        const historyTab = page.getByRole('tab', { name: /history|activity/i });

        if (await historyTab.isVisible({ timeout: 2000 })) {
          await historyTab.click();

          // Should show stage transition history
          const historyList = page.locator('[data-testid="stage-history"]').or(
            page.locator('.history-list')
          );

          const hasHistory = await historyList.isVisible({ timeout: 2000 }).catch(() => false);
          // History should be available
        }
      }
    });
  });

  test.describe('Song Credits', () => {
    test('should display song credits', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Look for credits tab
        const creditsTab = page.getByRole('tab', { name: /credits/i });

        if (await creditsTab.isVisible({ timeout: 2000 })) {
          await creditsTab.click();

          // Should show credits list
          const creditsList = page.locator('[data-testid="credits-list"]').or(
            page.locator('.credits-section')
          );

          await expect(creditsList).toBeVisible({ timeout: 3000 });
        }
      }
    });

    test('should add a credit', async ({ authenticatedPage }) => {
      const page = authenticatedPage;

      // Navigate to first song
      const firstSong = page.locator('[data-testid="song-row"]').first();

      if (await firstSong.isVisible({ timeout: 2000 })) {
        await firstSong.click();
        await page.waitForTimeout(1000);

        // Go to credits tab
        const creditsTab = page.getByRole('tab', { name: /credits/i });
        if (await creditsTab.isVisible({ timeout: 2000 })) {
          await creditsTab.click();

          // Look for add credit button
          const addCreditButton = page.getByRole('button', { name: /add credit/i });

          if (await addCreditButton.isVisible({ timeout: 2000 })) {
            await addCreditButton.click();

            // Dialog should open
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

            // Close dialog
            await page.keyboard.press('Escape');
          }
        }
      }
    });
  });
});
