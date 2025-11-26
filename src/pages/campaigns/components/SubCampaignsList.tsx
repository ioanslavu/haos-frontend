/**
 * SubCampaignsList - List of subcampaigns (platforms) for a campaign
 *
 * Shows each platform with:
 * - Budget and spent amounts
 * - Payment method
 * - Songs and artists
 * - Actions (edit, update budget/spent, delete)
 */

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit2,
  Loader2,
  MoreHorizontal,
  Music2,
  Plus,
  Trash2,
  User,
  CreditCard,
  X,
} from 'lucide-react'
// Platform icons
import {
  SiSpotify,
  SiApplemusic,
  SiYoutube,
  SiTiktok,
  SiMeta,
  SiGoogleads,
  SiAmazonmusic,
  SiSoundcloud,
  SiX,
  SiSnapchat,
  SiPinterest,
  SiLinkedin,
} from 'react-icons/si'
import { HiGlobeAlt, HiMusicalNote } from 'react-icons/hi2'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  useUpdateSubCampaignBudget,
  useUpdateSubCampaignSpent,
  useDeleteSubCampaign,
} from '@/api/hooks/useCampaigns'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { SubCampaign, Platform, ServiceType } from '@/types/campaign'
import {
  PLATFORM_CONFIG,
  SUBCAMPAIGN_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  SERVICE_TYPE_CONFIG,
} from '@/types/campaign'

// Platform icon mapping
const PLATFORM_ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  spotify: SiSpotify,
  apple_music: SiApplemusic,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  meta: SiMeta,
  google: SiGoogleads,
  amazon_music: SiAmazonmusic,
  deezer: HiMusicalNote, // Deezer icon not available, using music note
  soundcloud: SiSoundcloud,
  twitter: SiX,
  snapchat: SiSnapchat,
  pinterest: SiPinterest,
  linkedin: SiLinkedin,
  other: HiGlobeAlt,
}

// Platform brand colors for selected state
const PLATFORM_COLORS: Partial<Record<Platform, string>> = {
  spotify: 'text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/30',
  apple_music: 'text-[#FA243C] bg-[#FA243C]/10 border-[#FA243C]/30',
  youtube: 'text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/30',
  tiktok: 'text-foreground bg-foreground/10 border-foreground/30',
  meta: 'text-[#0081FB] bg-[#0081FB]/10 border-[#0081FB]/30',
  google: 'text-[#4285F4] bg-[#4285F4]/10 border-[#4285F4]/30',
  amazon_music: 'text-[#FF9900] bg-[#FF9900]/10 border-[#FF9900]/30',
  deezer: 'text-[#FEAA2D] bg-[#FEAA2D]/10 border-[#FEAA2D]/30',
  soundcloud: 'text-[#FF5500] bg-[#FF5500]/10 border-[#FF5500]/30',
  twitter: 'text-foreground bg-foreground/10 border-foreground/30',
  snapchat: 'text-[#FFFC00] bg-[#FFFC00]/10 border-[#FFFC00]/30',
  pinterest: 'text-[#E60023] bg-[#E60023]/10 border-[#E60023]/30',
  linkedin: 'text-[#0A66C2] bg-[#0A66C2]/10 border-[#0A66C2]/30',
}

// Platforms in display order
const PLATFORMS: Platform[] = [
  'spotify', 'apple_music', 'youtube', 'tiktok', 'meta',
  'google', 'amazon_music', 'deezer', 'soundcloud',
  'twitter', 'snapchat', 'pinterest', 'linkedin', 'other',
]

interface SubCampaignsListProps {
  campaignId: number
  showAddForm?: boolean
  onAddFormClose?: () => void
}

export function SubCampaignsList({ campaignId, showAddForm = false, onAddFormClose }: SubCampaignsListProps) {
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
        <div className="text-center py-8 text-muted-foreground">
          <p>No platforms added yet. Click "Add Platform" to get started.</p>
        </div>
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
                    isSelected
                      ? brandColor || 'text-primary bg-primary/10 border-primary/30'
                      : 'border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
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
  isExpanded: boolean
  onToggleExpand: () => void
}

function SubCampaignCard({
  subcampaign,
  campaignId,
  isExpanded,
  onToggleExpand,
}: SubCampaignCardProps) {
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showSpentModal, setShowSpentModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)

  const updateSubCampaign = useUpdateSubCampaign()

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
  const statusConfig = SUBCAMPAIGN_STATUS_CONFIG[subcampaign.status]
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
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center gap-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

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
                  <Badge
                    className={cn('text-xs', statusConfig.bgColor, statusConfig.color)}
                  >
                    {statusConfig.emoji} {statusConfig.label}
                  </Badge>
                </div>

                {/* Budget Progress */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Budget</span>
                      <span>
                        {formatMoney(spent, subcampaign.currency)} /{' '}
                        {formatMoney(budget, subcampaign.currency)}
                      </span>
                    </div>
                    <Progress value={utilization} className="h-1.5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {utilization.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowBudgetModal(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Update Budget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSpentModal(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Update Spent
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

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

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-medium">{formatMoney(budget, subcampaign.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="font-medium">{formatMoney(spent, subcampaign.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="font-medium">
                    {formatMoney(budget - spent, subcampaign.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-medium">
                    {paymentConfig ? paymentConfig.label : 'Not set'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {subcampaign.notes && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{subcampaign.notes}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Update Budget Modal */}
      <UpdateAmountModal
        title="Update Budget"
        description={`Update the budget for ${platformConfig.label}`}
        currentValue={budget}
        currency={subcampaign.currency}
        campaignId={campaignId}
        subcampaignId={subcampaign.id}
        type="budget"
        open={showBudgetModal}
        onOpenChange={setShowBudgetModal}
      />

      {/* Update Spent Modal */}
      <UpdateAmountModal
        title="Update Spent"
        description={`Update the spent amount for ${platformConfig.label}`}
        currentValue={spent}
        currency={subcampaign.currency}
        campaignId={campaignId}
        subcampaignId={subcampaign.id}
        type="spent"
        open={showSpentModal}
        onOpenChange={setShowSpentModal}
      />

      {/* Delete Confirmation */}
      <DeleteSubCampaignDialog
        campaignId={campaignId}
        subcampaignId={subcampaign.id}
        platformLabel={platformConfig.label}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}

interface UpdateAmountModalProps {
  title: string
  description: string
  currentValue: number
  currency: string
  campaignId: number
  subcampaignId: number
  type: 'budget' | 'spent'
  open: boolean
  onOpenChange: (open: boolean) => void
}

function UpdateAmountModal({
  title,
  description,
  currentValue,
  currency,
  campaignId,
  subcampaignId,
  type,
  open,
  onOpenChange,
}: UpdateAmountModalProps) {
  const [value, setValue] = useState(currentValue.toString())
  const [reason, setReason] = useState('')

  const updateBudget = useUpdateSubCampaignBudget()
  const updateSpent = useUpdateSubCampaignSpent()
  const mutation = type === 'budget' ? updateBudget : updateSpent

  const handleSubmit = async () => {
    try {
      if (type === 'budget') {
        await updateBudget.mutateAsync({
          campaignId,
          subCampaignId: subcampaignId,
          budget: value,
          reason: reason || undefined,
        })
      } else {
        await updateSpent.mutateAsync({
          campaignId,
          subCampaignId: subcampaignId,
          spent: value,
          reason: reason || undefined,
        })
      }
      onOpenChange(false)
      setValue(currentValue.toString())
      setReason('')
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount ({currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Current: {formatMoney(currentValue, currency)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you making this change?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Update'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
