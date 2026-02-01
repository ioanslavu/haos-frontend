# Direct API Calls Audit (Outside Hooks)

All locations where `apiClient.*` is called directly in pages/components instead of through centralized TanStack Query hooks in `/api/hooks/`.

## Pages

### ContractGeneration.tsx
- **Lines 125, 135, 147, 173, 232, 286** — Direct `apiClient.get()` and `apiClient.post()` for entities, templates, drafts, preview, and generation

### songs/SongWorkCreate.tsx
- **Line 63** — Direct `apiClient.get()` for fetching song data

### songs/SongWorkDetail.tsx
- **Line 43** — Direct `apiClient.get()` for fetching song data

### songs/SongWorkEdit.tsx
- **Line 61** — Direct `apiClient.get()` for fetching song data

### admin/ChecklistTemplateEditor.tsx
- **Lines 78, 87, 97, 110, 116, 134** — Direct API calls for template and item CRUD

### admin/ChecklistTemplatesPage.tsx
- **Lines 103, 116** — Direct API calls for fetching and creating templates

### workboard/components/CreateProjectDialog.tsx
- **Line 64** — Direct `apiClient.get()` for departments

### dashboard/components/TasksList.tsx
- **Line 114** — Direct `apiClient.patch()` for marking notifications as read

### entities/hooks/useEntityDetailState.ts
- **Lines 108, 119, 141, 336, 360, 411** — Direct API calls for templates, drafts, contracts (hook file but contains inline calls instead of using centralized hooks)

## Components — Song Dialogs

### songs/dialogs/EditWorkDialog.tsx
- **Line 69** — Direct `apiClient.patch()`

### songs/dialogs/EditPublicationDialog.tsx
- **Line 113** — Direct `apiClient.patch()`

### songs/dialogs/LinkReleaseDialog.tsx
- **Line 43** — Direct `apiClient.get()`

### songs/dialogs/EditReleaseDialog.tsx
- **Line 116** — Direct `apiClient.patch()`

### songs/dialogs/AddISWCDialog.tsx
- **Line 30** — Direct `apiClient.post()`

### songs/dialogs/AddTemplateDialog.tsx
- **Line 55** — Direct `apiClient.get()`

### songs/dialogs/EditRecordingDialog.tsx
- **Line 104** — Direct `apiClient.patch()`

### songs/dialogs/AddPlatformDialog.tsx
- **Line 101** — Direct `apiClient.post()`

### songs/dialogs/AddArtistDialog.tsx
- **Line 49** — Direct `apiClient.get()`

### songs/dialogs/CreateReleaseDialog.tsx
- **Lines 98, 104** — Direct `apiClient.post()`

### songs/dialogs/AddMasterSplitDialog.tsx
- **Lines 64, 77** — Direct API calls in queryFn and mutation

### songs/dialogs/EditSplitDialog.tsx
- **Lines 52, 89** — Direct `apiClient.patch()` and `apiClient.delete()`

### songs/dialogs/AddISRCDialog.tsx
- **Line 30** — Direct `apiClient.post()`

### songs/dialogs/AudioUploadDialog.tsx
- **Line 93** — Direct `apiClient.post()`

### songs/dialogs/AddCreditDialog.tsx
- **Line 74** — Direct `apiClient.post()`

## Components — Song Tabs/Cards

### songs/tabs/ReleaseTab.tsx
- **Line 44** — Direct `apiClient.get()`

### songs/cards/WorkManagementCard.tsx
- **Line 26** — Direct `apiClient.get()`

### songs/WorkTab/hooks/useWorkTab.ts
- **Line 179** — Direct `apiClient.patch()` (hook file with inline call)

## Components — Other

### tasks/TaskDetailPanel/index.tsx
- **Line 86** — Direct `apiClient.get()`

### layout/ImpersonationBanner.tsx
- **Line 38** — Direct `apiClient.post()` for stopping impersonation

### layout/UserDropdownMenu.tsx
- **Lines 60, 89, 119** — Direct API calls for test users and impersonation

---

## Summary

| Area | File Count | Call Count |
|------|-----------|------------|
| Pages | 8 files | ~18 calls |
| Song Dialogs | 15 files | ~17 calls |
| Song Tabs/Cards | 3 files | ~3 calls |
| Other Components | 3 files | ~5 calls |
| **Total** | **29 files** | **~43 calls** |

## Refactoring Priority

1. **Song dialogs** (15 files) — Highest concentration, clear repeating pattern
2. **Admin pages** (2 files) — Moderate complexity
3. **Song pages** (3 files) — Similar pattern, can share hooks
4. **ContractGeneration** (1 file) — 6 calls, complex but self-contained
5. **Layout/auth components** (2 files) — Specialized, lowest priority
