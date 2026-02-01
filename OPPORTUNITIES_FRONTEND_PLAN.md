# Opportunities Frontend Implementation Plan

## Objective
Redesign the Opportunities page to match the Campaigns page UI exactly, with inline editing, easy creation, and a clean kanban view.

---

## Current State Analysis

### Campaigns Page Features (Target)
1. **Compact header** with gradient background, stats inline, search, tab toggle, view toggle, filter button, create button
2. **View modes**: Table + Kanban (2 modes)
3. **Tab modes**: All / By Client / By Platform
4. **Infinite scroll** with `useInView` from `react-intersection-observer`
5. **Debounced search** (300ms)
6. **Filter sheet** (right drawer) with status, type, period presets
7. **Stats display** inline in header (count by stage)
8. **Kanban**: 5 columns (lead, negotiation, confirmed, active, completed), drag-drop, budget per column
9. **Table**: Compact rows with status indicator, client avatar, budget, progress bar
10. **Inline editing** in SubCampaignsList (click-to-edit fields, save on blur/enter, escape to cancel)
11. **Quick create modal** - select client, auto-generate name, create

### Current Opportunities Page (Gaps)
1. **Large header** - needs to be compacted
2. **4 view modes** (hybrid, grouped, kanban, table) - too complex, simplify to 2
3. **No stats** in header
4. **No search** functionality
5. **Filter button exists** but not implemented
6. **No infinite scroll** - loads all 200 at once
7. **Table view** - basic, no inline editing
8. **Kanban view** - collapsible columns, 11 stages - too complex
9. **QuickCreateModal exists** but doesn't match campaigns pattern
10. **No inline editing** in detail or list views

### New Backend Features (to integrate)
- `OpportunityInvoice` links - link/unlink invoices to opportunities
- `OpportunityContract` links - link/unlink/create contracts for opportunities
- Task integration via `OpportunityTask` domain wrapper

---

## Implementation Plan

### Phase 1: API Layer Updates
**Files to create/update**: `src/api/services/opportunities.service.ts`, `src/api/hooks/useOpportunities.ts`

#### 1.1 Add Invoice Link API
```typescript
// services/opportunities.service.ts
export const opportunityInvoicesApi = {
  list: (opportunityId: number) =>
    apiClient.get(`/api/v1/opportunity/opportunities/${opportunityId}/invoices/`),
  link: (opportunityId: number, data: { invoice_id: number; invoice_type: string; is_primary?: boolean }) =>
    apiClient.post(`/api/v1/opportunity/opportunity-invoices/link/`, { opportunity: opportunityId, ...data }),
  unlink: (linkId: number) =>
    apiClient.delete(`/api/v1/opportunity/opportunity-invoices/${linkId}/`),
}
```

#### 1.2 Add Contract Link API
```typescript
// services/opportunities.service.ts
export const opportunityContractsApi = {
  list: (opportunityId: number) =>
    apiClient.get(`/api/v1/opportunity/opportunities/${opportunityId}/contracts/`),
  link: (opportunityId: number, data: { contract_id: number; is_primary?: boolean }) =>
    apiClient.post(`/api/v1/opportunity/opportunity-contracts/link/`, { opportunity: opportunityId, ...data }),
  createAndLink: (opportunityId: number, contractData: CreateContractInput) =>
    apiClient.post(`/api/v1/opportunity/opportunity-contracts/create_and_link/`, { opportunity: opportunityId, ...contractData }),
  unlink: (linkId: number) =>
    apiClient.delete(`/api/v1/opportunity/opportunity-contracts/${linkId}/`),
}
```

#### 1.3 Add Stats API
```typescript
// services/opportunities.service.ts
export const opportunitiesApi = {
  // ... existing methods
  getStats: (params?: OpportunityListParams) =>
    apiClient.get('/api/v1/opportunity/opportunities/stats/', { params }),
}
```

