# Frontend Dead Code Audit

**Date:** 2026-01-28
**Audited By:** Claude Code (Automated Analysis)
**Codebase:** HaOS Frontend (React 18 + TypeScript)

---

## Executive Summary

| Category | Items Found | Est. Lines | Est. Bundle Savings |
|----------|-------------|------------|---------------------|
| Unused Dependencies | 50+ packages | N/A | **10-20 MB** |
| Unused Components | 18 files | ~3,000 | ~50 KB |
| Unused API Hooks | 35+ hooks | ~1,500 | ~25 KB |
| Duplicate Components | 5 files | ~1,000 | ~15 KB |
| Example/Demo Files | 4 files | ~500 | ~10 KB |
| Unused CSS | ~100 lines | 100 | ~3 KB |
| Debug Console Logs | 143 statements | ~200 | Minimal |
| **TOTAL** | | **~6,300 lines** | **~10-20 MB** |

**Priority:** The unused dependencies (especially Monaco Editor, Lexical, ReactFlow) represent the biggest opportunity - removing them could cut bundle size by 10-20 MB.

---

## 1. UNUSED NPM DEPENDENCIES (CRITICAL)

### 1.1 Rich Text Editors - Lexical Suite (10 packages, ~2-3 MB)

**Status:** Project uses Tiptap instead. Zero imports found for Lexical.

```bash
npm uninstall @lexical/code @lexical/history @lexical/link @lexical/markdown \
  @lexical/react @lexical/rich-text @lexical/selection @lexical/table \
  @lexical/utils lexical
```

### 1.2 Code Editor - Monaco (1 package, ~5-10 MB)

**Status:** Zero imports. Massive bundle impact.

```bash
npm uninstall @monaco-editor/react
```

### 1.3 Flow Diagrams - ReactFlow (4 packages, ~1-2 MB)

**Status:** Zero imports.

```bash
npm uninstall @reactflow/background @reactflow/controls @reactflow/minimap reactflow
```

### 1.4 Charts - Nivo Suite (5 packages, ~500 KB - 1 MB)

**Status:** Project uses Recharts instead. Zero imports.

```bash
npm uninstall @nivo/bar @nivo/core @nivo/line @nivo/pie @nivo/sankey
```

### 1.5 Git Visualization (2 packages)

**Status:** Zero imports.

```bash
npm uninstall @gitgraph/js @gitgraph/react
```

### 1.6 Animation - React Spring (1 package)

**Status:** Project uses Framer Motion instead. Zero imports.

```bash
npm uninstall @react-spring/web
```

### 1.7 Calendar - React Big Calendar (1 package)

**Status:** Project uses FullCalendar instead. Zero imports.

```bash
npm uninstall react-big-calendar
```

### 1.8 Utility Libraries (15+ packages)

| Package | Reason Unused |
|---------|---------------|
| `@loadable/component` | Code splitting not used |
| `@react-oauth/google` | Backend handles OAuth |
| `browser-image-compression` | Never imported |
| `classnames` | Redundant - uses `clsx` instead |
| `dinero.js` | Money as strings, not library |
| `file-saver` | Never imported |
| `immer` | Not needed with Zustand |
| `lodash` | Never imported |
| `nanoid` | Never imported |
| `next-themes` | Never imported |
| `papaparse` | CSV parsing not used |
| `tunnel-rat` | React portals not used |
| `uuid` | Never imported |
| `xlsx` | Excel not used |

```bash
npm uninstall @loadable/component @react-oauth/google browser-image-compression \
  classnames dinero.js file-saver immer lodash nanoid next-themes \
  papaparse tunnel-rat uuid xlsx
```

### 1.9 UI Libraries (10+ packages)

| Package | Reason Unused |
|---------|---------------|
| `react-diff-viewer-continued` | Never imported |
| `react-hot-toast` | Uses Sonner instead |
| `react-intersection-observer` | Never imported |
| `react-joyride` | Product tours not used |
| `react-number-format` | Never imported |
| `react-select` | Uses Radix Select |
| `react-window` | Virtual lists not used |
| `socket.io-client` | WebSocket not used |
| `tippy.js` | Uses Radix Tooltip |

