/**
 * Opportunities Page - Main opportunities list with table/kanban views
 *
 * Views:
 * - All: Active + Terminal opportunities (default, table or kanban)
 * - By Client: Opportunities grouped by client/artist
 * - By Owner: Opportunities grouped by owner
 *
 * Features:
 * - Toggle between Table and Kanban views
 * - Infinite scrolling
 * - Filters (stage, priority, period)
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
  UserCircle,
  Kanban,
  Table2,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useInfiniteOpportunities, useOpportunityStats } from '@/api/hooks/useOpportunities'
import { cn, formatMoney } from '@/lib/utils'
import type {
  Opportunity,
  OpportunityFilters,
  OpportunityViewType,
  OpportunityTabMode,
} from '@/types/opportunities'
import {
  STAGE_CONFIG,
  ACTIVE_STAGES,
  TERMINAL_STAGES,
} from '@/types/opportunities'
import { OpportunitiesTable } from './components/OpportunitiesTable'
import { OpportunitiesKanban } from './components/OpportunitiesKanban'
import { OpportunityFiltersSheet } from './components/OpportunityFiltersSheet'
import { QuickCreateModal } from './components/QuickCreateModal'
import { useInView } from '@/hooks/useIntersectionObserver'

export default function OpportunitiesPage() {
  const navigate = useNavigate()
  const [tabMode, setTabMode] = useState<OpportunityTabMode>('all')
  const [viewType, setViewType] = useState<OpportunityViewType>('kanban')
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<OpportunityFilters>({})
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set())
  const [expandedOwners, setExpandedOwners] = useState<Set<number>>(new Set())

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Infinite scroll ref
  const { ref: loadMoreRef, inView } = useInView()

  // Build filters with search
  const activeFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
    ordering: '-created_at',
  }), [filters, debouncedSearch])

  // Fetch opportunities with infinite scroll
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteOpportunities(activeFilters)

  // Fetch stats for header
  const { data: stats } = useOpportunityStats(filters)

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten pages into single array
  const opportunities = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.results)
  }, [data])

  // Split into active and terminal opportunities
  const { activeOpportunities, terminalOpportunities } = useMemo(() => {
    const active: Opportunity[] = []
    const terminal: Opportunity[] = []

    opportunities.forEach(opp => {
      if (ACTIVE_STAGES.includes(opp.stage)) {
        active.push(opp)
      } else {
        terminal.push(opp)
      }
    })

    // Sort by created_at desc
    const sortByDate = (a: Opportunity, b: Opportunity) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

    return {
      activeOpportunities: active.sort(sortByDate),
      terminalOpportunities: terminal.sort(sortByDate),
    }
  }, [opportunities])

  // Group by client
  const opportunitiesByClient = useMemo(() => {
    const grouped = new Map<number, {
      client: Opportunity['client']
      opportunities: Opportunity[]
      totalValue: number
      activeCount: number
    }>()

    opportunities.forEach(opp => {
      if (!opp.client?.id) return

      const clientId = opp.client.id
      if (!grouped.has(clientId)) {
        grouped.set(clientId, {
          client: opp.client,
          opportunities: [],
          totalValue: 0,
          activeCount: 0,
        })
      }
      const group = grouped.get(clientId)!
      group.opportunities.push(opp)
      group.totalValue += parseFloat(opp.estimated_value || '0')
      if (ACTIVE_STAGES.includes(opp.stage)) {
        group.activeCount++
      }
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount
      return b.totalValue - a.totalValue
    })
  }, [opportunities])

  // Group by owner
  const opportunitiesByOwner = useMemo(() => {
    const grouped = new Map<number, {
      owner: Opportunity['owner']
      opportunities: Opportunity[]
      totalValue: number
      activeCount: number
    }>()

    opportunities.forEach(opp => {
      if (!opp.owner?.id) return

      const ownerId = opp.owner.id
      if (!grouped.has(ownerId)) {
        grouped.set(ownerId, {
          owner: opp.owner,
          opportunities: [],
          totalValue: 0,
          activeCount: 0,
        })
      }
      const group = grouped.get(ownerId)!
      group.opportunities.push(opp)
      group.totalValue += parseFloat(opp.estimated_value || '0')
      if (ACTIVE_STAGES.includes(opp.stage)) {
        group.activeCount++
      }
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount
      return b.totalValue - a.totalValue
    })
  }, [opportunities])

  const toggleClientExpanded = (clientId: number) => {
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  const toggleOwnerExpanded = (ownerId: number) => {
    setExpandedOwners(prev => {
      const next = new Set(prev)
      if (next.has(ownerId)) {
        next.delete(ownerId)
      } else {
        next.add(ownerId)
      }
      return next
    })
  }

  const handleOpportunityClick = (id: number) => {
    navigate(`/opportunities/${id}`)
  }

  const handleClientClick = (clientId: number) => {
    navigate(`/entities/${clientId}`)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchInput('')
    setDebouncedSearch('')
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || debouncedSearch

  // Only show full-page loader on initial load
  if (isLoading && opportunities.length === 0) {
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 px-6 py-4 shadow-xl">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Title + Stats */}
              <div className="flex items-center gap-3 mr-auto">
                <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{stats?.total || opportunities.length}</span>
                  {stats?.by_stage && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{stats.by_stage.brief || 0} brief</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{stats.by_stage.proposal_sent || 0} prop</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{stats.by_stage.negotiation || 0} neg</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-green-500 font-medium">{stats.by_stage.won || 0} won</span>
                    </>
                  )}
                  {stats?.pipeline_value && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="font-medium text-emerald-500">{formatMoney(parseFloat(stats.pipeline_value), 'EUR')}</span>
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
                      tabMode === 'all' && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTabMode('by-client')}
                    className={cn(
                      "h-8 px-3 gap-1.5 rounded-lg text-xs",
                      tabMode === 'by-client' && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Client
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTabMode('by-owner')}
                    className={cn(
                      "h-8 px-3 gap-1.5 rounded-lg text-xs",
                      tabMode === 'by-owner' && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    )}
                  >
                    <UserCircle className="h-3.5 w-3.5" />
                    Owner
                  </Button>
                </div>
              </div>

              {/* View Toggle */}
              <div className="p-0.5 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10">
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewType('kanban')}
                    className={cn(
                      "h-8 w-8 rounded-lg",
                      viewType === 'kanban' && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    )}
                    title="Kanban view"
                  >
                    <Kanban className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewType('table')}
                    className={cn(
                      "h-8 w-8 rounded-lg",
                      viewType === 'table' && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    )}
                    title="Table view"
                  >
                    <Table2 className="h-4 w-4" />
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
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center">
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

              {/* New Opportunity - Simple modal */}
              <QuickCreateModal />
            </div>
          </div>
        </div>

        {/* Filters Sheet */}
        <OpportunityFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Content based on tab mode */}
        {tabMode === 'all' && (
          <div className="space-y-6">
            {viewType === 'kanban' ? (
              <OpportunitiesKanban
                opportunities={opportunities}
                onOpportunityClick={handleOpportunityClick}
                onClientClick={handleClientClick}
              />
            ) : (
              <>
                {/* Active Opportunities */}
                {activeOpportunities.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Pipeline
                      <Badge variant="secondary" className="ml-2">{activeOpportunities.length}</Badge>
                    </h2>
                    <OpportunitiesTable
                      opportunities={activeOpportunities}
                      onOpportunityClick={handleOpportunityClick}
                      onClientClick={handleClientClick}
                    />
                  </div>
                )}

                {/* Terminal Opportunities */}
                {terminalOpportunities.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                      Completed / Lost
                      <Badge variant="outline" className="ml-2">{terminalOpportunities.length}</Badge>
                    </h2>
                    <OpportunitiesTable
                      opportunities={terminalOpportunities}
                      onOpportunityClick={handleOpportunityClick}
                      onClientClick={handleClientClick}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tabMode === 'by-client' && (
          <div className="space-y-3">
            {opportunitiesByClient.map(({ client, opportunities: clientOpps, totalValue, activeCount }) => {
              const isExpanded = expandedClients.has(client.id)

              return (
                <Card key={client.id} className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                  <ClientGroupHeader
                    client={client}
                    opportunityCount={clientOpps.length}
                    activeCount={activeCount}
                    totalValue={totalValue}
                    isExpanded={isExpanded}
                    onToggle={() => toggleClientExpanded(client.id)}
                    onViewClient={() => navigate(`/entities/${client.id}`)}
                  />

                  {isExpanded && (
                    <div className="border-t border-white/10">
                      {viewType === 'table' ? (
                        <OpportunitiesTable
                          opportunities={clientOpps}
                          onOpportunityClick={handleOpportunityClick}
                          onClientClick={handleClientClick}
                        />
                      ) : (
                        <div className="p-4">
                          <OpportunitiesKanban
                            opportunities={clientOpps}
                            onOpportunityClick={handleOpportunityClick}
                            onClientClick={handleClientClick}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {tabMode === 'by-owner' && (
          <div className="space-y-3">
            {opportunitiesByOwner.map(({ owner, opportunities: ownerOpps, totalValue, activeCount }) => {
              const isExpanded = expandedOwners.has(owner.id)

              return (
                <Card key={owner.id} className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                  <OwnerGroupHeader
                    owner={owner}
                    opportunityCount={ownerOpps.length}
                    activeCount={activeCount}
                    totalValue={totalValue}
                    isExpanded={isExpanded}
                    onToggle={() => toggleOwnerExpanded(owner.id)}
                  />

                  {isExpanded && (
                    <div className="border-t border-white/10">
                      {viewType === 'table' ? (
                        <OpportunitiesTable
                          opportunities={ownerOpps}
                          onOpportunityClick={handleOpportunityClick}
                          onClientClick={handleClientClick}
                        />
                      ) : (
                        <div className="p-4">
                          <OpportunitiesKanban
                            opportunities={ownerOpps}
                            onOpportunityClick={handleOpportunityClick}
                            onClientClick={handleClientClick}
                          />
                        </div>
                      )}
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
        {opportunities.length === 0 && !isLoading && (
          <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">No opportunities found</h3>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'Create your first opportunity to get started'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/opportunities/new')}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Opportunity
              </Button>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

// Client Group Header Component
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ClientGroupHeaderProps {
  client: { id: number; display_name: string; kind?: string }
  opportunityCount: number
  activeCount: number
  totalValue: number
  isExpanded: boolean
  onToggle: () => void
  onViewClient: () => void
}

function ClientGroupHeader({
  client,
  opportunityCount,
  activeCount,
  totalValue,
  isExpanded,
  onToggle,
  onViewClient,
}: ClientGroupHeaderProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={onToggle}
    >
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
          {client.display_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{client.display_name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onViewClient() }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {opportunityCount} opportunit{opportunityCount !== 1 ? 'ies' : 'y'}
          {activeCount > 0 && <span className="text-green-500 ml-1">• {activeCount} active</span>}
        </p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-emerald-500">
          {formatMoney(totalValue, 'EUR')}
        </p>
        <p className="text-xs text-muted-foreground">Total pipeline</p>
      </div>
    </div>
  )
}

// Owner Group Header Component
interface OwnerGroupHeaderProps {
  owner: { id: number; full_name: string; email?: string }
  opportunityCount: number
  activeCount: number
  totalValue: number
  isExpanded: boolean
  onToggle: () => void
}

function OwnerGroupHeader({
  owner,
  opportunityCount,
  activeCount,
  totalValue,
  isExpanded,
  onToggle,
}: OwnerGroupHeaderProps) {
  return (
    <div
      className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={onToggle}
    >
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
          {owner.full_name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{owner.full_name}</h3>
        <p className="text-xs text-muted-foreground">
          {opportunityCount} opportunit{opportunityCount !== 1 ? 'ies' : 'y'}
          {activeCount > 0 && <span className="text-green-500 ml-1">• {activeCount} active</span>}
        </p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-emerald-500">
          {formatMoney(totalValue, 'EUR')}
        </p>
        <p className="text-xs text-muted-foreground">Pipeline value</p>
      </div>
    </div>
  )
}
