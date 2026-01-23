/**
 * SubCampaignsList - List of subcampaigns (platforms) for a campaign
 *
 * Shows each platform with:
 * - Budget and spent amounts
 * - Payment method
 * - Songs and artists
 * - Actions (edit, update budget/spent, delete)
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Music2,
  Trash2,
  User,
  CreditCard,
  X,
  Receipt,
  Target,
  Plus,
  ClipboardList,
} from 'lucide-react'
import { HiSquares2X2 } from 'react-icons/hi2'
import { PLATFORM_ICONS, PLATFORM_COLORS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useSubCampaigns,
  useCreateSubCampaign,
  useUpdateSubCampaign,
  useDeleteSubCampaign,
  useSubCampaignInvoices,
} from '@/api/hooks/useCampaigns'
import { SubCampaignInvoiceDialog } from './SubCampaignInvoiceDialog'
import { SubCampaignInvoiceList } from './SubCampaignInvoiceList'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { SubCampaign, Platform, ServiceType, PaymentMethod, KPIType, KPITarget } from '@/types/campaign'
import {
  PLATFORM_CONFIG,
  PAYMENT_METHOD_CONFIG,
  SERVICE_TYPE_CONFIG,
  KPI_CONFIG,
  KPI_CATEGORIES,
  PLATFORM_DEFAULT_KPIS,
} from '@/types/campaign'

// Platforms in display order
const PLATFORMS: Platform[] = [
  'spotify', 'apple_music', 'youtube', 'tiktok', 'meta',
  'google', 'amazon_music', 'deezer', 'soundcloud',
  'twitter', 'snapchat', 'pinterest', 'linkedin', 'other',
]

interface SubCampaignsListProps {
  campaignId: number
  campaignName: string
  showAddForm?: boolean
  onAddFormClose?: () => void
}

export function SubCampaignsList({ campaignId, campaignName, showAddForm = false, onAddFormClose }: SubCampaignsListProps) {
  const { data, isLoading } = useSubCampaigns(campaignId)
  const subcampaigns = data?.results || []

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Inline Add Platform - Only shown when triggered */}
      {showAddForm && (
        <InlineAddPlatform campaignId={campaignId} onClose={onAddFormClose} />
      )}

      {subcampaigns.length === 0 ? (
        <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <HiSquares2X2 className="h-8 w-8 text-purple-500" />
          </div>
          <h4 className="font-semibold mb-2">No platforms yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Add advertising platforms to allocate budget and track spending across different channels.
          </p>
        </Card>
      ) : (
        <>
          <h3 className="font-semibold text-sm text-muted-foreground">
            {subcampaigns.length} Platform{subcampaigns.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-3">
            {subcampaigns.map((subcampaign) => (
              <SubCampaignCard
                key={subcampaign.id}
                subcampaign={subcampaign}
                campaignId={campaignId}
                campaignName={campaignName}
                isExpanded={expandedIds.has(subcampaign.id)}
                onToggleExpand={() => toggleExpanded(subcampaign.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Service type groups for better organization
const SERVICE_TYPE_GROUPS = [
  { label: 'Ads', types: ['ppc', 'dsp'] as ServiceType[] },
  { label: 'Content', types: ['content', 'ugc', 'social'] as ServiceType[] },
  { label: 'Promo', types: ['influencer', 'playlist', 'pr', 'radio'] as ServiceType[] },
  { label: 'Marketing', types: ['email', 'seo', 'other'] as ServiceType[] },
]

// Inline Add Platform Component
function InlineAddPlatform({ campaignId, onClose }: { campaignId: number; onClose?: () => void }) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null)
  const [platformOther, setPlatformOther] = useState('')

  const createSubCampaign = useCreateSubCampaign()

  const handleSubmit = async () => {
    if (!selectedPlatform || !selectedServiceType) return
    if (selectedPlatform === 'other' && !platformOther.trim()) return

    try {
      await createSubCampaign.mutateAsync({
        campaignId,
        data: {
          platform: selectedPlatform,
          platform_other: selectedPlatform === 'other' ? platformOther.trim() : undefined,
          service_type: selectedServiceType,
        },
      })
      // Reset and close
      setSelectedPlatform(null)
      setSelectedServiceType(null)
      setPlatformOther('')
      onClose?.()
    } catch {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    setSelectedPlatform(null)
    setSelectedServiceType(null)
    setPlatformOther('')
    onClose?.()
  }

  const canSubmit =
    selectedPlatform &&
    selectedServiceType &&
    (selectedPlatform !== 'other' || platformOther.trim())

  return (
    <Card className="p-4 rounded-xl border-primary/20 bg-primary/5 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Add new platform</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Platform Icons Row */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Platform</p>
          <div className="flex flex-wrap gap-1">
            {PLATFORMS.map((platform) => {
              const Icon = PLATFORM_ICONS[platform]
              const config = PLATFORM_CONFIG[platform]
              const isSelected = selectedPlatform === platform
              const brandColor = PLATFORM_COLORS[platform]
              const textColor = PLATFORM_TEXT_COLORS[platform]

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(platform)
                    if (platform !== 'other') {
                      setPlatformOther('')
                    }
                  }}
                  title={config.label}
                  className={cn(
                    'p-2 rounded-lg border transition-all',
                    textColor,
                    isSelected
                      ? brandColor?.replace(textColor, '') || 'bg-primary/10 border-primary/30'
                      : 'border-transparent hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              )
            })}
          </div>
          {/* Other Platform Input */}
          {selectedPlatform === 'other' && (
            <Input
              placeholder="Enter platform name..."
              value={platformOther}
              onChange={(e) => setPlatformOther(e.target.value)}
              className="h-8 max-w-xs mt-2 text-sm"
              autoFocus
            />
          )}
        </div>

        {/* Service Type Selection */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Service type</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SERVICE_TYPE_GROUPS.map((group) => (
              <div key={group.label} className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground/60 mr-1">{group.label}:</span>
                {group.types.map((type) => {
                  const config = SERVICE_TYPE_CONFIG[type]
                  const isSelected = selectedServiceType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedServiceType(type)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {config.label.replace(' Advertising', '').replace(' Marketing', '').replace(' Campaign', '').replace(' Distribution', '').replace(' Optimization', '').replace(' Pitching', '').replace(' Plugging', '').replace(' Creation', '').replace(' Content', '').replace(' Management', '')}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || createSubCampaign.isPending}
          >
            {createSubCampaign.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add Platform'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface SubCampaignCardProps {
  subcampaign: SubCampaign
  campaignId: number
  campaignName: string
  isExpanded: boolean
  onToggleExpand: () => void
}

function SubCampaignCard({
  subcampaign,
  campaignId,
  campaignName,
  isExpanded,
  onToggleExpand,
}: SubCampaignCardProps) {
  const isAdminOrManager = useAuthStore((state) => state.isAdminOrManager)
  const canViewSensitiveData = isAdminOrManager()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showTaskPanel, setShowTaskPanel] = useState(false)

  // Prefetch invoice count for header display
  const { data: invoices } = useSubCampaignInvoices(campaignId, subcampaign.id, isExpanded)

  // Inline editing state for financial fields
  type EditableField = 'client_value' | 'budget' | 'spent' | 'internal_cost' | 'revenue_generated' | 'revenue_share_percentage' | null
  const [editingField, setEditingField] = useState<EditableField>(null)

  // Service Fee fields
  const [clientValueInput, setClientValueInput] = useState(subcampaign.client_value || '0')
  const [budgetInput, setBudgetInput] = useState(subcampaign.budget || '0')
  const [spentInput, setSpentInput] = useState(subcampaign.spent || '0')
  const [internalCostInput, setInternalCostInput] = useState(subcampaign.internal_cost || '0')

  // Revenue Share fields
  const [revenueGeneratedInput, setRevenueGeneratedInput] = useState(subcampaign.revenue_generated || '0')
  const [partnerShareInput, setPartnerShareInput] = useState(subcampaign.revenue_share_percentage || '0')

  // Sync input values when subcampaign data changes (after save)
  useEffect(() => {
    if (editingField === null) {
      setClientValueInput(subcampaign.client_value || '0')
      setBudgetInput(subcampaign.budget || '0')
      setSpentInput(subcampaign.spent || '0')
      setInternalCostInput(subcampaign.internal_cost || '0')
      setRevenueGeneratedInput(subcampaign.revenue_generated || '0')
      setPartnerShareInput(subcampaign.revenue_share_percentage || '0')
    }
  }, [subcampaign, editingField])

  const updateSubCampaign = useUpdateSubCampaign()
  const isRevenueShare = subcampaign.payment_method === 'revenue_share'

  // Generic save handler for financial fields
  const handleSaveField = async (field: NonNullable<EditableField>) => {
    const inputMap: Record<string, string> = {
      client_value: clientValueInput,
      budget: budgetInput,
      spent: spentInput,
      internal_cost: internalCostInput,
      revenue_generated: revenueGeneratedInput,
      revenue_share_percentage: partnerShareInput,
    }
    const originalMap: Record<string, string> = {
      client_value: subcampaign.client_value || '0',
      budget: subcampaign.budget || '0',
      spent: subcampaign.spent || '0',
      internal_cost: subcampaign.internal_cost || '0',
      revenue_generated: subcampaign.revenue_generated || '0',
      revenue_share_percentage: subcampaign.revenue_share_percentage || '0',
    }
    const setterMap: Record<string, (v: string) => void> = {
      client_value: setClientValueInput,
      budget: setBudgetInput,
      spent: setSpentInput,
      internal_cost: setInternalCostInput,
      revenue_generated: setRevenueGeneratedInput,
      revenue_share_percentage: setPartnerShareInput,
    }

    if (inputMap[field] === originalMap[field]) {
      setEditingField(null)
      return
    }

    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { [field]: inputMap[field] },
      })
      setEditingField(null)
    } catch {
      setterMap[field](originalMap[field])
      setEditingField(null)
    }
  }

  // Handle payment method change
  const handlePaymentMethodChange = async (value: string) => {
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { payment_method: value as PaymentMethod },
      })
    } catch {
      // Error handled by mutation
    }
  }

  // Handle currency change
  const handleCurrencyChange = async (value: string) => {
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { currency: value },
      })
    } catch {
      // Error handled by mutation
    }
  }

  const handleSaveStartDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { start_date: format(date, 'yyyy-MM-dd') },
      })
      setStartDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleSaveEndDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { end_date: format(date, 'yyyy-MM-dd') },
      })
      setEndDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }

  const platformConfig = PLATFORM_CONFIG[subcampaign.platform]
  const paymentConfig = subcampaign.payment_method
    ? PAYMENT_METHOD_CONFIG[subcampaign.payment_method]
    : null

  const budget = parseFloat(subcampaign.budget)
  const spent = parseFloat(subcampaign.spent)
  const utilization = budget > 0 ? (spent / budget) * 100 : 0

  return (
    <>
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          {/* Header - entire row is clickable */}
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 shrink-0 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

              {(() => {
                const Icon = PLATFORM_ICONS[subcampaign.platform]
                const brandColor = PLATFORM_COLORS[subcampaign.platform]
                return (
                  <div className={cn(
                    'p-2 rounded-lg',
                    brandColor ? brandColor.split(' ')[1] : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6',
                      brandColor ? brandColor.split(' ')[0] : 'text-foreground'
                    )} />
                  </div>
                )
              })()}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{platformConfig.label}</h4>
                </div>

                {/* Budget Progress Summary */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="font-medium">{formatMoney(spent, subcampaign.currency)}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{formatMoney(budget, subcampaign.currency)}</span>
                      <span className="text-muted-foreground ml-1">
                        ({utilization.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={utilization} className="h-1.5" />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {/* Invoice Count */}
                {invoices && invoices.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Receipt className="h-4 w-4" />
                    {invoices.length}
                  </span>
                )}
                {/* Annex Status */}
                {subcampaign.has_contract && subcampaign.contract_info ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs gap-1",
                      subcampaign.contract_info.status === 'signed'
                        ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                        : subcampaign.contract_info.status === 'pending_signature'
                        ? 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                        : 'border-muted-foreground/50 text-muted-foreground'
                    )}
                  >
                    <FileText className="h-3 w-3" />
                    Annex {subcampaign.contract_info.status === 'signed' ? 'Signed' :
                     subcampaign.contract_info.status === 'pending_signature' ? 'Pending' :
                     subcampaign.contract_info.status === 'draft' ? 'Draft' : ''}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 border-muted-foreground/30 text-muted-foreground/60"
                  >
                    <FileText className="h-3 w-3" />
                    No Annex
                  </Badge>
                )}
                {/* Date Warning */}
                {(!subcampaign.start_date || !subcampaign.end_date) && (
                  <span className="flex items-center gap-1 text-amber-500" title="Dates not set">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-xs">Set dates</span>
                  </span>
                )}
                {/* Show dates if both are set */}
                {subcampaign.start_date && subcampaign.end_date && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-xs">
                      {formatDate(subcampaign.start_date)} - {formatDate(subcampaign.end_date)}
                    </span>
                  </span>
                )}
                {subcampaign.song_count !== undefined && subcampaign.song_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Music2 className="h-4 w-4" />
                    {subcampaign.song_count}
                  </span>
                )}
                {subcampaign.artist_count !== undefined && subcampaign.artist_count > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {subcampaign.artist_count}
                  </span>
                )}
                {paymentConfig && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {paymentConfig.label}
                  </span>
                )}
              </div>

              {/* Create Task Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTaskPanel(true)
                }}
                title="Create task for this platform"
              >
                <ClipboardList className="h-4 w-4" />
              </Button>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                title="Delete platform"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
              {/* Songs */}
              {subcampaign.songs && subcampaign.songs.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Music2 className="h-4 w-4" />
                    Songs ({subcampaign.songs.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {subcampaign.songs.map((song) => (
                      <Badge key={song.id} variant="secondary" className="text-xs">
                        {song.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists */}
              {subcampaign.artists && subcampaign.artists.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Artists ({subcampaign.artists.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {subcampaign.artists.map((artist) => (
                      <Badge key={artist.id} variant="outline" className="text-xs">
                        {artist.display_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Start Date
                    {!subcampaign.start_date && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Required" />
                    )}
                  </p>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors",
                          "hover:bg-muted/50",
                          !subcampaign.start_date ? "text-amber-500" : "font-medium"
                        )}
                        disabled={isSavingDates}
                      >
                        {isSavingDates ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CalendarIcon className="h-3 w-3" />
                        )}
                        {subcampaign.start_date ? formatDate(subcampaign.start_date) : 'Set date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={subcampaign.start_date ? new Date(subcampaign.start_date) : undefined}
                        onSelect={handleSaveStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    End Date
                    {!subcampaign.end_date && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Required" />
                    )}
                  </p>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors",
                          "hover:bg-muted/50",
                          !subcampaign.end_date ? "text-amber-500" : "font-medium"
                        )}
                        disabled={isSavingDates}
                      >
                        {isSavingDates ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CalendarIcon className="h-3 w-3" />
                        )}
                        {subcampaign.end_date ? formatDate(subcampaign.end_date) : 'Set date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={subcampaign.end_date ? new Date(subcampaign.end_date) : undefined}
                        onSelect={handleSaveEndDate}
                        disabled={(date) =>
                          subcampaign.start_date ? date < new Date(subcampaign.start_date) : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Pricing Model & Currency Selector */}
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Pricing Model</p>
                  <Select
                    value={subcampaign.payment_method === 'revenue_share' ? 'revenue_share' : 'service_fee'}
                    onValueChange={handlePaymentMethodChange}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_fee">Service Fee</SelectItem>
                      <SelectItem value="revenue_share">Revenue Share</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <Select
                    value={subcampaign.currency}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger className="w-[90px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="RON">RON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Financial Details - Different fields based on pricing model */}
              {isRevenueShare ? (
                <>
                  {/* Revenue Share Fields */}
                  <div className={cn("grid gap-4 pt-2", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3")}>
                    {/* Total Revenue */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                      {editingField === 'revenue_generated' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={revenueGeneratedInput}
                          onChange={(e) => setRevenueGeneratedInput(e.target.value)}
                          onBlur={() => handleSaveField('revenue_generated')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveField('revenue_generated')
                            if (e.key === 'Escape') {
                              setRevenueGeneratedInput(subcampaign.revenue_generated || '0')
                              setEditingField(null)
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingField('revenue_generated')}
                          className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                        >
                          {formatMoney(parseFloat(subcampaign.revenue_generated || '0'), subcampaign.currency)}
                        </button>
                      )}
                    </div>

                    {/* Partner Share % - Admin/Manager only */}
                    {canViewSensitiveData && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Partner Share %</p>
                        {editingField === 'revenue_share_percentage' ? (
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={partnerShareInput}
                            onChange={(e) => setPartnerShareInput(e.target.value)}
                            onBlur={() => handleSaveField('revenue_share_percentage')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveField('revenue_share_percentage')
                              if (e.key === 'Escape') {
                                setPartnerShareInput(subcampaign.revenue_share_percentage || '0')
                                setEditingField(null)
                              }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingField('revenue_share_percentage')}
                            className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                          >
                            {parseFloat(subcampaign.revenue_share_percentage || '0')}%
                          </button>
                        )}
                      </div>
                    )}

                    {/* Our Spend */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Our Spend</p>
                      {editingField === 'spent' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={spentInput}
                          onChange={(e) => setSpentInput(e.target.value)}
                          onBlur={() => handleSaveField('spent')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveField('spent')
                            if (e.key === 'Escape') {
                              setSpentInput(subcampaign.spent || '0')
                              setEditingField(null)
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingField('spent')}
                          className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                        >
                          {formatMoney(spent, subcampaign.currency)}
                        </button>
                      )}
                    </div>

                    {/* Est. Cost */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Est. Cost</p>
                      {editingField === 'internal_cost' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={internalCostInput}
                          onChange={(e) => setInternalCostInput(e.target.value)}
                          onBlur={() => handleSaveField('internal_cost')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveField('internal_cost')
                            if (e.key === 'Escape') {
                              setInternalCostInput(subcampaign.internal_cost || '0')
                              setEditingField(null)
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingField('internal_cost')}
                          className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                        >
                          {formatMoney(parseFloat(subcampaign.internal_cost || '0'), subcampaign.currency)}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Revenue Share Calculated Fields */}
                  <div className={cn("grid gap-4 pt-2 border-t border-white/5", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2")}>
                    {/* Our Share - Admin/Manager only */}
                    {canViewSensitiveData && (
                      <div>
                        <p className="text-xs text-muted-foreground">Our Share</p>
                        <p className="font-medium text-green-500">
                          {formatMoney(
                            parseFloat(subcampaign.revenue_generated || '0') * (1 - parseFloat(subcampaign.revenue_share_percentage || '0') / 100),
                            subcampaign.currency
                          )}
                        </p>
                      </div>
                    )}
                    {/* Partner Gets - Admin/Manager only */}
                    {canViewSensitiveData && (
                      <div>
                        <p className="text-xs text-muted-foreground">Partner Gets</p>
                        <p className="font-medium">
                          {formatMoney(
                            parseFloat(subcampaign.revenue_generated || '0') * (parseFloat(subcampaign.revenue_share_percentage || '0') / 100),
                            subcampaign.currency
                          )}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Net Profit</p>
                      <p className={cn(
                        "font-medium",
                        (parseFloat(subcampaign.revenue_generated || '0') * (1 - parseFloat(subcampaign.revenue_share_percentage || '0') / 100)) - spent < 0
                          ? "text-red-500"
                          : "text-green-500"
                      )}>
                        {formatMoney(
                          (parseFloat(subcampaign.revenue_generated || '0') * (1 - parseFloat(subcampaign.revenue_share_percentage || '0') / 100)) - spent,
                          subcampaign.currency
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">vs Estimate</p>
                      <p className={cn(
                        "font-medium",
                        spent > parseFloat(subcampaign.internal_cost || '0') ? "text-red-500" : "text-green-500"
                      )}>
                        {spent <= parseFloat(subcampaign.internal_cost || '0') ? '✓ Under' : '⚠ Over'} budget
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Service Fee Fields */}
                  <div className={cn("grid gap-4 pt-2", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3")}>
                    {/* Client Value - Admin/Manager only */}
                    {canViewSensitiveData && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Client Value</p>
                        {editingField === 'client_value' ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={clientValueInput}
                            onChange={(e) => setClientValueInput(e.target.value)}
                            onBlur={() => handleSaveField('client_value')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveField('client_value')
                              if (e.key === 'Escape') {
                                setClientValueInput(subcampaign.client_value || '0')
                                setEditingField(null)
                              }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setEditingField('client_value')}
                            className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                          >
                            {formatMoney(parseFloat(subcampaign.client_value || '0'), subcampaign.currency)}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Budget */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Budget</p>
                      {editingField === 'budget' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          onBlur={() => handleSaveField('budget')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveField('budget')
                            if (e.key === 'Escape') {
                              setBudgetInput(subcampaign.budget || '0')
                              setEditingField(null)
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingField('budget')}
                          className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                        >
                          {formatMoney(budget, subcampaign.currency)}
                        </button>
                      )}
                    </div>

                    {/* Spent */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Spent</p>
                      {editingField === 'spent' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={spentInput}
                          onChange={(e) => setSpentInput(e.target.value)}
                          onBlur={() => handleSaveField('spent')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveField('spent')
                            if (e.key === 'Escape') {
                              setSpentInput(subcampaign.spent || '0')
                              setEditingField(null)
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingField('spent')}
                          className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                        >
                          {formatMoney(spent, subcampaign.currency)}
                        </button>
                      )}
                    </div>

                    {/* Est. Cost */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Est. Cost</p>
                      {editingField === 'internal_cost' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={internalCostInput}
                          onChange={(e) => setInternalCostInput(e.target.value)}
                          onBlur={() => handleSaveField('internal_cost')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveField('internal_cost')
                            if (e.key === 'Escape') {
                              setInternalCostInput(subcampaign.internal_cost || '0')
                              setEditingField(null)
                            }
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingField('internal_cost')}
                          className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                        >
                          {formatMoney(parseFloat(subcampaign.internal_cost || '0'), subcampaign.currency)}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Service Fee Calculated Fields */}
                  <div className={cn("grid gap-4 pt-2 border-t border-white/5", canViewSensitiveData ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3")}>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-medium">
                        {formatMoney(budget - spent, subcampaign.currency)}
                      </p>
                    </div>
                    {/* Margin - Admin/Manager only */}
                    {canViewSensitiveData && (
                      <div>
                        <p className="text-xs text-muted-foreground">Margin</p>
                        <p className={cn(
                          "font-medium",
                          parseFloat(subcampaign.client_value || '0') - parseFloat(subcampaign.internal_cost || '0') < 0
                            ? "text-red-500"
                            : "text-green-500"
                        )}>
                          {formatMoney(
                            parseFloat(subcampaign.client_value || '0') - parseFloat(subcampaign.internal_cost || '0'),
                            subcampaign.currency
                          )}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Utilization</p>
                      <p className={cn(
                        "font-medium",
                        utilization > 100 ? "text-red-500" : utilization > 80 ? "text-amber-500" : ""
                      )}>
                        {utilization.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">vs Estimate</p>
                      <p className={cn(
                        "font-medium",
                        spent > parseFloat(subcampaign.internal_cost || '0') ? "text-red-500" : "text-green-500"
                      )}>
                        {spent <= parseFloat(subcampaign.internal_cost || '0') ? '✓ Under' : '⚠ Over'} budget
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* KPIs Section */}
              <KPISection
                subcampaign={subcampaign}
                campaignId={campaignId}
              />

              {/* Notes */}
              {subcampaign.notes && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{subcampaign.notes}</p>
                </div>
              )}

              {/* Invoices Section */}
              <div className="pt-4 mt-4 border-t border-white/5">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Platform Invoices
                </h5>
                <SubCampaignInvoiceList
                  campaignId={campaignId}
                  subcampaign={subcampaign}
                  onAddInvoice={() => setShowInvoiceDialog(true)}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Delete Confirmation */}
      <DeleteSubCampaignDialog
        campaignId={campaignId}
        subcampaignId={subcampaign.id}
        platformLabel={platformConfig.label}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />

      {/* Invoice Upload Dialog */}
      <SubCampaignInvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        campaignId={campaignId}
        campaignName={campaignName}
        subcampaign={subcampaign}
        onSuccess={() => setShowInvoiceDialog(false)}
      />

      {/* Task Create Panel - Pre-linked to campaign and platform */}
      <TaskDetailPanel
        task={null}
        open={showTaskPanel}
        onOpenChange={setShowTaskPanel}
        createMode={true}
        defaultCampaignId={campaignId}
        defaultSubcampaignId={subcampaign.id}
      />
    </>
  )
}

// ============================================
// KPI Section Component
// ============================================

interface KPISectionProps {
  subcampaign: SubCampaign
  campaignId: number
}

function KPISection({ subcampaign, campaignId }: KPISectionProps) {
  const [showAddKPI, setShowAddKPI] = useState(false)
  const [editingKPI, setEditingKPI] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const updateSubCampaign = useUpdateSubCampaign()

  const kpiTargets = subcampaign.kpi_targets || {}
  const kpiEntries = Object.entries(kpiTargets)

  // Get suggested KPIs for this platform
  const suggestedKPIs = PLATFORM_DEFAULT_KPIS[subcampaign.platform] || []
  const existingKPIKeys = Object.keys(kpiTargets)
  const availableKPIs = Object.keys(KPI_CONFIG).filter(
    (kpi) => !existingKPIKeys.includes(kpi)
  ) as KPIType[]

  const handleAddKPI = async (kpiType: KPIType) => {
    const config = KPI_CONFIG[kpiType]
    const newTargets = {
      ...kpiTargets,
      [kpiType]: { target: 0, unit: config.unit },
    }
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { kpi_targets: newTargets },
      })
      setShowAddKPI(false)
      // Start editing the new KPI immediately
      setEditingKPI(kpiType)
      setEditValue('0')
    } catch {
      // Error handled by mutation
    }
  }

  const handleUpdateKPI = async (kpiType: string, newTarget: number) => {
    const currentKPI = kpiTargets[kpiType]
    if (!currentKPI) return

    const newTargets = {
      ...kpiTargets,
      [kpiType]: { ...currentKPI, target: newTarget },
    }
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { kpi_targets: newTargets },
      })
      setEditingKPI(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteKPI = async (kpiType: string) => {
    const newTargets = { ...kpiTargets }
    delete newTargets[kpiType]
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { kpi_targets: newTargets },
      })
    } catch {
      // Error handled by mutation
    }
  }

  const formatKPIValue = (value: number, unit: string) => {
    if (unit === 'percent') return `${value}%`
    if (unit === 'currency') return `€${value.toLocaleString()}`
    if (unit === 'minutes') return `${value.toLocaleString()} min`
    return value.toLocaleString()
  }

  return (
    <div className="pt-4 mt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          KPI Targets
        </h5>
        <Popover open={showAddKPI} onOpenChange={setShowAddKPI}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add KPI
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="space-y-2">
              {/* Suggested KPIs for this platform */}
              {suggestedKPIs.filter(kpi => !existingKPIKeys.includes(kpi)).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground px-2 py-1">Suggested</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedKPIs
                      .filter(kpi => !existingKPIKeys.includes(kpi))
                      .map(kpi => (
                        <button
                          key={kpi}
                          onClick={() => handleAddKPI(kpi)}
                          className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {KPI_CONFIG[kpi].label}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {/* All KPIs by category */}
              {KPI_CATEGORIES.map(category => {
                const availableInCategory = category.kpis.filter(
                  kpi => !existingKPIKeys.includes(kpi)
                )
                if (availableInCategory.length === 0) return null
                return (
                  <div key={category.key}>
                    <p className="text-xs text-muted-foreground px-2 py-1">{category.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {availableInCategory.map(kpi => (
                        <button
                          key={kpi}
                          onClick={() => handleAddKPI(kpi)}
                          className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {KPI_CONFIG[kpi].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {availableKPIs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  All KPIs have been added
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {kpiEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No KPI targets set. Click "Add KPI" to set performance targets.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpiEntries.map(([kpiType, kpiData]) => {
            const config = KPI_CONFIG[kpiType as KPIType]
            if (!config) return null

            const isEditing = editingKPI === kpiType

            return (
              <div
                key={kpiType}
                className="group relative p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (!isEditing) {
                    setEditingKPI(kpiType)
                    setEditValue(String(kpiData.target))
                  }
                }}
              >
                <p className="text-xs text-muted-foreground mb-1">{config.label}</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      const num = parseFloat(editValue) || 0
                      handleUpdateKPI(kpiType, num)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = parseFloat(editValue) || 0
                        handleUpdateKPI(kpiType, num)
                      }
                      if (e.key === 'Escape') {
                        setEditingKPI(null)
                      }
                    }}
                    className="h-7 text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="font-semibold text-sm">
                    {formatKPIValue(kpiData.target, kpiData.unit)}
                  </p>
                )}
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteKPI(kpiType)
                  }}
                  className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  title="Remove KPI"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// Delete Dialog
// ============================================

interface DeleteSubCampaignDialogProps {
  campaignId: number
  subcampaignId: number
  platformLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DeleteSubCampaignDialog({
  campaignId,
  subcampaignId,
  platformLabel,
  open,
  onOpenChange,
}: DeleteSubCampaignDialogProps) {
  const deleteMutation = useDeleteSubCampaign()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ campaignId, subCampaignId: subcampaignId })
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Platform</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {platformLabel} from this campaign?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