```bash
npm uninstall react-diff-viewer-continued react-hot-toast \
  react-intersection-observer react-joyride react-number-format \
  react-select react-window socket.io-client tippy.js
```

### 1.10 Unused Radix UI Components (6 packages)

These have wrapper components in `src/components/ui/` but the wrappers are never imported:

```bash
npm uninstall @radix-ui/react-navigation-menu @radix-ui/react-menubar \
  @radix-ui/react-hover-card @radix-ui/react-aspect-ratio \
  @radix-ui/react-toggle-group @radix-ui/react-context-menu
```

### 1.11 Misplaced Dependencies

**Move to devDependencies:**
```bash
npm uninstall playwright
npm install -D playwright
```

**Unused devDependencies:**
```bash
npm uninstall -D msw @vitejs/plugin-react
```

### Complete Cleanup Script

```bash
#!/bin/bash
# frontend/scripts/cleanup-dependencies.sh

cd frontend

# Remove unused dependencies (run in order)
npm uninstall \
  @lexical/code @lexical/history @lexical/link @lexical/markdown \
  @lexical/react @lexical/rich-text @lexical/selection @lexical/table \
  @lexical/utils lexical \
  @monaco-editor/react \
  @reactflow/background @reactflow/controls @reactflow/minimap reactflow \
  @nivo/bar @nivo/core @nivo/line @nivo/pie @nivo/sankey \
  @gitgraph/js @gitgraph/react \
  @react-spring/web \
  react-big-calendar \
  @loadable/component @react-oauth/google browser-image-compression \
  classnames dinero.js file-saver immer lodash nanoid next-themes \
  papaparse tunnel-rat uuid xlsx \
  react-diff-viewer-continued react-hot-toast \
  react-intersection-observer react-joyride react-number-format \
  react-select react-window socket.io-client tippy.js \
  @radix-ui/react-navigation-menu @radix-ui/react-menubar \
  @radix-ui/react-hover-card @radix-ui/react-aspect-ratio \
  @radix-ui/react-toggle-group @radix-ui/react-context-menu

# Fix playwright location
npm uninstall playwright
npm install -D playwright

# Remove unused devDependencies
npm uninstall -D msw @vitejs/plugin-react

echo "Cleanup complete. Run 'npm run build' to verify."
```

---

## 2. UNUSED COMPONENTS & FILES

### 2.1 Example/Demo Files (Delete Immediately)

| File | Description |
|------|-------------|
| `src/components/ui/empty-states-examples.tsx` | Demo showcase |
| `src/components/ui/data-table-example.tsx` | Example usage |
| `src/components/tables/GenericTable.example.tsx` | Example usage |
| `src/pages/campaigns/components/CampaignFiltersSheet.backup.tsx` | Backup file |

### 2.2 Unused shadcn/ui Components (Never Imported)

| File | Component |
|------|-----------|
| `src/components/ui/activity-feed.tsx` | ActivityFeed, PresenceIndicator |
| `src/components/ui/form-progress.tsx` | FormProgress |
| `src/components/ui/export-dialog.tsx` | ExportDialog |
| `src/components/ui/preferences-dialog.tsx` | PreferencesDialog |
| `src/components/ui/aspect-ratio.tsx` | AspectRatio |
| `src/components/ui/carousel.tsx` | Carousel |
| `src/components/ui/context-menu.tsx` | ContextMenu |
| `src/components/ui/hover-card.tsx` | HoverCard |
| `src/components/ui/input-otp.tsx` | InputOTP |
| `src/components/ui/menubar.tsx` | Menubar |
| `src/components/ui/navigation-menu.tsx` | NavigationMenu |
| `src/components/ui/resizable.tsx` | Resizable |
| `src/components/ui/toggle-group.tsx` | ToggleGroup |
| `src/components/ui/toggle.tsx` | Toggle |
| `src/components/ui/drawer.tsx` | Drawer |
| `src/components/ui/shadcn-io/kanban/index.tsx` | Duplicate Kanban |