#### 1.4 Add Infinite Scroll Hook
```typescript
// hooks/useOpportunities.ts
export function useInfiniteOpportunities(params?: OpportunityListParams, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['opportunities', 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      opportunitiesApi.list({ ...params, page: pageParam, page_size: pageSize }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.next ? pages.length + 1 : undefined,
    initialPageParam: 1,
  })
}
```

#### 1.5 Add Stats Hook
```typescript
export function useOpportunityStats(params?: OpportunityListParams) {
  return useQuery({
    queryKey: ['opportunities', 'stats', params],
    queryFn: () => opportunitiesApi.getStats(params),
  })
}
```

---

### Phase 2: Types & Config Updates
**Files**: `src/types/opportunities.ts`

#### 2.1 Add Missing Types
```typescript
// Invoice link types
export interface OpportunityInvoiceLink {
  id: number
  opportunity: number
  invoice: number
  invoice_type: 'advance' | 'milestone' | 'final' | 'full'
  is_primary: boolean
  created_at: string
  // Nested invoice info from serializer
  invoice_details?: {
    id: number
    invoice_number: string
    status: string
    total_amount: string
    currency: string
    due_date: string
  }
}

// Contract link types
export interface OpportunityContractLink {
  id: number
  opportunity: number
  contract: number
  is_primary: boolean
  created_at: string
  // Nested contract info from serializer
  contract_details?: {
    id: number
    contract_type: string
    status: string
    entity_name: string
  }
}

// Filters type
export interface OpportunityFilters {
  stage?: OpportunityStage[]
  priority?: OpportunityPriority[]
  owner?: number
  team?: number
  expected_close_date_after?: string
  expected_close_date_before?: string
  estimated_value_min?: number
  estimated_value_max?: number
  search?: string
}
```

#### 2.2 Simplify Stage Config
Keep existing `STAGE_CONFIG` but add `KANBAN_STAGES` for the kanban view:
```typescript
// Stages to show in kanban (main workflow stages)
export const KANBAN_STAGES: OpportunityStage[] = [
  'brief',
  'proposal_sent',
  'negotiation',
  'contract_sent',
  'won',
  'executing',
]
```

---

### Phase 3: Main Page Redesign
**File**: `src/pages/opportunities/OpportunitiesKanban.tsx` → rename to `index.tsx` or complete rewrite

#### 3.1 New Page Structure
```tsx
export default function OpportunitiesPage() {
  // State
  const [viewType, setViewType] = useState<'table' | 'kanban'>('kanban')
  const [tabMode, setTabMode] = useState<'all' | 'by-account' | 'by-owner'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<OpportunityFilters>({})

  // Data
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteOpportunities({ ...filters, search: debouncedSearch })
  const { data: stats } = useOpportunityStats(filters)

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView()
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [inView, hasNextPage, isFetchingNextPage])

  return (
    <AppLayout>
      {/* Header - compact like campaigns */}
      {/* Filters Sheet */}
      {/* Content based on tabMode and viewType */}
      {/* Load More Trigger */}
    </AppLayout>
  )
}
```

#### 3.2 Header Component (compact, campaigns-style)
```tsx
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 px-6 py-4 shadow-xl">
  <div className="relative z-10 flex items-center gap-4 flex-wrap">
    {/* Title + Stats */}
    <div className="flex items-center gap-3 mr-auto">
      <h1 className="text-2xl font-bold">Opportunities</h1>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{stats?.total || 0}</span>
        <span>•</span>
        <span>{stats?.by_stage?.brief || 0} brief</span>
        <span>•</span>
        <span>{stats?.by_stage?.proposal_sent || 0} proposal</span>
        <span>•</span>
        <span className="text-green-500">{stats?.by_stage?.won || 0} won</span>
      </div>
    </div>

    {/* Search */}
    <SearchInput value={searchInput} onChange={setSearchInput} />

    {/* Tab Toggle */}
    <TabToggle value={tabMode} onChange={setTabMode} />

    {/* View Toggle */}
    <ViewToggle value={viewType} onChange={setViewType} />

    {/* Filters */}
    <FilterButton hasActive={hasActiveFilters} onClick={() => setShowFilters(true)} />

    {/* Quick Create + New */}
    <QuickCreateModal />
    <Button onClick={() => navigate('/opportunities/new')}>
      <Plus className="mr-1" /> New
    </Button>
  </div>
</div>
```

