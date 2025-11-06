# Assets Tab Integration Guide

## Overview
The new AssetsTab component provides a complete asset management solution with enhanced features:

- Visual grid/list view toggle
- Asset type and review status filtering
- Bulk approve and download actions
- Asset requirements checklist
- Image previews with Google Drive thumbnails
- Review workflow with dialog
- Edit and delete functionality

## Integration Steps

### 1. Update imports in SongDetailPage.tsx

Replace the old AssetCard and UploadAssetDialog imports:

```typescript
// OLD
import { AssetCard } from '@/components/songs/AssetCard';
import { UploadAssetDialog } from '@/components/songs/UploadAssetDialog';

// NEW
import { AssetsTab } from '@/components/songs/AssetsTab';
```

### 2. Remove unused state variables

Remove:
```typescript
const [showUploadAssetDialog, setShowUploadAssetDialog] = useState(false);
```

### 3. Replace the assets TabsContent

Replace the entire `<TabsContent value="assets">` section with:

```typescript
<TabsContent value="assets">
  <AssetsTab songId={songId} songStage={song.current_stage} />
</TabsContent>
```

### 4. Clean up unused code

Remove the following:
- The `reviewAssetMutation` (now handled inside AssetsTab)
- The upload asset dialog JSX at the bottom of the assets tab
- Any old asset-specific state or handlers

## Components Created

### 1. AssetsTab.tsx
Main container component with:
- Asset requirements card
- Upload form
- Filtering and bulk actions
- Grid/list view toggle
- Asset statistics

### 2. AssetGridCard.tsx
Enhanced asset card with:
- Image thumbnail preview from Google Drive
- Checkbox for bulk selection
- Action dropdown menu
- Both grid and list view modes
- Status badges and file info

### 3. AssetReviewDialog.tsx
Review workflow dialog with:
- Asset details display
- Approve/Reject/Request Revision actions
- Required notes for rejections/revisions
- Review guidelines

### 4. AssetEditDialog.tsx
Asset metadata editor with:
- Title, type, description editing
- Google Drive URL update
- Form validation
- Real-time character counts

### 5. AssetRequirementsCard.tsx
Requirements tracker showing:
- Required vs optional assets
- Completion status for each type
- Overall progress indicators
- Visual status icons

## API Endpoints Added

Added to `/home/ioan/projects/HaOS/stack/frontend/src/api/songApi.ts`:

```typescript
export const updateAsset = (songId: number, assetId: number, data: Partial<AssetCreate>) => {
  return apiClient.patch<SongAsset>(
    `${SONGS_BASE}/${songId}/assets/${assetId}/`,
    data
  );
};

export const deleteAsset = (songId: number, assetId: number) => {
  return apiClient.delete(`${SONGS_BASE}/${songId}/assets/${assetId}/`);
};
```

## Features

### For Marketing Team
- Upload assets with metadata
- Edit asset details
- See review status and feedback
- Bulk download assets

### For Label Team
- Review pending assets
- Approve/reject with notes
- Request revisions with specific feedback
- Bulk approve multiple assets
- Track completion of required assets

### For Administrators
- Full access to all features
- Edit and delete any asset
- Override permissions

## Permissions

The component automatically handles permissions based on:
- `user.profile.department.code` - Department access
- `user.profile.role.level` - Admin level access
- `songStage` - Workflow stage requirements

## Technical Notes

- Uses TanStack Query for data fetching and cache management
- Implements optimistic UI updates
- Google Drive thumbnails auto-generated from file IDs
- Glassmorphic design with hover effects
- Fully responsive grid/list layouts
- Type-safe with TypeScript