### 2.3 Unused Layout/Auth Components

| File | Component |
|------|-----------|
| `src/components/layout/RoleImpersonator.tsx` | RoleImpersonator |
| `src/pages/auth/components/AuthError.tsx` | Duplicate of `/pages/auth/AuthError.tsx` |

### 2.4 Duplicate Digital Components (Refactoring Residue)

All files in `src/pages/digital/components/` are duplicates:

| File | Duplicate Of |
|------|--------------|
| `EmployeeTaskFilter.tsx` | `src/components/tasks/` |
| `TaskFormDialog.tsx` | `src/components/tasks/` |
| `TaskViewSheet.tsx` | `src/components/tasks/` |
| `AddCatalogItemDialog.tsx` | `src/pages/distributions/` |
| `AddRevenueReportDialog.tsx` | `src/pages/distributions/` |

### 2.5 Unused Digital Pages (Superseded)

| File | Status |
|------|--------|
| `src/pages/digital/InsightsPage.tsx` | Not routed |
| `src/pages/digital/DistributionDetailPage.tsx` | Superseded by distributions/ |
| `src/pages/digital/DistributionFormPage.tsx` | Superseded by distributions/ |
| `src/pages/digital/DistributionsPage.tsx` | Superseded by distributions/ |
| `src/pages/campaigns/components/CampaignFiltersPanel.tsx` | Never imported |

---

## 3. UNUSED API HOOKS

### 3.1 Distribution Hooks (`src/api/hooks/useDistributions.ts`)

- `useCatalogItem` (singular)
- `useUpdateCatalogItem`
- `useDeleteRevenueReport`
- `useDistributionAssignments`
- `useUploadDistributionInvoice`

### 3.2 Activity Hooks (`src/api/hooks/useActivity.ts`)

- `useLogQuickNote`

### 3.3 Campaign Hooks (`src/api/hooks/useCampaigns.ts`)

- `useCampaignMetric` (singular)
- `useBulkImportMetrics`
- `useCalculateKPIProgress`
- `useValidateForContract`
- `useCampaignFinancialsByPlatform`
- `useTopCampaignsByBudget`
- `usePlatformPerformance`
- `useAddArtistsToSubCampaign`

### 3.4 Invoice Hooks (`src/api/hooks/useInvoices.ts`)

- `useDeleteInvoice`

### 3.5 Task Hooks (`src/api/hooks/useTasks.ts`)

- `useCreateSubtask`

### 3.6 Entity Hooks (`src/api/hooks/useEntities.ts`)

- `useEntityLatestShares`
- `useRevealCNP`
- `useContactPerson` (singular)
- `useMyEntityRequests`

### 3.7 Trigger Hooks (`src/api/hooks/useTriggers.ts`)

- `useFlowTrigger` (singular)
- `useSongTriggers`
- `useDeliverableTriggers`

### 3.8 Opportunity Hooks (`src/api/hooks/useOpportunities.ts`)

- `useBulkUpdateOpportunities`
- `useOpportunityComments`
- `useAddComment`
- `useCompleteTask`
- `useApproval` (singular)

### 3.9 Digital Financial Hooks

- `useRevenueByClient`

### 3.10 Notes Hooks (`src/api/hooks/useNotes.ts`)

- `useSearchNotes`
- `useTagSuggestions`

### 3.11 Client Profile Hooks

- `useClientProfileHistory`

### 3.12 Rights Hooks (`src/api/hooks/useRights.ts`)

- `useWriterCredits`
- `usePerformerCredits`
- `useSplitStats`
- `useAutoCalculateSplits`
- `useLockSplit`
- `useUnlockSplit`
- `useLockAllSplits`

### 3.13 Assignment Hooks

- `useArtistAssignments`

### 3.14 Custom Fields Hooks

- `useReorderProjectCustomFieldDefinitions`

### 3.15 Contract Hooks

- `useCreateAnnex`

### 3.16 Permission Hooks (`src/hooks/usePermissions.ts`)

