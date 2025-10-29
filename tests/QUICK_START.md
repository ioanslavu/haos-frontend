# Playwright Tests - Quick Start

## First Time Setup

```bash
# Install browsers
npx playwright install
```

## Run Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI (recommended for development)
npm run test:e2e:ui

# Run and see the browser
npm run test:e2e:headed

# Debug mode with inspector
npm run test:e2e:debug
```

## Prerequisites

1. **Backend must be running**:
   ```bash
   cd ../backend
   python manage.py runserver
   ```

2. **Frontend will auto-start** (via Playwright config)

3. **Mock auth enabled** (in `.env`):
   ```
   VITE_ENABLE_MOCK_AUTH=true
   ```

## View Results

```bash
# After tests complete
npx playwright show-report
```

## Run Specific Tests

```bash
# Run only CRM tests
npx playwright test crm-campaigns

# Run specific test
npx playwright test -g "should drag and drop"

# Run in Chrome only
npx playwright test --project=chromium
```

## Test Coverage

✅ Campaign creation with entity selection
✅ Quick-add entities from campaign form
✅ Drag & drop status changes in kanban
✅ Edit and delete campaigns
✅ Filter and search campaigns
✅ Brand analytics
✅ Mobile responsive design
✅ Performance validation

**Total: 33 test cases**

## Documentation

- **Full guide**: `README.md`
- **Test fixtures**: `fixtures.ts`
- **Main tests**: `crm-campaigns.spec.ts`

## Troubleshooting

**Tests failing?**
1. Ensure backend is running on port 8000
2. Check `VITE_ENABLE_MOCK_AUTH=true` in `.env`
3. Run `npx playwright install` if browsers missing

**Need to debug?**
```bash
npm run test:e2e:debug
```

Then click on the test to step through it.
