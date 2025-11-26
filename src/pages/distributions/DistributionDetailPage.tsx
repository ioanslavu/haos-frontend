/**
 * DistributionDetailPage - Enhanced distribution detail view with tabs
 *
 * Tabs:
 * - Overview: Basic deal info, status, revenue share, dates
 * - Catalog: Catalog items with add/remove
 * - Revenue: Revenue reports by platform
 */

import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  History,
  Loader2,
  MoreHorizontal,
  Percent,
  Plus,
  Receipt,
  Trash2,
  Music,
  TrendingUp,
  BarChart3,
  Settings,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn, formatMoney } from '@/lib/utils'
import {
  useDistribution,
  useDeleteDistribution,
  useRemoveCatalogItem,
  useUpdateDistributionStatus,
} from '@/api/hooks/useDistributions'
import {
  DEAL_STATUS_CONFIG,
  DEAL_TYPE_CONFIG,
  DISTRIBUTION_STATUS_CONFIG,
  DISTRIBUTION_PLATFORM_LABELS,
} from '@/types/distribution'
import type { DealStatus, DistributionCatalogItem, Platform } from '@/types/distribution'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import { AddCatalogItemDialog } from './components/AddCatalogItemDialog'
import { AddRevenueReportDialog } from './components/AddRevenueReportDialog'