- `useBatchPermissionCheck`
- `useAllPermissions`
- `usePermissionCheck`

---

## 4. UNUSED SERVICES

| File | Export |
|------|--------|
| `src/services/csrf.service.ts` | `csrfService` - Never imported |
| `src/stores/index.ts` | Barrel export never used (direct imports) |

---

## 5. UNUSED CSS & STYLES

### 5.1 Unused Custom Classes (`src/index.css`)

| Class | Lines | Description |
|-------|-------|-------------|
| `hover-scale` | 232-237 | Scale on hover |
| `hover-glow` | 240-246 | Glow effect |
| `ai-glow` | 249-255 | AI feature glow |
| `transition-fast` | 263-265 | Fast transition |
| `glass` | 268-272 | Glass morphism |
| `bento-grid` | 275-279 | Dashboard grid |
| `slide-up` | 287-289 | Slide animation |
| `pulse-soft` | 292-294 | Soft pulse |
| `touch-target` | 297-303 | Touch targets |
| `mobile-stack-table` | 320-347 | Responsive table |

### 5.2 Unused Keyframes (`src/index.css`)

| Keyframe | Lines |
|----------|-------|
| `@keyframes fadeIn` | 351-358 |
| `@keyframes pulseSoft` | 371-378 |

### 5.3 Unused Tailwind Keyframes (`tailwind.config.ts`)

| Keyframe | Description |
|----------|-------------|
| `spin-3d` | 3D rotation |
| `float-wave` | Wave movement |
| `pulse-neon` | Neon pulsing |
| `particle-float` | Floating particles |
| `vinyl-wobble` | Vinyl wobble |
| `slide-up-fade` | Slide with fade |

### 5.4 Unused CSS Variables

```css
/* Lines 68-73 - Fluid spacing variables */
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg
--spacing-xl
--spacing-2xl
```

---

## 6. DEBUG CONSOLE STATEMENTS

### 6.1 Files with Debug Logging (Remove)

| File | Lines | Count |
|------|-------|-------|
| `pages/TaskManagement.tsx` | 420-430 | 4 |
| `components/tasks/InlineAssigneeSelect.tsx` | 43-48 | 5 |
| `pages/admin/ChecklistTemplatesPage.tsx` | 285 | 1 |
| `pages/NotFound.tsx` | 8 | 1 |
| `components/tables/GenericTable.example.tsx` | Multiple | 4 |

### 6.2 WebSocket Logging (Consider Wrapping)

| File | Count | Recommendation |
|------|-------|----------------|
| `services/websocket.ts` | 13 | Wrap in `process.env.NODE_ENV === 'development'` |
| `stores/notificationStore.ts` | 3 | Same |

### 6.3 Error Handlers (Keep)

The 121 `console.error` statements in catch blocks are **appropriate** and should be kept for production debugging.

---

## 7. CLEANUP PRIORITY ORDER

### Phase 1: Dependencies (Highest Impact)

```bash
# Run the cleanup script from section 1.11
./scripts/cleanup-dependencies.sh
npm run build  # Verify no breaks
```

**Expected Impact:** 10-20 MB bundle size reduction

### Phase 2: Delete Unused Files (Quick Wins)

```bash
# Example/backup files
rm src/components/ui/empty-states-examples.tsx
rm src/components/ui/data-table-example.tsx
rm src/components/tables/GenericTable.example.tsx
rm src/pages/campaigns/components/CampaignFiltersSheet.backup.tsx

# Duplicate digital components (entire folder)
rm -rf src/pages/digital/components/

# Unused digital pages
rm src/pages/digital/InsightsPage.tsx
rm src/pages/digital/DistributionDetailPage.tsx
rm src/pages/digital/DistributionFormPage.tsx
rm src/pages/digital/DistributionsPage.tsx

# Duplicate auth component
rm src/pages/auth/components/AuthError.tsx

# Unused campaign component
rm src/pages/campaigns/components/CampaignFiltersPanel.tsx
```

### Phase 3: Unused UI Components

