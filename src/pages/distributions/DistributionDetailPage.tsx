/**
 * DistributionDetailPage - Enhanced distribution detail view with tabs
 *
 * Tabs:
 * - Overview: Basic deal info, status, revenue share, dates (with inline editing)
 * - Catalog: Catalog items with add/remove
 * - Revenue: Revenue reports by platform
 * - Tasks: Distribution-related tasks
 */

import { useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  DollarSign,
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
  User,
  X,
  LayoutGrid,
  List,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { cn, formatMoney, formatDate, getInitials } from '@/lib/utils'
import {
  useDistribution,
  useDeleteDistribution,
  useRemoveCatalogItem,
  useRemoveSong,
  useUpdateDistributionStatus,
  useUpdateDistribution,
} from '@/api/hooks/useDistributions'
import { useEntity, useCreateContactPerson } from '@/api/hooks/useEntities'
import {
  DEAL_STATUS_CONFIG,
  DEAL_TYPE_CONFIG,
  DISTRIBUTION_STATUS_CONFIG,
  DISTRIBUTION_PLATFORM_LABELS,
} from '@/types/distribution'
import type { DealStatus, DealType, DistributionCatalogItem, DistributionSong, Platform } from '@/types/distribution'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import { InlineSongAdd } from './components/InlineSongAdd'
import { SongCard } from './components/SongCard'
import { AddRevenueReportDialog } from './components/AddRevenueReportDialog'
import { AssignmentSection } from './components/AssignmentSection'
import { DistributionTasksTab } from './components/DistributionTasksTab'
import { DistributionInvoicesTab } from './components/DistributionInvoicesTab'
import { DistributionContractsTab } from './components/DistributionContractsTab'
import { DistributionNotesSection } from './components/DistributionNotesSection'
import { NotesSection } from '@/components/notes/NotesSection'

export default function DistributionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddSongInline, setShowAddSongInline] = useState(false)
  const [showAddRevenueDialog, setShowAddRevenueDialog] = useState(false)
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<number | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [expandedSongIds, setExpandedSongIds] = useState<Set<number>>(new Set())
  const [songsViewMode, setSongsViewMode] = useState<'cards' | 'table'>('cards')

  // Inline editing states
  const [signingDateOpen, setSigningDateOpen] = useState(false)
  const [isSavingField, setIsSavingField] = useState<string | null>(null)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  const { data: distribution, isLoading, error } = useDistribution(Number(id))
  const deleteDistribution = useDeleteDistribution()
  const removeCatalogItem = useRemoveCatalogItem()
  const removeSong = useRemoveSong()
  const updateStatus = useUpdateDistributionStatus()
  const updateDistribution = useUpdateDistribution()

  // Fetch entity for contact persons
  const { data: clientEntity } = useEntity(distribution?.entity?.id || 0, !!distribution?.entity?.id)
  const createContactPerson = useCreateContactPerson()
  const contactPersons = clientEntity?.contact_persons || []

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

  const handleRemoveSong = async (songId: number) => {
    if (!id) return
    await removeSong.mutateAsync({
      distributionId: Number(id),
      songId,
    })
  }

  const handleStatusChange = async (newStatus: DealStatus) => {
    if (!id) return
    await updateStatus.mutateAsync({ id: Number(id), status: newStatus })
  }

  // Inline field update handlers
  const handleSaveSigningDate = async (date: Date | undefined) => {
    if (!id || !date) return
    setIsSavingField('signing_date')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { signing_date: format(date, 'yyyy-MM-dd') },
      })
      setSigningDateOpen(false)
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveDealType = async (dealType: DealType) => {
    if (!id) return
    setIsSavingField('deal_type')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { deal_type: dealType },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveIncludesDsps = async (checked: boolean) => {
    if (!id) return
    setIsSavingField('includes_dsps')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { includes_dsps: checked },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveIncludesYoutube = async (checked: boolean) => {
    if (!id) return
    setIsSavingField('includes_youtube')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { includes_youtube: checked },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveRevenueShare = async (value: string) => {
    if (!id) return
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return
    setIsSavingField('revenue_share')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { global_revenue_share_percentage: value },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleChangeContactPerson = async (contactPersonId: string) => {
    if (!id) return
    setIsSavingField('contact_person')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { contact_person: contactPersonId === 'none' ? null : parseInt(contactPersonId) },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleCreateContactPerson = async () => {
    if (!distribution?.entity?.id || !newContactName.trim()) return
    setIsSavingField('contact_person')
    try {
      const newContact = await createContactPerson.mutateAsync({
        entityId: distribution.entity.id,
        data: {
          name: newContactName.trim(),
          email: newContactEmail.trim() || undefined,
          phone: newContactPhone.trim() || undefined,
        },
      })
      // Auto-select the new contact
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { contact_person: newContact.id },
      })
      setShowCreateContact(false)
      setNewContactName('')
      setNewContactEmail('')
      setNewContactPhone('')
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveNotes = async (notes: string) => {
    if (!id) return
    await updateDistribution.mutateAsync({
      id: Number(id),
      data: { notes },
    })
  }

  const handleSaveSpecialTerms = async (specialTerms: string) => {
    if (!id) return
    await updateDistribution.mutateAsync({
      id: Number(id),
      data: { special_terms: specialTerms },
    })
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

  const toggleSongExpanded = (songId: number) => {
    setExpandedSongIds(prev => {
      const next = new Set(prev)
      if (next.has(songId)) {
        next.delete(songId)
      } else {
        next.add(songId)
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
    if (!distribution) return { revenue: 0, tracks: 0, reports: 0 }

    let revenue = 0
    let reports = 0

    // Count from catalog_items (legacy)
    distribution.catalog_items?.forEach(item => {
      revenue += parseFloat(item.total_revenue || '0')
      reports += item.revenue_reports?.length || 0
    })

    return {
      revenue,
      tracks: distribution.songs?.length || distribution.track_count || 0,
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
        {/* Back Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/distributions')}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Distributions
        </Button>

        {/* Compact Header Card */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
          <div className="p-5 space-y-4">
            {/* Row 1: Title, Entity, Metadata, Actions */}
            <div className="flex items-center justify-between gap-6">
              {/* Left: Title and Entity */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold truncate">
                      <Link
                        to={`/entities/${distribution.entity.id}`}
                        className="hover:underline"
                      >
                        {distribution.entity.display_name}
                      </Link>
                    </h1>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {typeConfig.emoji} {typeConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Entity Link with Avatar */}
                    <Link
                      to={`/entities/${distribution.entity.id}`}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      {distribution.entity.image_url ? (
                        <img
                          src={distribution.entity.image_url}
                          alt={distribution.entity.display_name}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      <span className="font-medium">{distribution.entity.kind === 'PJ' ? 'Legal Entity' : 'Individual'}</span>
                    </Link>
                    <span className="text-muted-foreground/50">•</span>
                    {/* Signing Date - Editable */}
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <Popover open={signingDateOpen} onOpenChange={setSigningDateOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
                              !distribution.signing_date && "text-amber-500"
                            )}
                            disabled={isSavingField === 'signing_date'}
                          >
                            {isSavingField === 'signing_date' ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : distribution.signing_date ? (
                              formatDate(distribution.signing_date)
                            ) : (
                              'Set Date'
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={distribution.signing_date ? new Date(distribution.signing_date) : undefined}
                            onSelect={handleSaveSigningDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <span className="text-muted-foreground/50">•</span>
                    {/* Contact Person - Editable */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
                            !distribution.contact_person && "text-amber-500"
                          )}
                          disabled={isSavingField === 'contact_person'}
                        >
                          <User className="h-3.5 w-3.5" />
                          {isSavingField === 'contact_person' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : distribution.contact_person ? (
                            <span>{distribution.contact_person.name}</span>
                          ) : (
                            <span>Contact</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="start">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Contact Person</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowCreateContact(true)}
                              className="h-6 text-xs px-2"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              New
                            </Button>
                          </div>
                          {showCreateContact ? (
                            <div className="space-y-2">
                              <Input
                                placeholder="Name *"
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Input
                                placeholder="Email"
                                type="email"
                                value={newContactEmail}
                                onChange={(e) => setNewContactEmail(e.target.value)}
                                className="h-8 text-sm"
                              />
                              <Input
                                placeholder="Phone"
                                value={newContactPhone}
                                onChange={(e) => setNewContactPhone(e.target.value)}
                                className="h-8 text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setShowCreateContact(false)
                                    setNewContactName('')
                                    setNewContactEmail('')
                                    setNewContactPhone('')
                                  }}
                                  className="h-7 text-xs flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleCreateContactPerson}
                                  disabled={!newContactName.trim() || createContactPerson.isPending}
                                  className="h-7 text-xs flex-1"
                                >
                                  {createContactPerson.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Create'
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {distribution.contact_person ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{distribution.contact_person.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleChangeContactPerson('none')}
                                      disabled={isSavingField === 'contact_person'}
                                      title="Remove contact person"
                                    >
                                      {isSavingField === 'contact_person' ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  {distribution.contact_person.email && (
                                    <p className="text-xs text-muted-foreground">{distribution.contact_person.email}</p>
                                  )}
                                </div>
                              ) : null}
                              {contactPersons.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    {distribution.contact_person ? 'Change to:' : 'Select:'}
                                  </p>
                                  <div className="max-h-32 overflow-y-auto space-y-1">
                                    {contactPersons
                                      .filter(cp => cp.id !== distribution.contact_person?.id)
                                      .map(cp => (
                                        <button
                                          key={cp.id}
                                          onClick={() => handleChangeContactPerson(String(cp.id))}
                                          className="w-full text-left p-2 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                                          disabled={isSavingField === 'contact_person'}
                                        >
                                          <p className="font-medium">{cp.name}</p>
                                          {cp.email && (
                                            <p className="text-xs text-muted-foreground">{cp.email}</p>
                                          )}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                              {!distribution.contact_person && contactPersons.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  No contacts yet. Create one above.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground/50">•</span>
                    {/* Contract Status Badge */}
                    {distribution.contract ? (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
                      >
                        <FileText className="h-3 w-3" />
                        {distribution.contract.contract_number}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 border-muted-foreground/30 text-muted-foreground/60"
                      >
                        <FileText className="h-3 w-3" />
                        No Contract
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Status Flow & Actions */}
              <div className="flex items-center gap-3">
                {/* Status Workflow Pills */}
                <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
                  {(['in_negotiation', 'active', 'expired'] as DealStatus[]).map((status, idx) => {
                    const config = DEAL_STATUS_CONFIG[status]
                    const isActive = distribution.deal_status === status
                    const isPast = (['in_negotiation', 'active', 'expired'] as DealStatus[]).indexOf(distribution.deal_status) > idx

                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isActive && cn(config.bgColor, config.color),
                          isPast && 'opacity-40',
                          !isActive && !isPast && 'text-muted-foreground hover:bg-muted/50'
                        )}
                        disabled={updateStatus.isPending}
                      >
                        <span className={cn('h-2 w-2 rounded-full', isActive ? config.dotColor : 'bg-muted-foreground/30')} />
                        {config.label}
                      </button>
                    )
                  })}
                </div>

                {/* Actions Dropdown */}
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

            {/* Row 2: Stats Inline */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/20">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue</p>
                    <p className="text-sm font-semibold">
                      {formatMoney(totals.revenue, 'EUR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-500/20">
                    <Percent className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Share</p>
                    <p className="text-sm font-semibold">
                      {parseFloat(distribution.global_revenue_share_percentage).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-500/20">
                    <Music className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Catalog</p>
                    <p className="text-sm font-semibold">{totals.tracks}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-orange-500/20">
                    <BarChart3 className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reports</p>
                    <p className="text-sm font-semibold">{totals.reports}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

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
              Songs
              <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
                {distribution.songs?.length || 0}
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
              {/* Deal Info - Editable */}
              <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Deal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Deal Type - Editable */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deal Type</span>
                    <Select
                      value={distribution.deal_type}
                      onValueChange={(value) => handleSaveDealType(value as DealType)}
                      disabled={isSavingField === 'deal_type'}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DEAL_TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.emoji} {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Revenue Share - Editable */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenue Share</span>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={distribution.global_revenue_share_percentage || ''}
                        onChange={(e) => {
                          // Debounce or save on blur
                        }}
                        onBlur={(e) => handleSaveRevenueShare(e.target.value)}
                        className="h-8 w-20 text-right"
                        disabled={isSavingField === 'revenue_share'}
                      />
                    </div>
                  </div>
                  {/* Includes DSPs - Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includes-dsps" className="text-sm text-muted-foreground">
                      Includes DSPs
                    </Label>
                    <Switch
                      id="includes-dsps"
                      checked={distribution.includes_dsps}
                      onCheckedChange={handleSaveIncludesDsps}
                      disabled={isSavingField === 'includes_dsps'}
                    />
                  </div>
                  {/* Includes YouTube - Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includes-youtube" className="text-sm text-muted-foreground">
                      Includes YouTube
                    </Label>
                    <Switch
                      id="includes-youtube"
                      checked={distribution.includes_youtube}
                      onCheckedChange={handleSaveIncludesYoutube}
                      disabled={isSavingField === 'includes_youtube'}
                    />
                  </div>
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

              {/* Special Terms - Editable with Autosave */}
              <NotesSection
                notes={distribution.special_terms}
                onSave={handleSaveSpecialTerms}
                isLoading={isLoading}
                title="Special Terms"
                placeholder="Add special terms for this deal..."
              />
            </div>

            {/* Team Assignments */}
            <AssignmentSection
              distributionId={Number(id)}
              assignments={distribution.assignments || []}
              createdBy={distribution.created_by}
            />

            {/* Notes Section - with Autosave */}
            <DistributionNotesSection
              notes={distribution.notes}
              onSave={handleSaveNotes}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Songs Tab */}
          <TabsContent value="catalog" className="space-y-4">
            {/* Inline Add Form - shown at top when triggered */}
            {showAddSongInline && (
              <InlineSongAdd
                distributionId={Number(id)}
                onClose={() => setShowAddSongInline(false)}
              />
            )}

            {(!distribution.songs || distribution.songs.length === 0) ? (
              <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">No songs yet</h4>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                  Add songs to this distribution to track their platforms and status.
                </p>
                {!showAddSongInline && (
                  <Button onClick={() => setShowAddSongInline(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Song
                  </Button>
                )}
              </Card>
            ) : (
              <>
                {/* Header with count, view toggle, and add button */}
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {distribution.songs.length} Song{distribution.songs.length !== 1 ? 's' : ''}
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
                      <button
                        onClick={() => setSongsViewMode('cards')}
                        className={cn(
                          'p-1.5 rounded-md transition-colors',
                          songsViewMode === 'cards'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Card view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSongsViewMode('table')}
                        className={cn(
                          'p-1.5 rounded-md transition-colors',
                          songsViewMode === 'table'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Table view"
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                    {!showAddSongInline && (
                      <Button onClick={() => setShowAddSongInline(true)} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Song
                      </Button>
                    )}
                  </div>
                </div>

                {/* Card View */}
                {songsViewMode === 'cards' && (
                  <div className="space-y-3">
                    {distribution.songs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        distributionId={Number(id)}
                        isExpanded={expandedSongIds.has(song.id)}
                        onToggleExpand={() => toggleSongExpanded(song.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Table View */}
                {songsViewMode === 'table' && (
                  <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-white/10">
                          <TableHead>Song</TableHead>
                          <TableHead>Artist</TableHead>
                          <TableHead>ISRC</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Platforms</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {distribution.songs.map((song) => {
                          const statusConfig = DISTRIBUTION_STATUS_CONFIG[song.distribution_status]

                          return (
                            <TableRow
                              key={song.id}
                              className="hover:bg-muted/50 border-white/10 cursor-pointer"
                              onClick={() => {
                                setSongsViewMode('cards')
                                setExpandedSongIds(new Set([song.id]))
                              }}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Music className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{song.song_name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{song.artist_name}</span>
                              </TableCell>
                              <TableCell>
                                {song.isrc ? (
                                  <span className="text-xs font-mono text-muted-foreground">{song.isrc}</span>
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {song.client_type ? (
                                  <Badge variant="outline" className="text-xs">
                                    {song.client_type}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {song.platforms.slice(0, 4).map((platform) => {
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
                                  {song.platforms.length > 4 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{song.platforms.length - 4}
                                    </span>
                                  )}
                                  {song.platforms.length === 0 && (
                                    <span className="text-muted-foreground/50">—</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color)}>
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSongsViewMode('cards')
                                        setExpandedSongIds(new Set([song.id]))
                                      }}
                                    >
                                      <Settings className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveSong(song.id)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </>
            )}
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

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <DistributionInvoicesTab distributionId={Number(id)} />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-4">
            <DistributionContractsTab distribution={distribution} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <DistributionTasksTab distributionId={Number(id)} />
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