export default function DistributionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddCatalogDialog, setShowAddCatalogDialog] = useState(false)
  const [showAddRevenueDialog, setShowAddRevenueDialog] = useState(false)
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<number | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const { data: distribution, isLoading, error } = useDistribution(Number(id))
  const deleteDistribution = useDeleteDistribution()
  const removeCatalogItem = useRemoveCatalogItem()
  const updateStatus = useUpdateDistributionStatus()

  const handleDelete = async () => {
    if (!id) return
    await deleteDistribution.mutateAsync(Number(id))
    navigate('/distributions')
  }

  const handleRemoveCatalogItem = async (catalogItemId: number) => {
    if (!id) return
    await removeCatalogItem.mutateAsync({
      distributionId: Number(id),
      catalogItemId,
    })
  }

  const handleStatusChange = async (newStatus: DealStatus) => {
    if (!id) return
    await updateStatus.mutateAsync({ id: Number(id), status: newStatus })
  }

  const toggleItemExpanded = (itemId: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const openRevenueDialog = (catalogItemId: number) => {
    setSelectedCatalogItemId(catalogItemId)
    setShowAddRevenueDialog(true)
  }

  // Calculate totals
  const totals = useMemo(() => {
    if (!distribution?.catalog_items) return { revenue: 0, tracks: 0, reports: 0 }

    let revenue = 0
    let reports = 0
    distribution.catalog_items.forEach(item => {
      revenue += parseFloat(item.total_revenue || '0')
      reports += item.revenue_reports?.length || 0
    })

    return {
      revenue,
      tracks: distribution.track_count || 0,
      reports,
    }
  }, [distribution])

  // Group revenue by platform
  const revenueByPlatform = useMemo(() => {
    if (!distribution?.catalog_items) return []

    const grouped = new Map<Platform, { platform: Platform; revenue: number; streams: number; downloads: number; count: number }>()

    distribution.catalog_items.forEach(item => {
      item.revenue_reports?.forEach(report => {
        if (!grouped.has(report.platform)) {
          grouped.set(report.platform, { platform: report.platform, revenue: 0, streams: 0, downloads: 0, count: 0 })
        }
        const group = grouped.get(report.platform)!
        group.revenue += parseFloat(report.revenue_amount || '0')
        group.streams += report.streams || 0
        group.downloads += report.downloads || 0
        group.count += 1
      })
    })

    return Array.from(grouped.values()).sort((a, b) => b.revenue - a.revenue)
  }, [distribution])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !distribution) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <p className="text-muted-foreground">Distribution not found</p>
          <Button onClick={() => navigate('/distributions')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Distributions
          </Button>
        </div>
      </AppLayout>
    )
  }

  const statusConfig = DEAL_STATUS_CONFIG[distribution.deal_status]
  const typeConfig = DEAL_TYPE_CONFIG[distribution.deal_type]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1"
            onClick={() => navigate('/distributions')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {distribution.entity.image_url ? (
                <img
                  src={distribution.entity.image_url}
                  alt={distribution.entity.display_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <span className="text-xl font-semibold">
                    {distribution.entity.display_name?.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight truncate">
                  {distribution.entity.display_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn('gap-1', typeConfig.bgColor, typeConfig.color)}>
                    {typeConfig.emoji} {typeConfig.label}
                  </Badge>
                  <Badge variant="outline" className={cn('gap-1', statusConfig.bgColor, statusConfig.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dotColor)} />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/distributions/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/entities/${distribution.entity.id}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Entity
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Distribution
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Workflow */}
        <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {(['in_negotiation', 'active', 'expired'] as DealStatus[]).map((status, idx) => {
                const config = DEAL_STATUS_CONFIG[status]
                const isActive = distribution.deal_status === status
                const isPast = (['in_negotiation', 'active', 'expired'] as DealStatus[]).indexOf(distribution.deal_status) > idx

                return (
                  <div key={status} className="flex items-center flex-1">
                    <button
                      onClick={() => handleStatusChange(status)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                        isActive && cn(config.bgColor, config.color, 'ring-2 ring-offset-2 ring-offset-background'),
                        isPast && 'opacity-50',
                        !isActive && !isPast && 'hover:bg-muted/50'
                      )}
                      disabled={updateStatus.isPending}
                    >
                      <span className={cn('h-3 w-3 rounded-full', isActive ? config.dotColor : 'bg-muted')} />
                      <span className={cn('text-sm font-medium', !isActive && 'text-muted-foreground')}>
                        {config.label}
                      </span>
                    </button>
                    {idx < 2 && (
                      <div className={cn('flex-1 h-0.5 mx-2', isPast ? 'bg-primary' : 'bg-muted')} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatMoney(totals.revenue, 'EUR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue Share</p>
                  <p className="text-lg font-semibold">
                    {parseFloat(distribution.global_revenue_share_percentage).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Music className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Catalog Items</p>
                  <p className="text-lg font-semibold">{totals.tracks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue Reports</p>
                  <p className="text-lg font-semibold">{totals.reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-12 shadow-lg">
            <TabsTrigger
              value="overview"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <Music className="h-4 w-4" />
              Catalog
              <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
                {distribution.catalog_items?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <TrendingUp className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <ClipboardList className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <History className="h-4 w-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Deal Info */}
              <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Deal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Signing Date</span>
                    <span className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {distribution.signing_date
                        ? format(new Date(distribution.signing_date), 'MMMM d, yyyy')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Includes DSPs/YouTube</span>
                    <Badge variant={distribution.includes_dsps_youtube ? 'default' : 'secondary'}>
                      {distribution.includes_dsps_youtube ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {distribution.department && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Department</span>
                      <span className="font-medium">{distribution.department_display}</span>
                    </div>
                  )}
                  {distribution.contract && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Contract</span>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        <FileText className="h-4 w-4 mr-1" />
                        {distribution.contract.contract_number}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Contact & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {distribution.contact_person && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{distribution.contact_person.name}</p>
                        <p className="text-xs text-muted-foreground">{distribution.contact_person.email}</p>
                      </div>
                    </div>
                  )}
                  {distribution.special_terms && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Special Terms</p>
                      <p className="text-sm">{distribution.special_terms}</p>
                    </div>
                  )}
                  {distribution.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{distribution.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Catalog Items</h3>
              <Button onClick={() => setShowAddCatalogDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Platforms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rev. Share</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distribution.catalog_items?.map((item) => {
                    const isExpanded = expandedItems.has(item.id)
                    const statusConfig = DISTRIBUTION_STATUS_CONFIG[item.distribution_status]

                    return (
                      <>
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover:bg-muted/50 border-white/10"
                          onClick={() => toggleItemExpanded(item.id)}
                        >
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.catalog_item_title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{item.catalog_item_type}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {item.platforms.slice(0, 4).map((platform) => {
                                const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]
                                const colorClass = PLATFORM_TEXT_COLORS[platform as keyof typeof PLATFORM_TEXT_COLORS]
                                return Icon ? (
                                  <Icon
                                    key={platform}
                                    className={cn('h-4 w-4', colorClass)}
                                    title={DISTRIBUTION_PLATFORM_LABELS[platform]}
                                  />
                                ) : null
                              })}
                              {item.platforms.length > 4 && (
                                <span className="text-xs text-muted-foreground">
                                  +{item.platforms.length - 4}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {parseFloat(item.effective_revenue_share).toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(item.total_revenue) > 0 ? (
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {formatMoney(parseFloat(item.total_revenue), 'EUR')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openRevenueDialog(item.id)}>
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Add Revenue Report
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveCatalogItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {isExpanded && item.revenue_reports && item.revenue_reports.length > 0 && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={7} className="py-2">
                              <div className="ml-8 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Revenue Reports</p>
                                {item.revenue_reports.map((report) => {
                                  const Icon = PLATFORM_ICONS[report.platform as keyof typeof PLATFORM_ICONS]
                                  const colorClass = PLATFORM_TEXT_COLORS[report.platform as keyof typeof PLATFORM_TEXT_COLORS]
                                  return (
                                    <div
                                      key={report.id}
                                      className="flex items-center gap-4 py-1 px-2 rounded-lg hover:bg-muted/50"
                                    >
                                      {Icon && <Icon className={cn('h-4 w-4', colorClass)} />}
                                      <span className="text-sm">{report.platform_display}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(report.reporting_period + '-01'), 'MMM yyyy')}
                                      </span>
                                      <span className="ml-auto text-sm font-medium text-green-600 dark:text-green-400">
                                        {formatMoney(parseFloat(report.revenue_amount), report.currency)}
                                      </span>
                                      {report.streams && (
                                        <span className="text-xs text-muted-foreground">
                                          {report.streams.toLocaleString()} streams
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>

              {(!distribution.catalog_items || distribution.catalog_items.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">
                  <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No catalog items yet</p>
                  <Button
                    variant="link"
                    onClick={() => setShowAddCatalogDialog(true)}
                    className="mt-2"
                  >
                    Add your first catalog item
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <h3 className="text-lg font-semibold">Revenue by Platform</h3>

            {revenueByPlatform.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {revenueByPlatform.map(({ platform, revenue, streams, downloads, count }) => {
                  const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]
                  const colorClass = PLATFORM_TEXT_COLORS[platform as keyof typeof PLATFORM_TEXT_COLORS]

                  return (
                    <Card key={platform} className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            {Icon && <Icon className={cn('h-5 w-5', colorClass)} />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{DISTRIBUTION_PLATFORM_LABELS[platform]}</p>
                            <p className="text-xs text-muted-foreground">{count} report{count !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {formatMoney(revenue, 'EUR')}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {streams > 0 && <span>{streams.toLocaleString()} streams</span>}
                              {downloads > 0 && <span>{downloads.toLocaleString()} downloads</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No revenue reports yet</p>
                  <p className="text-sm">Add revenue reports to catalog items to see analytics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invoices Tab (Coming Soon) */}
          <TabsContent value="invoices" className="space-y-4">
            <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Invoices Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Track and manage invoices related to this distribution deal. Generate, send, and reconcile payments all in one place.
                </p>
                <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  In Development
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab (Coming Soon) */}
          <TabsContent value="contracts" className="space-y-4">
            <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Contracts Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Manage distribution agreements, amendments, and legal documents. Link contracts directly to this deal for easy access.
                </p>
                <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  In Development
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab (Coming Soon) */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tasks Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Track distribution-related tasks and deadlines. Create checklists for releases, coordinate with teams, and monitor progress.
                </p>
                <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  In Development
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab (Coming Soon) */}
          <TabsContent value="audit" className="space-y-4">
            <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <History className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Audit Log Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  View complete history of changes to this distribution. Track who made changes, when, and what was modified for compliance.
                </p>
                <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  In Development
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Distribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this distribution deal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Catalog Item Dialog */}
      <AddCatalogItemDialog
        open={showAddCatalogDialog}
        onOpenChange={setShowAddCatalogDialog}
        distributionId={Number(id)}
      />

      {/* Add Revenue Report Dialog */}
      {selectedCatalogItemId && (
        <AddRevenueReportDialog
          open={showAddRevenueDialog}
          onOpenChange={(open) => {
            setShowAddRevenueDialog(open)
            if (!open) setSelectedCatalogItemId(null)
          }}
          distributionId={Number(id)}
          catalogItemId={selectedCatalogItemId}
        />
      )}
    </AppLayout>
  )
}