---

### Phase 4: New Components
**Location**: `src/pages/opportunities/components/`

#### 4.1 OpportunitiesTable.tsx
Compact table matching campaigns style:
```tsx
interface OpportunitiesTableProps {
  opportunities: Opportunity[]
  onOpportunityClick: (id: number) => void
  onAccountClick: (accountId: number) => void
}

// Features:
// - Status indicator bar (left side, colored)
// - Opportunity title with stage badge
// - Account with avatar
// - Value display
// - Owner avatar
// - Expected close date
// - Priority indicator
```

#### 4.2 OpportunitiesKanbanView.tsx
Simplified kanban matching campaigns style:
```tsx
// Features:
// - 6 columns: brief, proposal_sent, negotiation, contract_sent, won, executing
// - Column headers with count and total value
// - Drag-drop via @dnd-kit
// - Compact cards showing: title, account, value, owner, close date
// - Lost/completed indicator at bottom
```

#### 4.3 OpportunityFiltersSheet.tsx
Right-side drawer for filters:
```tsx
// Features:
// - Stage multi-select (checkboxes with emojis)
// - Priority multi-select
// - Period presets (This Month, Last Month, This Quarter, etc.)
// - Custom date range
// - Value range slider
// - Owner filter
// - Apply/Clear buttons
```

#### 4.4 OpportunityKanbanCard.tsx
Compact card for kanban view:
```tsx
// Features:
// - Title (2 line clamp)
// - Account name with avatar
// - Value in green
// - Priority badge (if high/urgent)
// - Owner initials
// - Close date
// - Subtle border color based on stage
```

---

### Phase 5: Inline Editing
**Location**: Update detail page and add inline components

#### 5.1 InlineEditableOpportunityField.tsx
Generic inline edit component (copy pattern from SubCampaignsList):
```tsx
// Pattern:
// 1. State: editingField, inputValue
// 2. Click to start editing
// 3. Input shows on edit
// 4. onBlur or Enter saves
// 5. Escape cancels
// 6. Loading state during save
```

#### 5.2 Update OpportunityDetail.tsx
Add inline editing for:
- Title (click to edit)
- Estimated value
- Expected close date (calendar popover)
- Priority (dropdown)
- Notes (autosave like campaigns)

---

### Phase 6: Invoice & Contract Integration
**Location**: `src/pages/opportunities/components/`

#### 6.1 OpportunityInvoicesSection.tsx
Section in opportunity detail showing linked invoices:
```tsx
// Features:
// - List of linked invoices with type badges (advance, milestone, final)
// - Primary invoice indicator
// - Invoice status badge
// - Link existing invoice button (search/select modal)
// - Unlink button
// - Quick stats: total invoiced, paid, pending
```

#### 6.2 OpportunityContractsSection.tsx
Section in opportunity detail showing linked contracts:
```tsx
// Features:
// - List of linked contracts with status badges
// - Primary contract indicator
// - Link existing contract button
// - Create new contract button (opens contract creation with opportunity context)
// - Unlink button
// - Auto-advance indicator when contract signed
```

#### 6.3 LinkInvoiceModal.tsx
Modal to search and link existing invoice:
```tsx
// Features:
// - Search invoices
// - Filter by status (draft, sent, paid)
// - Select invoice type (advance, milestone, final, full)
// - Set as primary checkbox
// - Link button
```

#### 6.4 LinkContractModal.tsx
Modal to search and link existing contract:
```tsx
// Features:
// - Search contracts
// - Filter by status
// - Set as primary checkbox
// - Link button
// - OR create new contract option
```

---

### Phase 7: Update QuickCreateModal
Align with campaigns pattern:
```tsx
// Changes:
// - Auto-generate title from account name + month/year
// - Recent accounts list
// - Simpler form (account select + go)
// - Auto-navigate to detail on success
```

---

### Phase 8: Routing Updates
**File**: `src/App.tsx` or routing config

