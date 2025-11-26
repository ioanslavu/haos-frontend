/**
 * Campaigns Page - Main campaigns list with table/kanban views
 *
 * Views:
 * - All: Active + Other campaigns (default, table or kanban)
 * - By Client: Campaigns grouped by client
 * - By Platform: Subcampaigns grouped by platform
 *
 * Features:
 * - Toggle between Table and Kanban views
 * - Infinite scrolling
 * - Filters (status, period, type)
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
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useInfiniteCampaigns, useCampaignStats } from '@/api/hooks/useCampaigns'
import { cn } from '@/lib/utils'
import type {
  Campaign,
  CampaignFilters,
  SubCampaign,
  Platform,
} from '@/types/campaign'
import {
  ACTIVE_STATUSES,
  PLATFORM_CONFIG,
} from '@/types/campaign'
import { CampaignsTable } from './components/CampaignsTable'
import { CampaignsKanban } from './components/CampaignsKanban'
import { ViewToggle, ViewType } from './components/ViewToggle'
import { ClientGroupHeader, PlatformGroupHeader } from './components/GroupHeader'
import { CreateCampaignModal } from './components/CreateCampaignModal'
import { CampaignFiltersSheet } from './components/CampaignFiltersSheet'
import { useInView } from 'react-intersection-observer'

type TabMode = 'all' | 'by-client' | 'by-platform'

export default function CampaignsPage() {
  const navigate = useNavigate()
  const [tabMode, setTabMode] = useState<TabMode>('all')
  const [viewType, setViewType] = useState<ViewType>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<CampaignFilters>({})

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])
  const [expandedClients, setExpandedClients] = useState<Set<number>>(new Set())
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set())

  // Infinite scroll ref
  const { ref: loadMoreRef, inView } = useInView()

  // Build filters with search
  const activeFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
    ordering: '-created_at',
  }), [filters, debouncedSearch])

  // Fetch campaigns with infinite scroll
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCampaigns(activeFilters)

  // Fetch stats for header
  const { data: stats } = useCampaignStats(filters)

  // Load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten pages into single array
  const campaigns = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.results)
  }, [data])

  // Split into active and other campaigns
  const { activeCampaigns, otherCampaigns } = useMemo(() => {
    const active: Campaign[] = []
    const other: Campaign[] = []

    campaigns.forEach(campaign => {
      if (ACTIVE_STATUSES.includes(campaign.status)) {
        active.push(campaign)
      } else {
        other.push(campaign)
      }
    })

    // Sort by created_at desc
    const sortByDate = (a: Campaign, b: Campaign) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()

    return {
      activeCampaigns: active.sort(sortByDate),
      otherCampaigns: other.sort(sortByDate),
    }
  }, [campaigns])

  // Group by client with budget summaries
  const campaignsByClient = useMemo(() => {
    const grouped = new Map<number, {
      client: Campaign['client']
      campaigns: Campaign[]
      totalBudget: number
      totalSpent: number
      activeCount: number
    }>()

    campaigns.forEach(campaign => {
      if (!campaign.client?.id) return

      const clientId = campaign.client.id
      if (!grouped.has(clientId)) {
        grouped.set(clientId, {
          client: campaign.client,
          campaigns: [],
          totalBudget: 0,
          totalSpent: 0,
          activeCount: 0,
        })
      }
      const group = grouped.get(clientId)!
      group.campaigns.push(campaign)
      group.totalBudget += parseFloat(campaign.total_budget || '0')
      group.totalSpent += parseFloat(campaign.total_spent || '0')
      if (ACTIVE_STATUSES.includes(campaign.status)) {
        group.activeCount++
      }
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount
      return b.totalBudget - a.totalBudget
    })
  }, [campaigns])

  // Group subcampaigns by platform
  const subcampaignsByPlatform = useMemo(() => {
    const grouped = new Map<Platform, {
      platform: Platform
      subcampaigns: Array<SubCampaign & { campaignName: string; campaignId: number; clientName: string }>
      totalBudget: number
      totalSpent: number
      activeCount: number
    }>()

    campaigns.forEach(campaign => {
      campaign.subcampaigns?.forEach(sub => {
        if (!grouped.has(sub.platform)) {
          grouped.set(sub.platform, {
            platform: sub.platform,
            subcampaigns: [],
            totalBudget: 0,
            totalSpent: 0,
            activeCount: 0,
          })
        }
        const group = grouped.get(sub.platform)!
        group.subcampaigns.push({
          ...sub,
          campaignName: campaign.name,
          campaignId: campaign.id,
          clientName: campaign.client?.display_name || 'Unknown',
        })
        group.totalBudget += parseFloat(sub.budget || '0')
        group.totalSpent += parseFloat(sub.spent || '0')
        if (sub.status === 'active') {
          group.activeCount++
        }
      })
    })

    return Array.from(grouped.values()).sort((a, b) => {
      if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount
      return b.totalBudget - a.totalBudget
    })
  }, [campaigns])

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

  const togglePlatformExpanded = (platform: string) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }

  const handleCampaignClick = (id: number) => {
    navigate(`/campaigns/${id}`)
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

  // Only show full-page loader on initial load (no data yet)
  // During filter changes, keep UI mounted and show inline loading
  if (isLoading && campaigns.length === 0) {
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
                <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{stats?.total || campaigns.length}</span>
                  {stats && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{stats.by_status?.lead || 0} lead</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{stats.by_status?.negotiation || 0} neg</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{stats.by_status?.confirmed || 0} conf</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-green-500 font-medium">{stats.by_status?.active || 0} active</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{stats.by_status?.completed || 0} done</span>
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
                    onClick={() => setTabMode('by-platform')}
                    className={cn(
                      "h-8 px-3 gap-1.5 rounded-lg text-xs",
                      tabMode === 'by-platform' && "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Platform
                  </Button>
                </div>
              </div>

              {/* View Toggle */}
              {tabMode !== 'by-platform' && (
                <ViewToggle value={viewType} onChange={setViewType} />
              )}

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

              {/* New Campaign */}
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Sheet */}
        <CampaignFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Content based on tab mode */}
        {tabMode === 'all' && (
          <div className="space-y-6">
            {/* Active Campaigns */}
            {activeCampaigns.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Active Campaigns
                  <Badge variant="secondary" className="ml-2">{activeCampaigns.length}</Badge>
                </h2>
                {viewType === 'table' ? (
                  <CampaignsTable
                    campaigns={activeCampaigns}
                    onCampaignClick={handleCampaignClick}
                    onClientClick={handleClientClick}
                  />
                ) : (
                  <CampaignsKanban
                    campaigns={activeCampaigns}
                    onCampaignClick={handleCampaignClick}
                    onClientClick={handleClientClick}
                  />
                )}
              </div>
            )}

            {/* Other Campaigns */}
            {otherCampaigns.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                  Other Campaigns
                  <Badge variant="outline" className="ml-2">{otherCampaigns.length}</Badge>
                </h2>
                {viewType === 'table' ? (
                  <CampaignsTable
                    campaigns={otherCampaigns}
                    onCampaignClick={handleCampaignClick}
                    onClientClick={handleClientClick}
                  />
                ) : (
                  <CampaignsKanban
                    campaigns={otherCampaigns}
                    onCampaignClick={handleCampaignClick}
                    onClientClick={handleClientClick}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {tabMode === 'by-client' && (
          <div className="space-y-3">
            {campaignsByClient.map(({ client, campaigns: clientCampaigns, totalBudget, totalSpent, activeCount }) => {
              const isExpanded = expandedClients.has(client.id)

              return (
                <Card key={client.id} className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                  <ClientGroupHeader
                    client={client}
                    campaignCount={clientCampaigns.length}
                    activeCount={activeCount}
                    totalBudget={totalBudget}
                    totalSpent={totalSpent}
                    isExpanded={isExpanded}
                    onToggle={() => toggleClientExpanded(client.id)}
                    onViewClient={() => navigate(`/entities/${client.id}`)}
                  />

                  {isExpanded && (
                    <div className="border-t border-white/10">
                      {viewType === 'table' ? (
                        <CampaignsTable
                          campaigns={clientCampaigns}
                          onCampaignClick={handleCampaignClick}
                          onClientClick={handleClientClick}
                        />
                      ) : (
                        <div className="p-4">
                          <CampaignsKanban
                            campaigns={clientCampaigns}
                            onCampaignClick={handleCampaignClick}
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

        {tabMode === 'by-platform' && (
          <div className="space-y-3">
            {subcampaignsByPlatform.length === 0 ? (
              <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">No subcampaigns yet</h3>
                <p className="text-muted-foreground">
                  Create campaigns with platform-specific subcampaigns to see them here.
                </p>
              </Card>
            ) : (
              subcampaignsByPlatform.map(({ platform, subcampaigns, totalBudget, totalSpent, activeCount }) => {
                const isExpanded = expandedPlatforms.has(platform)
                const platformConfig = PLATFORM_CONFIG[platform]

                return (
                  <Card key={platform} className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                    <PlatformGroupHeader
                      platform={platform}
                      subcampaignCount={subcampaigns.length}
                      activeCount={activeCount}
                      totalBudget={totalBudget}
                      totalSpent={totalSpent}
                      isExpanded={isExpanded}
                      onToggle={() => togglePlatformExpanded(platform)}
                    />

                    {isExpanded && (
                      <div className="border-t border-white/10">
                        <PlatformSubcampaignsTable
                          subcampaigns={subcampaigns}
                          onCampaignClick={handleCampaignClick}
                        />
                      </div>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Empty State */}
        {campaigns.length === 0 && !isLoading && (
          <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'Create your first campaign to get started'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </AppLayout>
  )
}

// Platform Subcampaigns Table Component
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { formatMoney } from '@/lib/utils'
import {
  SERVICE_TYPE_CONFIG,
} from '@/types/campaign'

interface PlatformSubcampaignsTableProps {
  subcampaigns: Array<SubCampaign & { campaignName: string; campaignId: number; clientName: string }>
  onCampaignClick: (id: number) => void
}

function PlatformSubcampaignsTable({ subcampaigns, onCampaignClick }: PlatformSubcampaignsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-white/10">
          <TableHead>Campaign</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Service</TableHead>
          <TableHead className="text-right">Budget</TableHead>
          <TableHead className="text-right">Spent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subcampaigns.map((sub) => {
          const serviceConfig = SERVICE_TYPE_CONFIG[sub.service_type]
          const budget = parseFloat(sub.budget || '0')
          const spent = parseFloat(sub.spent || '0')
          const utilization = budget > 0 ? (spent / budget) * 100 : 0

          return (
            <TableRow
              key={sub.id}
              className="cursor-pointer hover:bg-muted/50 border-white/10"
              onClick={() => onCampaignClick(sub.campaignId)}
            >
              <TableCell className="font-medium">{sub.campaignName}</TableCell>
              <TableCell className="text-muted-foreground">{sub.clientName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {serviceConfig?.emoji} {sub.service_type_display || serviceConfig?.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {budget > 0 ? formatMoney(budget, sub.currency || 'EUR') : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-muted-foreground">
                    {spent > 0 ? formatMoney(spent, sub.currency || 'EUR') : '-'}
                  </span>
                  {budget > 0 && (
                    <div className="flex items-center gap-2 w-20">
                      <Progress
                        value={utilization}
                        className={cn(
                          "h-1",
                          utilization > 100 && "[&>div]:bg-red-500"
                        )}
                      />
                      <span className={cn(
                        "text-xs",
                        utilization > 100 ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {utilization.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
