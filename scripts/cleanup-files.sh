#!/bin/bash
# Frontend File Cleanup Script
# Generated: 2026-01-28
# See docs/DEAD_CODE_AUDIT.md for details

set -e  # Exit on error

echo "=== Frontend File Cleanup ==="
echo ""

# Ensure we're in frontend directory
if [[ ! -f "package.json" ]]; then
    echo "Error: Run this script from the frontend directory"
    exit 1
fi

echo "Step 1/6: Removing example/demo files..."
rm -f src/components/ui/empty-states-examples.tsx
rm -f src/components/ui/data-table-example.tsx
rm -f src/components/tables/GenericTable.example.tsx
rm -f src/pages/campaigns/components/CampaignFiltersSheet.backup.tsx
echo "  Done"

echo ""
echo "Step 2/6: Removing duplicate digital components..."
rm -rf src/pages/digital/components/
echo "  Done"

echo ""
echo "Step 3/6: Removing unused digital pages..."
rm -f src/pages/digital/InsightsPage.tsx
rm -f src/pages/digital/DistributionDetailPage.tsx
rm -f src/pages/digital/DistributionFormPage.tsx
rm -f src/pages/digital/DistributionsPage.tsx
echo "  Done"

echo ""
echo "Step 4/6: Removing unused UI components..."
rm -f src/components/ui/activity-feed.tsx
rm -f src/components/ui/form-progress.tsx
rm -f src/components/ui/export-dialog.tsx
rm -f src/components/ui/preferences-dialog.tsx
rm -f src/components/ui/aspect-ratio.tsx
rm -f src/components/ui/carousel.tsx
rm -f src/components/ui/context-menu.tsx
rm -f src/components/ui/hover-card.tsx
rm -f src/components/ui/input-otp.tsx
rm -f src/components/ui/menubar.tsx
rm -f src/components/ui/navigation-menu.tsx
rm -f src/components/ui/resizable.tsx
rm -f src/components/ui/toggle-group.tsx
rm -f src/components/ui/toggle.tsx
rm -f src/components/ui/drawer.tsx
rm -rf src/components/ui/shadcn-io/kanban/
echo "  Done"

echo ""
echo "Step 5/6: Removing unused layout/auth components..."
rm -f src/components/layout/RoleImpersonator.tsx
rm -f src/pages/auth/components/AuthError.tsx
rm -f src/pages/campaigns/components/CampaignFiltersPanel.tsx
echo "  Done"

echo ""
echo "Step 6/6: Removing unused services..."
rm -f src/services/csrf.service.ts
rm -f src/stores/index.ts
echo "  Done"

echo ""
echo "=== File Cleanup Complete ==="
echo ""
echo "Deleted approximately 28 files"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run build' to verify nothing broke"
echo "  2. Run 'npx tsc --noEmit' to check for broken imports"
echo "  3. Commit changes: git add -A && git commit -m 'chore: remove unused components and files'"
echo ""
echo "NOTE: Unused API hooks should be removed manually from their source files."
echo "      See docs/DEAD_CODE_AUDIT.md Section 3 for the full list."
