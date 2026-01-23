/**
 * Opportunity Detail View
 * Redesigned to match Campaign detail page with:
 * - Compact header with inline editing
 * - Stage flow visualization
 * - Notes and Team Assignment sections
 * - No modals for field editing (inline only)
 */

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  DollarSign,
  Edit2,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileVideo,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  useOpportunity,
  useUpdateOpportunity,
  useMarkWon,
  useMarkLost,
  useOpportunityActivities,
  useDeleteOpportunity,
} from '@/api/hooks/useOpportunities'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import {
  STAGE_CONFIG,
  PRIORITY_CONFIG,
  TERMINAL_STAGES,
  type OpportunityStage,
} from '@/types/opportunities'
import { OpportunityNotesSection } from './components/OpportunityNotesSection'
import { OpportunityAssignmentSection } from './components/OpportunityAssignmentSection'
import { OpportunityInvoicesSection } from './components/OpportunityInvoicesSection'
import { OpportunityContractsSection } from './components/OpportunityContractsSection'
import { DeliverableCard } from './components/DeliverableCard'
import { ArtistCard } from './components/ArtistCard'
import { InlineDeliverableAdd } from './components/InlineDeliverableAdd'
import { InlineArtistAdd } from './components/InlineArtistAdd'
import { RelatedTasks } from '@/components/tasks/RelatedTasks'

