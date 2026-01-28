# Frontend Cleanup Summary

**Quick Reference** - See `DEAD_CODE_AUDIT.md` for full details.

---

## Impact at a Glance

| What | Count | Bundle Impact |
|------|-------|---------------|
| Unused npm packages | **50+** | **10-20 MB** |
| Unused files to delete | **28** | ~100 KB |
| Unused API hooks | **35+** | ~25 KB |
| Unused CSS | ~100 lines | ~3 KB |

---

## Top 5 Quick Wins

### 1. Remove Monaco Editor (-5-10 MB)
```bash
npm uninstall @monaco-editor/react
```

### 2. Remove Lexical Suite (-2-3 MB)
```bash
npm uninstall @lexical/code @lexical/history @lexical/link @lexical/markdown \
  @lexical/react @lexical/rich-text @lexical/selection @lexical/table \
  @lexical/utils lexical
```

### 3. Remove ReactFlow (-1-2 MB)
```bash
npm uninstall @reactflow/background @reactflow/controls @reactflow/minimap reactflow
```

### 4. Remove Nivo Charts (-500 KB)
```bash
npm uninstall @nivo/bar @nivo/core @nivo/line @nivo/pie @nivo/sankey
```

### 5. Delete Digital Duplicates (-1000 lines)
```bash
rm -rf src/pages/digital/components/
rm src/pages/digital/InsightsPage.tsx
rm src/pages/digital/DistributionDetailPage.tsx
rm src/pages/digital/DistributionFormPage.tsx
rm src/pages/digital/DistributionsPage.tsx
```

---

## Why This Happened

1. **Multiple libraries for same purpose:**
   - Lexical vs Tiptap (rich text)
   - Nivo vs Recharts (charts)
   - React Spring vs Framer Motion (animation)
   - React Big Calendar vs FullCalendar

2. **Refactoring residue:**
   - `/pages/digital/` components moved but originals kept

3. **shadcn/ui over-installation:**
   - Components installed via CLI but never used

4. **Speculative API hooks:**
   - Hooks created for features that were never built

---

## Run Full Cleanup

```bash
cd frontend
./scripts/cleanup-deps.sh   # Remove unused packages
./scripts/cleanup-files.sh  # Delete unused files
npm run build               # Verify nothing broke
```

---

## Files Created

- `docs/DEAD_CODE_AUDIT.md` - Full audit report
- `docs/CLEANUP_SUMMARY.md` - This file
- `scripts/cleanup-deps.sh` - Dependency removal script
- `scripts/cleanup-files.sh` - File deletion script