```bash
# Delete unused shadcn/ui wrappers
rm src/components/ui/activity-feed.tsx
rm src/components/ui/form-progress.tsx
rm src/components/ui/export-dialog.tsx
rm src/components/ui/preferences-dialog.tsx
rm src/components/ui/aspect-ratio.tsx
rm src/components/ui/carousel.tsx
rm src/components/ui/context-menu.tsx
rm src/components/ui/hover-card.tsx
rm src/components/ui/input-otp.tsx
rm src/components/ui/menubar.tsx
rm src/components/ui/navigation-menu.tsx
rm src/components/ui/resizable.tsx
rm src/components/ui/toggle-group.tsx
rm src/components/ui/toggle.tsx
rm src/components/ui/drawer.tsx
rm -rf src/components/ui/shadcn-io/kanban/

# Unused layout component
rm src/components/layout/RoleImpersonator.tsx
```

### Phase 4: Remove Unused API Hooks

Edit each hook file and remove the unused exports listed in Section 3.

### Phase 5: Clean CSS

Edit `src/index.css` and remove:
- Lines 232-347 (unused utility classes)
- Lines 351-378 (unused keyframes)
- Lines 68-73 (unused CSS variables)

Edit `tailwind.config.ts` and remove unused keyframes.

### Phase 6: Remove Console Statements

Search and remove debug `console.log` statements from files in Section 6.1.

---

## 8. VERIFICATION COMMANDS

After each cleanup phase:

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Run existing tests
npm run test:e2e

# Check for broken imports
npm run lint
```

---

## 9. PREVENTION RECOMMENDATIONS

1. **Add ESLint rule for unused exports:**
   ```json
   {
     "rules": {
       "import/no-unused-modules": ["error", {"unusedExports": true}]
     }
   }
   ```

2. **Add depcheck to CI:**
   ```bash
   npx depcheck --ignores="@types/*"
   ```

3. **Review dependencies before installing:**
   - Check if functionality already exists in current deps
   - Prefer smaller, focused packages

4. **Delete backup files immediately:**
   - Use git for version history, not `.backup` files

5. **Remove shadcn components if unused after 1 month:**
   - Only install what you need

---

## Appendix: Full File List for Deletion

```
# Example/Demo files
src/components/ui/empty-states-examples.tsx
src/components/ui/data-table-example.tsx
src/components/tables/GenericTable.example.tsx
src/pages/campaigns/components/CampaignFiltersSheet.backup.tsx

# Duplicate digital folder
src/pages/digital/components/EmployeeTaskFilter.tsx
src/pages/digital/components/TaskFormDialog.tsx
src/pages/digital/components/TaskViewSheet.tsx
src/pages/digital/components/AddCatalogItemDialog.tsx
src/pages/digital/components/AddRevenueReportDialog.tsx

# Unused digital pages
src/pages/digital/InsightsPage.tsx
src/pages/digital/DistributionDetailPage.tsx
src/pages/digital/DistributionFormPage.tsx
src/pages/digital/DistributionsPage.tsx

# Unused UI components
src/components/ui/activity-feed.tsx
src/components/ui/form-progress.tsx
src/components/ui/export-dialog.tsx
src/components/ui/preferences-dialog.tsx
src/components/ui/aspect-ratio.tsx
src/components/ui/carousel.tsx
src/components/ui/context-menu.tsx
src/components/ui/hover-card.tsx
src/components/ui/input-otp.tsx
src/components/ui/menubar.tsx
src/components/ui/navigation-menu.tsx
src/components/ui/resizable.tsx
src/components/ui/toggle-group.tsx
src/components/ui/toggle.tsx
src/components/ui/drawer.tsx
src/components/ui/shadcn-io/kanban/index.tsx

# Unused layout/auth
src/components/layout/RoleImpersonator.tsx
src/pages/auth/components/AuthError.tsx
src/pages/campaigns/components/CampaignFiltersPanel.tsx

# Unused services
src/services/csrf.service.ts
src/stores/index.ts
```

**Total files to delete:** 28 files