// Stage flow for opportunity pipeline
const STAGE_FLOW: OpportunityStage[] = [
  'brief',
  'qualified',
  'shortlist',
  'proposal_draft',
  'proposal_sent',
  'negotiation',
  'contract_prep',
  'contract_sent',
  'won',
  'executing',
]

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const opportunityId = parseInt(id || '0')

  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStageConfirm, setShowStageConfirm] = useState<OpportunityStage | null>(null)

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Date picker state
  const [expectedCloseDateOpen, setExpectedCloseDateOpen] = useState(false)
  const [campaignStartDateOpen, setCampaignStartDateOpen] = useState(false)
  const [campaignEndDateOpen, setCampaignEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)

  // Inline add form state
  const [showAddArtist, setShowAddArtist] = useState(false)
  const [showAddDeliverable, setShowAddDeliverable] = useState(false)

  // Expanded card state (like campaigns/distributions)
  const [expandedArtistIds, setExpandedArtistIds] = useState<Set<number>>(new Set())
  const [expandedDeliverableIds, setExpandedDeliverableIds] = useState<Set<number>>(new Set())

  // Fetch data
  const { data: opportunity, isLoading } = useOpportunity(opportunityId)
  const { data: activities = [] } = useOpportunityActivities(opportunityId)

  // Mutations
  const updateOpportunity = useUpdateOpportunity()
  const markWonMutation = useMarkWon()
  const markLostMutation = useMarkLost()
  const deleteOpportunity = useDeleteOpportunity()

  // Toggle expand handlers
  const toggleArtistExpanded = (id: number) => {
    setExpandedArtistIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleDeliverableExpanded = (id: number) => {
    setExpandedDeliverableIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading || !opportunity) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  const stageConfig = STAGE_CONFIG[opportunity.stage]
  const priorityConfig = PRIORITY_CONFIG[opportunity.priority]
  const isTerminalStage = TERMINAL_STAGES.includes(opportunity.stage)
  const currentStageIndex = STAGE_FLOW.indexOf(opportunity.stage)

  // Check if can transition to a stage
  const canTransitionTo = (stage: OpportunityStage) => {
    if (isTerminalStage) return false
    const targetIndex = STAGE_FLOW.indexOf(stage)
    return targetIndex <= currentStageIndex + 1 && targetIndex >= 0
  }

  // Handle stage change
  const handleStageChange = async (newStage: OpportunityStage) => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { stage: newStage },
      })
      setShowStageConfirm(null)
    } catch {
      // Error handled by mutation
    }
  }

  // Handle inline field save
  const handleFieldSave = async (field: string, value: string | number) => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { [field]: value },
      })
      setEditingField(null)
    } catch {
      // Error handled by mutation
    }
  }

  // Handle date saves
  const handleSaveExpectedCloseDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { expected_close_date: format(date, 'yyyy-MM-dd') },
      })
      setExpectedCloseDateOpen(false)
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleSaveCampaignStartDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { campaign_start_date: format(date, 'yyyy-MM-dd') },
      })
      setCampaignStartDateOpen(false)
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleSaveCampaignEndDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { campaign_end_date: format(date, 'yyyy-MM-dd') },
      })
      setCampaignEndDateOpen(false)
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleMarkWon = async () => {
    if (confirm('Mark this opportunity as Won?')) {
      await markWonMutation.mutateAsync(opportunityId)
    }
  }

  const handleMarkLost = async () => {
    const reason = prompt('Why was this opportunity lost?')
    if (reason) {
      await markLostMutation.mutateAsync({
        id: opportunityId,
        data: { lost_reason: reason },
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOpportunity.mutateAsync(opportunityId)
      setShowDeleteConfirm(false)
      navigate('/opportunities')
    } catch {
      setShowDeleteConfirm(false)
    }
  }

  // Inline edit component
  const InlineEdit = ({
    field,
    value,
    displayValue,
    type = 'text',
    className = '',
  }: {
    field: string
    value: string | number
    displayValue: string
    type?: 'text' | 'number' | 'textarea'
    className?: string
  }) => {
    const isEditing = editingField === field

    if (isEditing) {
      const inputProps = {
        value: editValue,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          setEditValue(e.target.value),
        onBlur: () => handleFieldSave(field, type === 'number' ? parseFloat(editValue) : editValue),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' && type !== 'textarea') {
            handleFieldSave(field, type === 'number' ? parseFloat(editValue) : editValue)
          }
          if (e.key === 'Escape') {
            setEditingField(null)
          }
        },
        autoFocus: true,
        className: cn('h-8 text-sm', className),
      }

      if (type === 'textarea') {
        return (
          <Textarea
            {...inputProps}
            className={cn('text-sm min-h-[80px]', className)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditingField(null)
            }}
          />
        )
      }

      return <Input type={type} {...inputProps} />
    }

    return (
      <button
        onClick={() => {
          setEditingField(field)
          setEditValue(String(value || ''))
        }}
        className={cn(
          'text-left hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors',
          className
        )}
      >
        {displayValue || <span className="text-muted-foreground italic">Click to edit</span>}
      </button>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/opportunities')}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pipeline
        </Button>

        {/* Compact Header Card */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
          <div className="p-5 space-y-4">
            {/* Row 1: Title, Account, Stage Flow, Actions */}
            <div className="flex items-center justify-between gap-6">
              {/* Left: Title and Account */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold truncate">{opportunity.title}</h1>
                    <Badge className={cn('text-xs', priorityConfig.color)}>
                      {priorityConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs font-mono">{opportunity.opportunity_number}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <Link
                      to={`/entities/${opportunity.account.id}`}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{opportunity.account.display_name}</span>
                    </Link>
                    {opportunity.contact_person && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{opportunity.contact_person.full_name}</span>
                      </>
                    )}
                    <span className="text-muted-foreground/50">•</span>
                    {/* Expected Close Date */}
                    <Popover open={expectedCloseDateOpen} onOpenChange={setExpectedCloseDateOpen}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50',
                            !opportunity.expected_close_date && 'text-amber-500'
                          )}
                          disabled={isSavingDates}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {opportunity.expected_close_date
                            ? formatDate(opportunity.expected_close_date)
                            : 'Set close date'}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            opportunity.expected_close_date
                              ? new Date(opportunity.expected_close_date)
                              : undefined
                          }
                          onSelect={handleSaveExpectedCloseDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Center: Stage Flow */}
              <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
                {isTerminalStage ? (
                  <Badge className={cn('text-xs px-3 py-1.5', stageConfig.color)}>
                    {stageConfig.emoji} {stageConfig.label}
                  </Badge>
                ) : (
                  STAGE_FLOW.slice(0, 6).map((stage, index) => {
                    const config = STAGE_CONFIG[stage]
                    const isCompleted = index < currentStageIndex
                    const isCurrent = stage === opportunity.stage
                    const isClickable = canTransitionTo(stage) && !isCurrent

                    return (
                      <div key={stage} className="flex items-center">
                        <button
                          onClick={() => isClickable && setShowStageConfirm(stage)}
                          disabled={!isClickable}
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                            isCurrent &&
                              'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md',
                            isCompleted && 'bg-primary/10 text-primary',
                            !isCompleted && !isCurrent && 'text-muted-foreground/60',
                            isClickable && !isCurrent && 'cursor-pointer hover:bg-muted/50'
                          )}
                          title={isClickable ? `Click to change to ${config.label}` : config.label}
                        >
                          {isCompleted ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <span className="text-sm">{config.emoji}</span>
                          )}
                          <span className={cn(isCurrent ? 'inline' : 'hidden sm:inline')}>
                            {config.label.split(' ')[0]}
                          </span>
                        </button>
                        {index < 5 && (
                          <ChevronRight
                            className={cn(
                              'h-3 w-3 mx-0.5 shrink-0',
                              index < currentStageIndex
                                ? 'text-primary'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!isTerminalStage && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkWon}
                      className="rounded-lg border-green-500/30 text-green-500 hover:bg-green-500/10"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Won
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkLost}
                      className="rounded-lg border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Lost
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-white/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(`/opportunities/${id}/edit`)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Opportunity
                    </DropdownMenuItem>
                    {isTerminalStage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStageChange('brief')}
                          className="text-blue-500"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reopen Opportunity
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Opportunity
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Row 2: Key Stats */}
            <div className="flex items-center gap-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/20">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Est. Value
                    </p>
                    <p className="text-sm font-semibold">
                      {opportunity.estimated_value
                        ? formatMoney(parseFloat(opportunity.estimated_value), opportunity.currency)
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-500/20">
                    <Target className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Probability
                    </p>
                    <p className="text-sm font-semibold">{opportunity.probability}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-500/20">
                    <Users className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Owner
                    </p>
                    <p className="text-sm font-semibold">{opportunity.owner.full_name}</p>
                  </div>
                </div>

                {opportunity.team && (
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-500/20">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Team
                      </p>
                      <p className="text-sm font-semibold">{opportunity.team.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-12 shadow-lg">
            <TabsTrigger
              value="overview"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="artists"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              Artists {opportunity.artists?.length ? `(${opportunity.artists.length})` : ''}
            </TabsTrigger>
            <TabsTrigger
              value="deliverables"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              Deliverables
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="financials"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              Financials
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Brief Details */}
                <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <h3 className="font-semibold mb-4">Brief Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Campaign Objectives
                      </label>
                      <InlineEdit
                        field="campaign_objectives"
                        value={opportunity.campaign_objectives || ''}
                        displayValue={opportunity.campaign_objectives || ''}
                        type="textarea"
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Target Audience
                      </label>
                      <InlineEdit
                        field="target_audience"
                        value={opportunity.target_audience || ''}
                        displayValue={opportunity.target_audience || ''}
                        type="textarea"
                        className="w-full mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Brand Category
                        </label>
                        <InlineEdit
                          field="brand_category"
                          value={opportunity.brand_category || ''}
                          displayValue={opportunity.brand_category || ''}
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Channels
                        </label>
                        <p className="text-sm mt-1">
                          {opportunity.channels?.length
                            ? opportunity.channels.join(', ')
                            : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Campaign Start
                        </label>
                        <Popover
                          open={campaignStartDateOpen}
                          onOpenChange={setCampaignStartDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                'flex items-center gap-2 mt-1 px-2 py-1 -mx-2 rounded transition-colors hover:bg-muted/50 text-sm',
                                !opportunity.campaign_start_date && 'text-amber-500'
                              )}
                              disabled={isSavingDates}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {opportunity.campaign_start_date
                                ? formatDate(opportunity.campaign_start_date)
                                : 'Set date'}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                opportunity.campaign_start_date
                                  ? new Date(opportunity.campaign_start_date)
                                  : undefined
                              }
                              onSelect={handleSaveCampaignStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Campaign End
                        </label>
                        <Popover open={campaignEndDateOpen} onOpenChange={setCampaignEndDateOpen}>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                'flex items-center gap-2 mt-1 px-2 py-1 -mx-2 rounded transition-colors hover:bg-muted/50 text-sm',
                                !opportunity.campaign_end_date && 'text-amber-500'
                              )}
                              disabled={isSavingDates}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {opportunity.campaign_end_date
                                ? formatDate(opportunity.campaign_end_date)
                                : 'Set date'}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                opportunity.campaign_end_date
                                  ? new Date(opportunity.campaign_end_date)
                                  : undefined
                              }
                              onSelect={handleSaveCampaignEndDate}
                              disabled={(date) =>
                                opportunity.campaign_start_date
                                  ? date < new Date(opportunity.campaign_start_date)
                                  : false
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Budget Min
                        </label>
                        <InlineEdit
                          field="budget_range_min"
                          value={opportunity.budget_range_min || ''}
                          displayValue={
                            opportunity.budget_range_min
                              ? formatMoney(
                                  parseFloat(opportunity.budget_range_min),
                                  opportunity.currency
                                )
                              : ''
                          }
                          type="number"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Budget Max
                        </label>
                        <InlineEdit
                          field="budget_range_max"
                          value={opportunity.budget_range_max || ''}
                          displayValue={
                            opportunity.budget_range_max
                              ? formatMoney(
                                  parseFloat(opportunity.budget_range_max),
                                  opportunity.currency
                                )
                              : ''
                          }
                          type="number"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Financial Summary */}
                {opportunity.fee_gross && parseFloat(opportunity.fee_gross) > 0 && (
                  <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <h3 className="font-semibold mb-4">Financial Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Gross Fee</span>
                        <span className="font-semibold">
                          {formatMoney(parseFloat(opportunity.fee_gross), opportunity.currency)}
                        </span>
                      </div>
                      {opportunity.discounts && parseFloat(opportunity.discounts) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span className="text-sm">Discounts</span>
                          <span>
                            -{formatMoney(parseFloat(opportunity.discounts), opportunity.currency)}
                          </span>
                        </div>
                      )}
                      {opportunity.agency_fee && parseFloat(opportunity.agency_fee) > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span className="text-sm">Agency Fee</span>
                          <span>
                            -{formatMoney(parseFloat(opportunity.agency_fee), opportunity.currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-semibold">Net Fee</span>
                        <span className="font-semibold text-green-600">
                          {formatMoney(parseFloat(opportunity.fee_net || '0'), opportunity.currency)}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column: Notes & Team */}
              <div className="space-y-6">
                {/* Team Assignments */}
                <OpportunityAssignmentSection
                  opportunityId={opportunityId}
                  assignments={opportunity.assignments || []}
                  createdBy={opportunity.created_by?.id}
                  isLoading={isLoading}
                />

                {/* Notes */}
                <OpportunityNotesSection
                  notes={opportunity.notes}
                  onSave={async (notes) => {
                    await updateOpportunity.mutateAsync({
                      id: opportunityId,
                      data: { notes },
                    })
                  }}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists" className="mt-6">
            <div className="space-y-4">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {opportunity.artists?.length || 0} Artist{(opportunity.artists?.length || 0) !== 1 ? 's' : ''}
                </h3>
                {!showAddArtist && (
                  <Button
                    onClick={() => setShowAddArtist(true)}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Artist
                  </Button>
                )}
              </div>

              {/* Inline Add Form */}
              {showAddArtist && (
                <InlineArtistAdd
                  opportunityId={opportunityId}
                  currency={opportunity.currency}
                  existingArtistIds={opportunity.artists?.map((a) => a.artist.id) || []}
                  onClose={() => setShowAddArtist(false)}
                  onSuccess={(artistId) => {
                    // Expand the newly added artist
                    setExpandedArtistIds((prev) => new Set(prev).add(artistId))
                  }}
                />
              )}

              {/* Artists List */}
              {opportunity.artists && opportunity.artists.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.artists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      opportunityId={opportunityId}
                      currency={opportunity.currency}
                      isExpanded={expandedArtistIds.has(artist.id)}
                      onToggleExpand={() => toggleArtistExpanded(artist.id)}
                    />
                  ))}
                </div>
              ) : !showAddArtist ? (
                <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                  <h4 className="font-semibold mb-2">No artists yet</h4>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Add artists to track their roles, fees, and contract status for this opportunity.
                  </p>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="mt-6">
            <div className="space-y-4">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {opportunity.deliverables?.length || 0} Deliverable{(opportunity.deliverables?.length || 0) !== 1 ? 's' : ''}
                </h3>
                {!showAddDeliverable && (
                  <Button
                    onClick={() => setShowAddDeliverable(true)}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deliverable
                  </Button>
                )}
              </div>

              {/* Inline Add Form */}
              {showAddDeliverable && (
                <InlineDeliverableAdd
                  opportunityId={opportunityId}
                  onClose={() => setShowAddDeliverable(false)}
                  onSuccess={(deliverableId) => {
                    // Expand the newly added deliverable
                    setExpandedDeliverableIds((prev) => new Set(prev).add(deliverableId))
                  }}
                />
              )}

              {/* Deliverables List */}
              {opportunity.deliverables && opportunity.deliverables.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.deliverables.map((deliverable) => (
                    <DeliverableCard
                      key={deliverable.id}
                      deliverable={deliverable}
                      opportunityId={opportunityId}
                      isExpanded={expandedDeliverableIds.has(deliverable.id)}
                      onToggleExpand={() => toggleDeliverableExpanded(deliverable.id)}
                    />
                  ))}
                </div>
              ) : !showAddDeliverable ? (
                <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <FileVideo className="h-8 w-8 text-blue-500" />
                  </div>
                  <h4 className="font-semibold mb-2">No deliverables yet</h4>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Add deliverables to track content requirements for this opportunity.
                  </p>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <RelatedTasks
              entityType="opportunity"
              entityId={opportunityId}
              title="Opportunity Tasks"
              description="Tasks related to this opportunity"
              showEmpty={true}
            />
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-6 mt-6">
            <OpportunityInvoicesSection opportunityId={opportunityId} />
            <OpportunityContractsSection
              opportunityId={opportunityId}
              accountId={opportunity.account?.id}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
              <h3 className="font-semibold mb-4">Activity Timeline</h3>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 border-l-2 pl-4 pb-4">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{activity.title}</div>
                        {activity.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {activity.user?.full_name} • {formatDate(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stage Change Confirmation */}
        <AlertDialog open={!!showStageConfirm} onOpenChange={() => setShowStageConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Stage</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change the stage to{' '}
                <strong>{showStageConfirm ? STAGE_CONFIG[showStageConfirm].label : ''}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showStageConfirm && handleStageChange(showStageConfirm)}
              >
                Change Stage
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this opportunity? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteOpportunity.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}
