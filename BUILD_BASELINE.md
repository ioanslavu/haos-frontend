# Build Time Baseline

**Date:** 2026-01-28
**Commit:** 5c10ba5ce270e96cd5cba45a3de454638caf4b35

## Production Build
- Command: `npm run build`
- Duration: 13.78s
- Bundle Size: 872.22 kB main chunk (266.51 kB gzipped)

## Type Check
- Command: `npx tsc --noEmit`
- Duration: 0.41s

## Target
- Build time increase: <10% (max 15.16s)
- Type check increase: <10% (max 0.45s)

## Notes
- Main chunk (index-DUNwpiVO.js) is 872.22 kB (266.51 kB gzipped)
- Warning: Some chunks larger than 500 kB after minification
- Consider code-splitting with dynamic imports if performance degrades
