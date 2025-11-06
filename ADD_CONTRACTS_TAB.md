# Contracts Tab Integration Guide

## Summary

A new "Contracts" tab has been added to the song detail page to show contracts related to a song's work, recordings, or release.

## Files Created/Modified

### Created:
1. `/home/ioan/projects/HaOS/stack/frontend/src/components/songs/ContractsTab.tsx` - Main component for displaying contracts
2. `/home/ioan/projects/HaOS/stack/backend/catalog/views.py` - Added `@action(detail=True)` method `contracts()` to `SongViewSet`

### Modified:
1. `/home/ioan/projects/HaOS/stack/frontend/src/api/songApi.ts` - Added `fetchSongContracts()` function
2. `/home/ioan/projects/HaOS/stack/frontend/src/pages/songs/SongDetailPage.tsx` - Needs manual integration (see below)

## Manual Integration Required

The `SongDetailPage.tsx` file needs the following changes:

### 1. Add import (around line 24):
```typescript
import { ContractsTab } from '@/components/songs/ContractsTab';
```

### 2. Update TabsList grid-cols (around line 356):
Change `grid-cols-6` to `grid-cols-7`:
```typescript
<TabsList className="w-full grid grid-cols-3 md:grid-cols-7 gap-2 bg-transparent">
```

### 3. Add TabsTrigger (after Release trigger, before Activity trigger):
```typescript
<TabsTrigger value="contracts" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Contracts</TabsTrigger>
```

### 4. Add TabsContent (after Release TabsContent, before Activity TabsContent):
```typescript
<TabsContent value="contracts" className="space-y-6">
  <ContractsTab
    songId={songId}
    workId={song?.work?.id}
    releaseId={song?.release?.id}
  />
</TabsContent>
```

## Features Implemented

- **Contract List Display**: Shows all contracts linked to the song via ContractScope
- **Contract Details**: Displays contract number, title, type, parties, status, and dates
- **Empty State**: Shows "No contracts yet" message with "Link Contract" button
- **Permissions**:
  - All users can VIEW contracts
  - Label and administrators can LINK existing contracts
- **Contract Coverage**: Shows what each contract covers (works, recordings, releases)
- **External Links**: Direct links to contract documents in Google Drive
- **Glassmorphic Design**: Matches the existing design system

## Backend API Endpoint

New endpoint added: `GET /api/v1/songs/{id}/contracts/`

This endpoint:
- Returns contracts linked via `ContractScope` to:
  - The song's work
  - The song's recordings
  - The song's release
- Includes full contract details with signatures and scopes
- Properly handles permissions via existing ContractPermission class

## Testing

To test the feature:
1. Navigate to a song detail page
2. Click on the "Contracts" tab
3. If contracts exist, they will be displayed in a table
4. If no contracts exist, an empty state with "Link Contract" button will be shown

## Component Structure

```
ContractsTab
├── Header Card (with Link Contract button)
├── Contracts List Table
│   ├── Contract Number
│   ├── Title & Department
│   ├── Type Badge
│   ├── Parties
│   ├── Status Badge
│   ├── Dates
│   └── Actions (View Details, External Link)
└── Contract Coverage Card
    └── Scope information for each contract
```

## Dependencies

- Uses existing shadcn/ui components (Card, Table, Badge, Button)
- Uses existing API client with authentication
- Uses existing permission system from user store
- Leverages existing Contract models and serializers from backend
