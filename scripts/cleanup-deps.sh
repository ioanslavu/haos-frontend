#!/bin/bash
# Frontend Dependency Cleanup Script
# Generated: 2026-01-28
# See docs/DEAD_CODE_AUDIT.md for details

set -e  # Exit on error

echo "=== Frontend Dependency Cleanup ==="
echo ""

# Ensure we're in frontend directory
if [[ ! -f "package.json" ]]; then
    echo "Error: Run this script from the frontend directory"
    exit 1
fi

echo "Step 1/5: Removing unused rich text editor (Lexical)..."
npm uninstall @lexical/code @lexical/history @lexical/link @lexical/markdown \
  @lexical/react @lexical/rich-text @lexical/selection @lexical/table \
  @lexical/utils lexical 2>/dev/null || echo "  (some packages may not exist)"

echo ""
echo "Step 2/5: Removing unused visualization libraries..."
npm uninstall @monaco-editor/react \
  @reactflow/background @reactflow/controls @reactflow/minimap reactflow \
  @nivo/bar @nivo/core @nivo/line @nivo/pie @nivo/sankey \
  @gitgraph/js @gitgraph/react \
  @react-spring/web \
  react-big-calendar 2>/dev/null || echo "  (some packages may not exist)"

echo ""
echo "Step 3/5: Removing unused utility libraries..."
npm uninstall @loadable/component @react-oauth/google browser-image-compression \
  classnames dinero.js file-saver immer lodash nanoid next-themes \
  papaparse tunnel-rat uuid xlsx 2>/dev/null || echo "  (some packages may not exist)"

echo ""
echo "Step 4/5: Removing unused UI libraries..."
npm uninstall react-diff-viewer-continued react-hot-toast \
  react-intersection-observer react-joyride react-number-format \
  react-select react-window socket.io-client tippy.js \
  @radix-ui/react-navigation-menu @radix-ui/react-menubar \
  @radix-ui/react-hover-card @radix-ui/react-aspect-ratio \
  @radix-ui/react-toggle-group @radix-ui/react-context-menu 2>/dev/null || echo "  (some packages may not exist)"

echo ""
echo "Step 5/5: Fixing playwright location..."
npm uninstall playwright 2>/dev/null || true
npm install -D playwright 2>/dev/null || true

# Remove unused devDependencies
npm uninstall -D msw @vitejs/plugin-react 2>/dev/null || true

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Run 'npm run build' to verify nothing broke"
echo "  2. Run './scripts/cleanup-files.sh' to delete unused files"
echo "  3. Commit changes: git add -A && git commit -m 'chore(deps): remove unused dependencies'"
