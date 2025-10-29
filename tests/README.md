# E2E Testing with Playwright

This directory contains end-to-end tests for the HaOS application, with comprehensive coverage of the CRM campaigns feature.

## Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   npx playwright install
   ```

2. **Backend server must be running**:
   ```bash
   cd ../backend
   python manage.py runserver
   ```

3. **Test data setup**:
   - Ensure you have test entities (clients, artists, brands) in your database
   - For automated testing, consider creating a test database with seed data
   - Enable mock authentication in development:
     ```bash
     # In frontend/.env
     VITE_ENABLE_MOCK_AUTH=true
     ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run specific test file
```bash
npx playwright test tests/crm-campaigns.spec.ts
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests in UI mode (interactive)
```bash
npx playwright test --ui
```

### Run specific test by name
```bash
npx playwright test -g "should create a new campaign"
```

## Test Structure

### `fixtures.ts`
Common test utilities and helpers:
- **Authentication**: `authenticatedPage` fixture handles login automatically
- **Navigation**: `navigateToCRM()`, `switchToTab()`
- **Campaign operations**: `openNewCampaignDialog()`, `fillCampaignForm()`, `saveCampaignForm()`
- **Drag & drop**: `dragCampaignToStatus()`, `verifyCampaignInStatus()`
- **Entity management**: `selectEntity()`, `quickAddEntity()`
- **View switching**: `switchCampaignView()`

### `crm-campaigns.spec.ts`
Comprehensive test suite covering:

#### 1. Campaign Creation
- ✅ Create campaign with existing entities
- ✅ Create campaign with quick-add entity
- ✅ Validate required fields
- ✅ Auto-set confirmed_at for confirmed status

#### 2. Kanban View
- ✅ Display all status columns
- ✅ Show campaign count and total value per column
- ✅ Drag and drop to change status
- ✅ Hover effects on cards
- ✅ Drag overlay during drag operations

#### 3. Table View
- ✅ Switch to table view
- ✅ Display campaigns in table format
- ✅ Sort campaigns by columns

#### 4. Filtering and Search
- ✅ Filter by status
- ✅ Search by campaign name
- ✅ Search by client name
- ✅ Clear filters

#### 5. CRUD Operations
- ✅ Edit existing campaign
- ✅ Delete campaign with confirmation
- ✅ Cancel deletion

#### 6. Brand Analytics
- ✅ Navigate to brand analytics
- ✅ Display brand campaign statistics
- ✅ Show artist usage

#### 7. Campaign Stats Dashboard
- ✅ Display total campaign count
- ✅ Display total value
- ✅ Display status breakdown

#### 8. Responsive Design
- ✅ Mobile viewport support
- ✅ Sidebar toggle on mobile

#### 9. Performance
- ✅ Load campaigns within reasonable time
- ✅ Handle large datasets efficiently

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Reports include:
- Test results (pass/fail)
- Screenshots of failures
- Videos of failed tests
- Execution traces

## Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL**: `http://localhost:8080` (Vite dev server)
- **Test directory**: `./tests`
- **Browsers**: Chrome, Firefox, Safari
- **Retries**: 2 on CI, 0 locally
- **Timeout**: 30s per test (default)
- **Auto-start dev server**: Enabled

## Writing New Tests

### Basic test structure
```typescript
import { test, expect } from './fixtures';
import { navigateToCRM } from './fixtures';

test.describe('My Feature', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await navigateToCRM(authenticatedPage);
  });

  test('should do something', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Your test code here
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Using custom fixtures
```typescript
test('should create campaign', async ({ authenticatedPage }) => {
  const page = authenticatedPage;

  // Use helper functions
  await openNewCampaignDialog(page);
  await fillCampaignForm(page, {
    campaignName: 'Test Campaign',
    value: '50000',
  });
  await saveCampaignForm(page);

  // Verify
  await expect(page.locator(':has-text("Test Campaign")')).toBeVisible();
});
```

## Best Practices

1. **Use semantic selectors**: Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
2. **Add data-testid attributes**: For elements that are hard to select semantically
3. **Clean up test data**: Delete created entities after tests
4. **Use auto-waiting**: Playwright automatically waits for elements
5. **Avoid fixed waits**: Use `waitForSelector()` instead of `waitForTimeout()`
6. **Test user flows**: Test complete workflows, not just individual actions
7. **Handle async operations**: Always await API calls and state changes

## Debugging Tests

### Visual debugging
```bash
npx playwright test --headed --debug
```

### Pause execution
```typescript
test('my test', async ({ page }) => {
  await page.pause(); // Opens Playwright Inspector
  // ... rest of test
});
```

### Screenshots
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### Console logs
```typescript
page.on('console', msg => console.log(msg.text()));
```

### Network logs
```typescript
page.on('request', request => console.log('>>', request.method(), request.url()));
page.on('response', response => console.log('<<', response.status(), response.url()));
```

## CI/CD Integration

Tests are configured to run on CI with:
- Retry on failure (2 retries)
- Single worker (no parallelization)
- HTML reporter for artifacts

### GitHub Actions example
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if backend server is running
- Verify network requests aren't blocked

### Authentication failures
- Ensure mock auth is enabled in `.env`
- Check if session cookies are being set
- Verify `/api/v1/users/me/` endpoint works

### Flaky tests
- Add explicit waits for async operations
- Use `waitForLoadState('networkidle')`
- Retry failed tests to identify flakiness

### Element not found
- Add `data-testid` attributes
- Use Playwright Inspector to find correct selectors
- Check if element is in shadow DOM

## Performance Testing

### Measure page load time
```typescript
test('should load quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/crm');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000);
});
```

### Monitor network requests
```typescript
const responses: any[] = [];
page.on('response', response => responses.push(response));

// Run test...

// Check API performance
const apiCalls = responses.filter(r => r.url().includes('/api/'));
expect(apiCalls.length).toBeLessThan(10); // Avoid too many requests
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
