/**
 * Distributions Page - Main distributions list with table view
 *
 * Views:
 * - All: Active + Other distributions (default)
 * - By Entity: Distributions grouped by entity
 * - By Type: Distributions grouped by deal type
 *
 * Features:
 * - Infinite scrolling
 * - Filters (status, deal type, period)
 * - Search
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Filter,
  Search,
  Loader2,
  Users,
  LayoutList,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useInfiniteDistributions, useDistributionStats } from '@/api/hooks/useDistributions'
import { cn, formatMoney } from '@/lib/utils'
import type { Distribution, DistributionFilters, DealType } from '@/types/distribution'
import {
  ACTIVE_DEAL_STATUSES,
  DEAL_STATUS_CONFIG,
  DEAL_TYPE_CONFIG,
} from '@/types/distribution'
import { DistributionsTable } from './components/DistributionsTable'
import { CreateDistributionModal } from './components/CreateDistributionModal'
import { DistributionFiltersSheet } from './components/DistributionFiltersSheet'
import { useInView } from '@/hooks/useIntersectionObserver'

type TabMode = 'all' | 'by-entity' | 'by-type'

export default function DistributionsPage() {
  const navigate = useNavigate()
  const [tabMode, setTabMode] = useState<TabMode>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<DistributionFilters>({})

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const [expandedEntities, setExpandedEntities] = useState<Set<number>>(new Set())
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  // Infinite scroll ref
  const { ref: loadMoreRef, inView } = useInView()

  // Build filters with search
  const activeFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
  }), [filters, debouncedSearch])

  // Fetch distributions with infinite scroll
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteDistributions(activeFilters)

  // Fetch stats for header
  const { data: stats } = useDistributionStats(filters)

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten pages into single array
  const distributions = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.results)
  }, [data])

  // Split into active and other distributions
  const { activeDistributions, otherDistributions } = useMemo(() => {
    const active: Distribution[] = []
    const other: Distribution[] = []

    distributions.forEach(dist => {
      if (ACTIVE_DEAL_STATUSES.includes(dist.deal_status)) {
        active.push(dist)
      } else {
        other.push(dist)
      }
    })

    // Sort by created_at desc
    const sortByDate = (a: Distribution, b: Distribution) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

    return {
      activeDistributions: active.sort(sortByDate),
      otherDistributions: other.sort(sortByDate),
    }
  }, [distributions])

  // Group by entity
  const distributionsByEntity = useMemo(() => {
    const grouped = new Map<number, {
      entity: Distribution['entity']
      distributions: Distribution[]
      totalRevenue: number
      activeCount: number
      trackCount: number
    }>()

    distributions.forEach(dist => {
      if (!dist.entity?.id) return

      const entityId = dist.entity.id
      if (!grouped.has(entityId)) {
        grouped.set(entityId, {
          entity: dist.entity,
          distributions: [],
          totalRevenue: 0,
          activeCount: 0,
          trackCount: 0,
        })
      }
      const group = grouped.get(entityId)!
      group.distributions.push(dist)
      group.totalRevenue += parseFloat(dist.total_revenue || '0')
      group.trackCount += dist.track_count || 0
      if (ACTIVE_DEAL_STATUSES.includes(dist.deal_status)) {
        group.activeCount++
      }
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount
      return b.totalRevenue - a.totalRevenue
    })
  }, [distributions])

  // Group by deal type
  const distributionsByType = useMemo(() => {
    const grouped = new Map<DealType, {
      type: DealType
      distributions: Distribution[]
      totalRevenue: number
      activeCount: number
      trackCount: number
    }>()

    distributions.forEach(dist => {
      const type = dist.deal_type
      if (!grouped.has(type)) {
        grouped.set(type, {
          type,
          distributions: [],
          totalRevenue: 0,
          activeCount: 0,
          trackCount: 0,
        })
      }
      const group = grouped.get(type)!
      group.distributions.push(dist)
      group.totalRevenue += parseFloat(dist.total_revenue || '0')
      group.trackCount += dist.track_count || 0
      if (ACTIVE_DEAL_STATUSES.includes(dist.deal_status)) {
        group.activeCount++
      }
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount
      return b.totalRevenue - a.totalRevenue
    })
  }, [distributions])

  const toggleEntityExpanded = (entityId: number) => {
    setExpandedEntities(prev => {
      const next = new Set(prev)
      if (next.has(entityId)) {
        next.delete(entityId)
      } else {
        next.add(entityId)
      }
      return next
    })
  }

  const toggleTypeExpanded = (type: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const handleDistributionClick = (id: number) => {
    navigate(`/distributions/${id}`)
  }

  const handleEntityClick = (entityId: number) => {
    navigate(`/entities/${entityId}`)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchInput('')
    setDebouncedSearch('')
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || debouncedSearch

  // Only show full-page loader on initial load
  if (isLoading && distributions.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 px-6 py-4 shadow-xl">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-400/30 to-teal-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-400/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Title + Stats */}
              <div className="flex items-center gap-3 mr-auto">
                <h1 className="text-2xl font-bold tracking-tight">Distributions</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{stats?.total_distributions || distributions.length}</span>
                  {stats && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-green-500 font-medium">{stats.by_status?.active || 0} active</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{stats.by_status?.in_negotiation || 0} negotiating</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{stats.total_tracks || 0} tracks</span>
                    </>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm text-sm"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => { setSearchInput(''); setDebouncedSearch('') }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Tab Toggle */}
              <div className="p-0.5 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10">
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTabMode('all')}
                    className={cn(
                      "h-8 px-3 gap-1.5 rounded-lg text-xs",
                      tabMode === 'all' && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTabMode('by-entity')}
                    className={cn(
                      "h-8 px-3 gap-1.5 rounded-lg text-xs",
                      tabMode === 'by-entity' && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Entity
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTabMode('by-type')}
                    className={cn(
                      "h-8 px-3 gap-1.5 rounded-lg text-xs",
                      tabMode === 'by-type' && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Type
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'relative h-9 w-9 rounded-xl border border-white/10 hover:bg-white/10',
                  showFilters && 'bg-white/10'
                )}
                onClick={() => setShowFilters(!showFilters)}
                title="Filters"
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-[10px] text-white flex items-center justify-center">
                    {Object.keys(filters).length + (debouncedSearch ? 1 : 0)}
                  </span>
                )}
              </Button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* New Distribution */}
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Sheet */}
        <DistributionFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Content based on tab mode */}
        {tabMode === 'all' && (
          <div className="space-y-6">
            {/* Active Distributions */}
            {activeDistributions.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Active Distributions
                  <Badge variant="secondary" className="ml-2">{activeDistributions.length}</Badge>
                </h2>
                <DistributionsTable
                  distributions={activeDistributions}
                  onDistributionClick={handleDistributionClick}
                  onEntityClick={handleEntityClick}
                />
              </div>
            )}

            {/* Other Distributions */}
            {otherDistributions.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                  Other Distributions
                  <Badge variant="outline" className="ml-2">{otherDistributions.length}</Badge>
                </h2>
                <DistributionsTable
                  distributions={otherDistributions}
                  onDistributionClick={handleDistributionClick}
                  onEntityClick={handleEntityClick}
                />
              </div>
            )}
          </div>
        )}

        {tabMode === 'by-entity' && (
          <div className="space-y-3">
            {distributionsByEntity.map(({ entity, distributions: entityDistributions, totalRevenue, activeCount, trackCount }) => {
              const isExpanded = expandedEntities.has(entity.id)

              return (
                <Card key={entity.id} className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                  {/* Entity Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleEntityExpanded(entity.id)}
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>

                    {entity.image_url ? (
                      <img src={entity.image_url} alt={entity.display_name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-lg font-semibold">{entity.display_name?.charAt(0)}</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{entity.display_name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{entityDistributions.length} deal{entityDistributions.length !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="text-green-500">{activeCount} active</span>
                        <span>•</span>
                        <span>{trackCount} tracks</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatMoney(totalRevenue, 'EUR')}
                      </p>
                      <p className="text-xs text-muted-foreground">total revenue</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); navigate(`/entities/${entity.id}`) }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10">
                      <DistributionsTable
                        distributions={entityDistributions}
                        onDistributionClick={handleDistributionClick}
                        onEntityClick={handleEntityClick}
                      />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {tabMode === 'by-type' && (
          <div className="space-y-3">
            {distributionsByType.map(({ type, distributions: typeDistributions, totalRevenue, activeCount, trackCount }) => {
              const isExpanded = expandedTypes.has(type)
              const typeConfig = DEAL_TYPE_CONFIG[type]

              return (
                <Card key={type} className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                  {/* Type Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleTypeExpanded(type)}
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>

                    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-xl', typeConfig.bgColor)}>
                      {typeConfig.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{typeConfig.label}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{typeDistributions.length} deal{typeDistributions.length !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="text-green-500">{activeCount} active</span>
                        <span>•</span>
                        <span>{trackCount} tracks</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatMoney(totalRevenue, 'EUR')}
                      </p>
                      <p className="text-xs text-muted-foreground">total revenue</p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10">
                      <DistributionsTable
                        distributions={typeDistributions}
                        onDistributionClick={handleDistributionClick}
                        onEntityClick={handleEntityClick}
                      />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Empty State */}
        {distributions.length === 0 && !isLoading && (
          <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
            <div className="text-6xl mb-4">📀</div>
            <h3 className="text-xl font-semibold mb-2">No distributions found</h3>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'Create your first distribution deal to get started'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Distribution
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Create Distribution Modal */}
      <CreateDistributionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </AppLayout>
  )
}
