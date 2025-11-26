import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { distributionsService } from '@/api/services/distributions.service'
import { Distribution } from '@/types/distribution'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { GenericTable, type ColumnDef, type SortState, type FilterState } from '@/components/tables'
import { cn } from '@/lib/utils'

const dealStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_negotiation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

const dealTypeColors: Record<string, string> = {
  artist: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  label: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  aggregator: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'in_negotiation', label: 'In Negotiation' },
  { value: 'expired', label: 'Expired' },
]

const dealTypeOptions = [
  { value: 'artist', label: 'Artist' },
  { value: 'label', label: 'Label' },
  { value: 'aggregator', label: 'Aggregator' },
]

export default function DistributionsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortState, setSortState] = useState<SortState | null>({ columnId: 'signing_date', direction: 'desc' })
  const [filterState, setFilterState] = useState<FilterState>({})

  // Build API params
  const apiParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page_size: 100,
    }

    if (search) {
      params.search = search
    }

    if (filterState.deal_status) {
      params.deal_status = filterState.deal_status
    }

    if (filterState.deal_type) {
      params.deal_type = filterState.deal_type
    }

    if (sortState) {
      params.ordering = sortState.direction === 'desc' ? `-${sortState.columnId}` : sortState.columnId
    }

    return params
  }, [search, filterState, sortState])

  const { data, isLoading } = useQuery({
    queryKey: ['distributions', apiParams],
    queryFn: () => distributionsService.getDistributions(apiParams as any),
  })

  const distributions = data?.results || []

  // Split into active and other distributions
  const { activeDistributions, otherDistributions } = useMemo(() => {
    const active: Distribution[] = []
    const other: Distribution[] = []

    distributions.forEach(dist => {
      if (dist.deal_status === 'active') {
        active.push(dist)
      } else {
        other.push(dist)
      }
    })

    return {
      activeDistributions: active,
      otherDistributions: other,
    }
  }, [distributions])

  // Calculate stats
  const stats = useMemo(() => ({
    total: data?.count || 0,
    active: activeDistributions.length,
    inNegotiation: distributions.filter(d => d.deal_status === 'in_negotiation').length,
    totalTracks: distributions.reduce((sum, d) => sum + d.track_count, 0),
  }), [data, distributions, activeDistributions])

  // Handle sort
  const handleSort = useCallback((columnId: string, direction: 'asc' | 'desc' | null) => {
    if (direction) {
      setSortState({ columnId, direction })
    } else {
      setSortState(null)
    }
  }, [])

  // Handle filter - receives full FilterState from GenericTable
  const handleFilter = useCallback((filters: FilterState) => {
    setFilterState(filters)
  }, [])

  // Count active filters
  const activeFiltersCount = Object.keys(filterState).length

  // Define columns
  const columns: ColumnDef<Distribution>[] = useMemo(() => [
    {
      id: 'entity',
      accessorFn: (row) => row.entity.display_name,
      header: 'Client',
      sortable: true,
      filterable: true,
      filterType: 'text',
      filterPlaceholder: 'Filter by entity...',
      minWidth: 180,
      cell: ({ row }) => (
        <span className="font-medium">{row.entity.display_name}</span>
      ),
    },
    {
      id: 'deal_type',
      accessorKey: 'deal_type',
      header: 'Deal Type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: dealTypeOptions,
      width: 130,
      cell: ({ row }) => (
        <Badge className={cn('text-xs', dealTypeColors[row.deal_type])}>
          {row.deal_type_display}
        </Badge>
      ),
    },
    {
      id: 'deal_status',
      accessorKey: 'deal_status',
      header: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: statusOptions,
      width: 140,
      cell: ({ row }) => (
        <Badge className={cn('text-xs', dealStatusColors[row.deal_status])}>
          {row.deal_status_display}
        </Badge>
      ),
    },
    {
      id: 'global_revenue_share_percentage',
      accessorKey: 'global_revenue_share_percentage',
      header: 'Revenue Share',
      sortable: true,
      width: 120,
      align: 'right',
      cell: ({ value }) => (
        <span className="font-medium">{value}%</span>
      ),
    },
    {
      id: 'track_count',
      accessorKey: 'track_count',
      header: 'Tracks',
      sortable: true,
      width: 90,
      align: 'right',
      cell: ({ value }) => (
        <span className="text-muted-foreground">{value as number}</span>
      ),
    },
    {
      id: 'signing_date',
      accessorKey: 'signing_date',
      header: 'Signing Date',
      sortable: true,
      width: 130,
      cell: ({ value }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'total_revenue',
      accessorKey: 'total_revenue',
      header: 'Total Revenue',
      sortable: true,
      width: 130,
      align: 'right',
      cell: ({ value }) => (
        <span className="font-medium">
          €{parseFloat(value as string).toLocaleString()}
        </span>
      ),
    },
  ], [])

  const hasActiveFilters = activeFiltersCount > 0 || search

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 px-6 py-4 shadow-xl">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Title + Stats */}
              <div className="flex items-center gap-3 mr-auto">
                <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{stats.total}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="text-green-500 font-medium">{stats.active} active</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{stats.inNegotiation} neg</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{stats.totalTracks} tracks</span>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm text-sm"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearch('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setSearch(''); setFilterState({}) }}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* New Distribution */}
              <Button
                onClick={() => navigate('/digital/distributions/new')}
                size="sm"
                className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>
        </div>

        {/* Active Distributions */}
        {activeDistributions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Active Distributions
              <Badge variant="secondary" className="ml-2">{activeDistributions.length}</Badge>
            </h2>
            <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
              <GenericTable
                columns={columns}
                data={activeDistributions}
                getRowId={(row) => row.id}
                sortState={sortState}
                filterState={filterState}
                onSort={handleSort}
                onFilter={handleFilter}
                onRowClick={(row) => navigate(`/digital/distributions/${row.id}`)}
                loading={isLoading}
                density="comfortable"
                stickyHeader
                persistKey="distributions-table-active"
              />
            </div>
          </div>
        )}

        {/* Other Distributions */}
        {otherDistributions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
              Other Distributions
              <Badge variant="outline" className="ml-2">{otherDistributions.length}</Badge>
            </h2>
            <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
              <GenericTable
                columns={columns}
                data={otherDistributions}
                getRowId={(row) => row.id}
                sortState={sortState}
                filterState={filterState}
                onSort={handleSort}
                onFilter={handleFilter}
                onRowClick={(row) => navigate(`/digital/distributions/${row.id}`)}
                loading={isLoading}
                density="comfortable"
                stickyHeader
                persistKey="distributions-table-other"
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {distributions.length === 0 && !isLoading && (
          <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No distributions found</h3>
            <p className="text-muted-foreground mb-6">
              {search || activeFiltersCount > 0
                ? 'Try adjusting your filters or search query'
                : 'Create your first distribution deal to get started'}
            </p>
            {search || activeFiltersCount > 0 ? (
              <Button
                onClick={() => { setSearch(''); setFilterState({}) }}
                variant="outline"
                className="rounded-xl"
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/digital/distributions/new')}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Distribution
              </Button>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