Ensure routes are clean:
```tsx
'/opportunities'          → OpportunitiesPage (list/kanban)
'/opportunities/new'      → OpportunityForm (create)
'/opportunities/:id'      → OpportunityDetail (view)
'/opportunities/:id/edit' → OpportunityForm (edit)
```

---

## File Changes Summary

### New Files
1. `src/pages/opportunities/index.tsx` - Main page (replace OpportunitiesKanban.tsx)
2. `src/pages/opportunities/components/OpportunitiesTable.tsx`
3. `src/pages/opportunities/components/OpportunitiesKanbanView.tsx`
4. `src/pages/opportunities/components/OpportunityFiltersSheet.tsx`
5. `src/pages/opportunities/components/OpportunityKanbanCard.tsx`
6. `src/pages/opportunities/components/OpportunityInvoicesSection.tsx`
7. `src/pages/opportunities/components/OpportunityContractsSection.tsx`
8. `src/pages/opportunities/components/LinkInvoiceModal.tsx`
9. `src/pages/opportunities/components/LinkContractModal.tsx`

### Updated Files
1. `src/api/services/opportunities.service.ts` - Add invoice/contract APIs, stats
2. `src/api/hooks/useOpportunities.ts` - Add infinite scroll, stats, invoice/contract hooks
3. `src/types/opportunities.ts` - Add filter types, invoice/contract link types, kanban stages
4. `src/pages/opportunities/OpportunityDetail.tsx` - Add inline editing, invoice/contract sections
5. `src/pages/opportunities/components/QuickCreateModal.tsx` - Simplify, align with campaigns

### Files to Remove/Archive
1. `src/pages/opportunities/OpportunitiesKanban.tsx` - Replace with new index.tsx

---

## Implementation Order

1. **Phase 1**: API layer (1-2 hours)
2. **Phase 2**: Types updates (30 min)
3. **Phase 3**: Main page redesign (2-3 hours)
4. **Phase 4**: Table + Kanban components (2-3 hours)
5. **Phase 5**: Inline editing (1-2 hours)
6. **Phase 6**: Invoice/Contract integration (2-3 hours)
7. **Phase 7**: QuickCreate update (30 min)
8. **Phase 8**: Routing cleanup (15 min)

**Total estimate**: 10-14 hours

---

## Key Patterns to Follow (from Campaigns)

### 1. Inline Edit Pattern
```tsx
const [editingField, setEditingField] = useState<string | null>(null)
const [inputValue, setInputValue] = useState('')

// Click to edit
onClick={() => {
  setEditingField('fieldName')
  setInputValue(currentValue)
}}

// Show input when editing
{editingField === 'fieldName' ? (
  <Input
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
    onBlur={() => saveField()}
    onKeyDown={(e) => {
      if (e.key === 'Enter') saveField()
      if (e.key === 'Escape') cancelEdit()
    }}
    autoFocus
  />
) : (
  <button onClick={() => startEdit()}>{displayValue}</button>
)}
```

### 2. Debounced Search Pattern
```tsx
const [searchInput, setSearchInput] = useState('')
const [debouncedSearch, setDebouncedSearch] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
  return () => clearTimeout(timer)
}, [searchInput])
```

### 3. Infinite Scroll Pattern
```tsx
const { ref: loadMoreRef, inView } = useInView()

useEffect(() => {
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
}, [inView, hasNextPage, isFetchingNextPage])

// At bottom of list
<div ref={loadMoreRef} className="h-10">
  {isFetchingNextPage && <Loader2 className="animate-spin" />}
</div>
```

### 4. Filter Sheet Pattern
```tsx
<Sheet open={showFilters} onOpenChange={setShowFilters}>
  <SheetContent side="right">
    {/* Filter controls with debounced onChange */}
  </SheetContent>
</Sheet>
```

---

## Design Tokens (from Campaigns)

### Header Gradient
```css
bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10
```

### Card Style
```css
rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm
```

### Tab Toggle Active
```css
bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg
```

### Button Primary
```css
bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
```
