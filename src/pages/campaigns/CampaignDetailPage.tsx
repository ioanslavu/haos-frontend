/**
 * CampaignDetailPage - Detailed view of a single campaign
 *
 * Features:
 * - Status workflow visualization with clickable progression
 * - Budget overview with payment tracking
 * - Tabbed interface for Overview, Platforms, Tasks, Contracts, Invoices, History
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
  FileText,
  History,
  Loader2,
  MoreHorizontal,
  Plus,
  Receipt,
  Settings,
  Trash2,
  CheckSquare,
  ExternalLink,
  User,
  Phone,
  Mail,
  AlertCircle,
  TrendingUp,
  Target,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useUpdateCampaignStatus,
  useCampaignHistory,
  useCampaignFinancials,
  useCampaignContracts,
} from '@/api/hooks/useCampaigns'
import { formatMoney, formatDate, formatDateTime, cn } from '@/lib/utils'
import type { CampaignStatus } from '@/types/campaign'
import {
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_TYPE_CONFIG,
  PLATFORM_CONFIG,
  ACTIVE_STATUSES,
  STATUS_FLOW,
} from '@/types/campaign'
import { SubCampaignsList } from './components/SubCampaignsList'
import { GenerateContractModal } from './components/GenerateContractModal'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaignId = parseInt(id || '0')

  const [activeTab, setActiveTab] = useState('overview')
  const [showAddSubCampaign, setShowAddSubCampaign] = useState(false)
  const [showGenerateContract, setShowGenerateContract] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState<CampaignStatus | null>(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)

  // Fetch campaign data
  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const { data: history } = useCampaignHistory(campaignId)
  const { data: financials } = useCampaignFinancials(campaignId)
  const { data: contracts } = useCampaignContracts(campaignId)

  // Mutations
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()
  const updateStatus = useUpdateCampaignStatus()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !campaign) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
          <p className="text-muted-foreground mb-4">
            The campaign you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/campaigns')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </AppLayout>
    )
  }

  const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status]
  const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.campaign_type]
  const isActive = ACTIVE_STATUSES.includes(campaign.status)

  // Budget calculations
  const totalBudget = parseFloat(campaign.total_budget || '0')
  const totalSpent = parseFloat(campaign.total_spent || '0')
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const handleStatusChange = async (newStatus: CampaignStatus) => {
    try {
      await updateStatus.mutateAsync({
        id: campaignId,
        status: newStatus,
      })
      setShowStatusConfirm(null)
    } catch {
      // Error handled by mutation
    }
  }

  // Get current status index in flow
  const currentStatusIndex = STATUS_FLOW.indexOf(campaign?.status || 'lead')
  const isTerminalStatus = campaign?.status === 'lost' || campaign?.status === 'cancelled'

  // Check if a status is clickable (next step or previous steps)
  const canTransitionTo = (status: CampaignStatus) => {
    if (!campaign || isTerminalStatus) return false
    const targetIndex = STATUS_FLOW.indexOf(status)
    // Can go to next status or back to any previous status
    return targetIndex <= currentStatusIndex + 1 && targetIndex >= 0
  }

  const handleSaveNotes = async () => {
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { notes: notesValue },
      })
      setIsEditingNotes(false)
    } catch {
      // Error handled by mutation
    }
  }

  const handleSaveStartDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
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
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { end_date: format(date, 'yyyy-MM-dd') },
      })
      setEndDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleClearEndDate = async () => {
    setIsSavingDates(true)
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { end_date: null },
      })
      setEndDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaignId)
      navigate('/campaigns')
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6 space-y-6">
        {/* Back Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/campaigns')}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-white/10 p-8 shadow-xl">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Top Row: Campaign Info & Actions */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {/* Type Badge */}
                <Badge variant="outline" className="text-xs px-2 py-0.5 mb-3">
                  {typeConfig.emoji} {typeConfig.label}
                </Badge>

                {/* Campaign Name */}
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {campaign.name}
                </h1>

                {/* Client Info */}
                <div className="flex items-center gap-3 text-muted-foreground">
                  {campaign.client.image_url ? (
                    <img
                      src={campaign.client.image_url}
                      alt={campaign.client.display_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <Building2 className="h-4 w-4" />
                    </div>
                  )}
                  <Link
                    to={`/entities/${campaign.client.id}`}
                    className="hover:text-primary transition-colors font-medium"
                  >
                    {campaign.client.display_name}
                  </Link>
                  <>
                    <span>•</span>
                    <button
                      onClick={() => !campaign.start_date ? setStartDateOpen(true) : !campaign.end_date ? setEndDateOpen(true) : setStartDateOpen(true)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 -my-1 rounded-lg transition-colors",
                        "hover:bg-white/10",
                        (!campaign.start_date || !campaign.end_date) && "text-amber-400"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {campaign.start_date && campaign.end_date ? (
                        <>
                          {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                        </>
                      ) : campaign.start_date ? (
                        <span className="text-sm">{formatDate(campaign.start_date)} - <span className="italic">Set end</span></span>
                      ) : (
                        <span className="text-sm">Set dates</span>
                      )}
                    </button>
                  </>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setActiveTab('subcampaigns')
                    setShowAddSubCampaign(true)
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Platform
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-xl border-white/10">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(`/campaigns/${campaignId}/edit`)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowGenerateContract(true)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Contract
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Receipt className="mr-2 h-4 w-4" />
                      Create Invoice
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {/* Status change options */}
                    {!isTerminalStatus && (
                      <>
                        <DropdownMenuItem
                          onClick={() => setShowStatusConfirm('lost')}
                          className="text-red-500 focus:text-red-500"
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Mark as Lost
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowStatusConfirm('cancelled')}
                          className="text-muted-foreground"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Campaign
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Campaign
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Status Workflow Tracker */}
            {isTerminalStatus ? (
              <div className="p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-white/10 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <Badge
                    className={cn(
                      'text-sm px-4 py-1.5',
                      statusConfig.bgColor,
                      statusConfig.color
                    )}
                  >
                    {statusConfig.emoji} {statusConfig.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {campaign.status === 'lost'
                      ? 'This campaign was marked as lost'
                      : 'This campaign was cancelled'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-white/10 mb-6">
                <div className="flex items-center justify-between">
                  {STATUS_FLOW.map((status, index) => {
                    const config = CAMPAIGN_STATUS_CONFIG[status]
                    const isCompleted = index < currentStatusIndex
                    const isCurrent = status === campaign.status
                    const isNext = index === currentStatusIndex + 1
                    const isClickable = canTransitionTo(status) && !isCurrent

                    return (
                      <div key={status} className="flex items-center flex-1">
                        {/* Status Step */}
                        <button
                          onClick={() => isClickable && setShowStatusConfirm(status)}
                          disabled={!isClickable}
                          className={cn(
                            'flex flex-col items-center gap-1.5 flex-1 py-2 px-1 rounded-xl transition-all',
                            isClickable && 'cursor-pointer hover:bg-muted/50',
                            !isClickable && !isCurrent && 'opacity-50'
                          )}
                        >
                          {/* Circle */}
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                              isCompleted && 'bg-primary border-primary text-primary-foreground',
                              isCurrent && 'border-primary bg-primary/20 ring-4 ring-primary/20',
                              isNext && 'border-dashed border-muted-foreground/50',
                              !isCompleted && !isCurrent && !isNext && 'border-muted-foreground/30'
                            )}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <span className="text-lg">{config.emoji}</span>
                            )}
                          </div>
                          {/* Label */}
                          <span
                            className={cn(
                              'text-xs font-medium',
                              isCurrent && 'text-primary',
                              isCompleted && 'text-muted-foreground',
                              !isCompleted && !isCurrent && 'text-muted-foreground/70'
                            )}
                          >
                            {config.label}
                          </span>
                        </button>

                        {/* Connector */}
                        {index < STATUS_FLOW.length - 1 && (
                          <div className="flex-shrink-0 px-1">
                            <ChevronRight
                              className={cn(
                                'h-4 w-4',
                                index < currentStatusIndex
                                  ? 'text-primary'
                                  : 'text-muted-foreground/30'
                              )}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Budget & Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Budget */}
              <Card className="p-4 rounded-xl border-white/10 bg-background/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                    <p className="text-lg font-semibold truncate">
                      {totalBudget > 0 ? formatMoney(totalBudget, 'EUR') : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Spent */}
              <Card className="p-4 rounded-xl border-white/10 bg-background/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="text-lg font-semibold truncate">
                      {totalSpent > 0 ? formatMoney(totalSpent, 'EUR') : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Remaining */}
              <Card className="p-4 rounded-xl border-white/10 bg-background/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Target className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold truncate">
                      {totalBudget > 0 ? formatMoney(totalBudget - totalSpent, 'EUR') : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Platforms */}
              <Card className="p-4 rounded-xl border-white/10 bg-background/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Settings className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Platforms</p>
                    <p className="text-lg font-semibold">
                      {campaign.subcampaign_count || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Budget Progress Bar */}
            {totalBudget > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-background/30 border border-white/10">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium">{utilization.toFixed(1)}%</span>
                </div>
                <Progress value={utilization} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="p-1 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10 h-12">
            <TabsTrigger value="overview" className="rounded-lg gap-2 px-4">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="subcampaigns" className="rounded-lg gap-2 px-4">
              <DollarSign className="h-4 w-4" />
              Platforms
              {campaign.subcampaign_count !== undefined && campaign.subcampaign_count > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {campaign.subcampaign_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-lg gap-2 px-4">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="contracts" className="rounded-lg gap-2 px-4">
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-lg gap-2 px-4">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2 px-4">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            {/* Missing Dates Alert */}
            {(!campaign.start_date || !campaign.end_date) && (
              <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-amber-600 dark:text-amber-400">
                    {!campaign.start_date && !campaign.end_date
                      ? 'Campaign dates are not set. Both dates are required for contracts.'
                      : !campaign.start_date
                      ? 'Start date is not set. Required for contracts.'
                      : 'End date is not set. Required for contracts.'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4 rounded-lg border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                    onClick={() => !campaign.start_date ? setStartDateOpen(true) : setEndDateOpen(true)}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    Set {!campaign.start_date ? 'Start' : 'End'} Date
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Subcampaigns Summary */}
                <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Platforms & Budgets
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveTab('subcampaigns')
                          setShowAddSubCampaign(true)
                        }}
                        className="rounded-lg h-8"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                      {campaign.subcampaigns && campaign.subcampaigns.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('subcampaigns')}
                          className="rounded-lg h-8"
                        >
                          View All
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {campaign.subcampaigns && campaign.subcampaigns.length > 0 ? (
                    <div className="space-y-3">
                      {campaign.subcampaigns.slice(0, 5).map((sub) => {
                        const platformConfig = PLATFORM_CONFIG[sub.platform]
                        const subBudget = parseFloat(sub.budget)
                        const subSpent = parseFloat(sub.spent)
                        const subUtil = subBudget > 0 ? (subSpent / subBudget) * 100 : 0
                        const hasRevenue = sub.payment_method === 'revenue_share' || sub.payment_method === 'hybrid'

                        return (
                          <div
                            key={sub.id}
                            className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setActiveTab('subcampaigns')}
                          >
                            <div className="flex items-start gap-4">
                              <span className="text-2xl">{platformConfig.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                      {platformConfig.label}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-xs',
                                        sub.status === 'active' && 'border-green-500/50 text-green-500',
                                        sub.status === 'paused' && 'border-amber-500/50 text-amber-500',
                                        sub.status === 'completed' && 'border-blue-500/50 text-blue-500'
                                      )}
                                    >
                                      {sub.status_display || sub.status}
                                    </Badge>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {formatMoney(subBudget, sub.currency)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <span>{sub.service_type_display || sub.service_type}</span>
                                  <span>•</span>
                                  <span>{sub.payment_method_display || sub.payment_method}</span>
                                  {hasRevenue && sub.revenue_share_percentage && (
                                    <>
                                      <span>•</span>
                                      <span>{sub.revenue_share_percentage}% rev share</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress value={subUtil} className="h-1.5 flex-1" />
                                  <span className="text-xs text-muted-foreground w-16 text-right">
                                    {formatMoney(subSpent, sub.currency)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {campaign.subcampaigns.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          +{campaign.subcampaigns.length - 5} more platforms
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📍</div>
                      <p className="text-muted-foreground mb-4">
                        No platforms added yet
                      </p>
                      <Button
                        onClick={() => {
                          setActiveTab('subcampaigns')
                          setShowAddSubCampaign(true)
                        }}
                        variant="outline"
                        className="rounded-xl"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Platform
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Songs & Artists across all subcampaigns */}
                {campaign.subcampaigns && campaign.subcampaigns.some(s => (s.songs?.length || 0) > 0 || (s.artists?.length || 0) > 0) && (
                  <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <h3 className="font-semibold mb-4">Content</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Songs */}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Songs</p>
                        <div className="space-y-1.5">
                          {Array.from(
                            new Map(
                              campaign.subcampaigns
                                .flatMap(s => s.songs || [])
                                .map(song => [song.id, song])
                            ).values()
                          ).slice(0, 5).map((song) => (
                            <div
                              key={song.id}
                              className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30"
                            >
                              <span>🎵</span>
                              <span className="truncate">{song.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Artists */}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Artists</p>
                        <div className="space-y-1.5">
                          {Array.from(
                            new Map(
                              campaign.subcampaigns
                                .flatMap(s => s.artists || [])
                                .map(artist => [artist.id, artist])
                            ).values()
                          ).slice(0, 5).map((artist) => (
                            <div
                              key={artist.id}
                              className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30"
                            >
                              {artist.image_url ? (
                                <img
                                  src={artist.image_url}
                                  alt={artist.display_name || 'Artist'}
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                  {artist.display_name?.charAt(0) || '?'}
                                </div>
                              )}
                              <span className="truncate">{artist.display_name || 'Unknown'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Notes */}
                <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      Notes
                    </h3>
                    {!isEditingNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNotesValue(campaign.notes || '')
                          setIsEditingNotes(true)
                        }}
                        className="h-8"
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-3">
                      <Textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Add notes about this campaign..."
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingNotes(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={updateCampaign.isPending}
                        >
                          {updateCampaign.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : campaign.notes ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {campaign.notes}
                    </p>
                  ) : (
                    <button
                      onClick={() => {
                        setNotesValue('')
                        setIsEditingNotes(true)
                      }}
                      className="w-full p-4 rounded-xl border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm"
                    >
                      Click to add notes...
                    </button>
                  )}
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Client Card */}
                <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Client
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    {campaign.client.image_url ? (
                      <img
                        src={campaign.client.image_url}
                        alt={campaign.client.display_name || 'Client'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-xl font-semibold">
                          {campaign.client.display_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{campaign.client.display_name || 'Unknown Client'}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {campaign.client.kind === 'PJ' ? 'Company' : 'Individual'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => navigate(`/entities/${campaign.client.id}`)}
                  >
                    View Client Profile
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Card>

                {/* Contact Person */}
                {campaign.contact_person && (
                  <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Person
                    </h3>
                    <div className="space-y-3">
                      <p className="font-medium">{campaign.contact_person.name}</p>
                      {campaign.contact_person.role_display && (
                        <p className="text-sm text-muted-foreground">
                          {campaign.contact_person.role_display}
                        </p>
                      )}
                      {campaign.contact_person.email && (
                        <a
                          href={`mailto:${campaign.contact_person.email}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          {campaign.contact_person.email}
                        </a>
                      )}
                      {campaign.contact_person.phone && (
                        <a
                          href={`tel:${campaign.contact_person.phone}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          {campaign.contact_person.phone}
                        </a>
                      )}
                    </div>
                  </Card>
                )}

                {/* Campaign Details */}
                <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <h3 className="font-semibold mb-4">Details</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd>{formatDate(campaign.created_at)}</dd>
                    </div>

                    {/* Start Date - Editable */}
                    <div className="flex justify-between items-center">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        Start Date
                        {!campaign.start_date && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Required for contracts" />
                        )}
                      </dt>
                      <dd>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 -mr-2 rounded-lg transition-colors",
                                "hover:bg-muted/50",
                                !campaign.start_date && "text-amber-500"
                              )}
                              disabled={isSavingDates}
                            >
                              {isSavingDates ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CalendarIcon className="h-3 w-3" />
                              )}
                              {campaign.start_date ? formatDate(campaign.start_date) : 'Set date'}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={campaign.start_date ? new Date(campaign.start_date) : undefined}
                              onSelect={handleSaveStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </dd>
                    </div>

                    {/* End Date - Editable */}
                    <div className="flex justify-between items-center">
                      <dt className="text-muted-foreground flex items-center gap-1.5">
                        End Date
                        {!campaign.end_date && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Required for contracts" />
                        )}
                      </dt>
                      <dd>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 -mr-2 rounded-lg transition-colors",
                                "hover:bg-muted/50",
                                !campaign.end_date && "text-amber-500"
                              )}
                              disabled={isSavingDates}
                            >
                              {isSavingDates ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CalendarIcon className="h-3 w-3" />
                              )}
                              {campaign.end_date ? formatDate(campaign.end_date) : 'Set date'}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={campaign.end_date ? new Date(campaign.end_date) : undefined}
                              onSelect={handleSaveEndDate}
                              disabled={(date) =>
                                campaign.start_date ? date < new Date(campaign.start_date) : false
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </dd>
                    </div>

                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Platforms</dt>
                      <dd>{campaign.subcampaign_count || 0}</dd>
                    </div>
                  </dl>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* SubCampaigns Tab */}
          <TabsContent value="subcampaigns" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Platforms</h3>
              <Button
                onClick={() => setShowAddSubCampaign(true)}
                variant="outline"
                className="rounded-xl"
                disabled={showAddSubCampaign}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Platform
              </Button>
            </div>
            <SubCampaignsList
              campaignId={campaignId}
              showAddForm={showAddSubCampaign}
              onAddFormClose={() => setShowAddSubCampaign(false)}
            />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Tasks Coming Soon</h3>
              <p className="text-muted-foreground">
                Track campaign tasks and deadlines here
              </p>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-6">
            {(() => {
              // Compute contract state for smart UI
              const mainContract = contracts?.find(c => !c.is_annex)
              const hasMainContract = !!mainContract
              const mainContractSigned = mainContract?.contract_status === 'signed'
              const buttonLabel = hasMainContract ? 'Generate Annex' : 'Generate Contract'

              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Contracts</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage campaign contracts and agreements
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowGenerateContract(true)}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {buttonLabel}
                    </Button>
                  </div>

                  {/* Contracts List */}
                  {contracts && contracts.length > 0 ? (
                    <div className="grid gap-4">
                      {/* Main Contract First */}
                      {contracts
                        .slice()
                        .sort((a, b) => {
                          // Main contract first, then annexes by date
                          if (!a.is_annex && b.is_annex) return -1
                          if (a.is_annex && !b.is_annex) return 1
                          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        })
                        .map((contract) => (
                        <Card
                          key={contract.id}
                          className={cn(
                            "p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm hover:bg-muted/30 transition-colors",
                            !contract.is_annex && "border-l-4 border-l-indigo-500"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "p-3 rounded-xl",
                                contract.is_annex ? "bg-purple-500/20" : "bg-indigo-500/20"
                              )}>
                                <FileText className={cn(
                                  "h-5 w-5",
                                  contract.is_annex ? "text-purple-500" : "text-indigo-500"
                                )} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {contract.contract_title || contract.contract_number || `Contract #${contract.contract}`}
                                  </p>
                                  {contract.is_annex ? (
                                    <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-500">
                                      Annex
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs border-indigo-500/50 text-indigo-500">
                                      Main
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {contract.is_annex && contract.parent_contract_number && (
                                    <>Parent: {contract.parent_contract_number} &bull; </>
                                  )}
                                  {formatDate(contract.created_at)}
                                  {contract.created_by_name && ` by ${contract.created_by_name}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {contract.contract_status && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    contract.contract_status === 'signed' && 'border-green-500/50 text-green-500',
                                    contract.contract_status === 'pending_signature' && 'border-amber-500/50 text-amber-500',
                                    contract.contract_status === 'draft' && 'border-gray-500/50 text-gray-500',
                                    contract.contract_status === 'processing' && 'border-blue-500/50 text-blue-500'
                                  )}
                                >
                                  {contract.contract_status === 'pending_signature' ? 'Pending Signature' : contract.contract_status}
                                </Badge>
                              )}
                              {contract.contract_gdrive_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-lg"
                                  onClick={() => window.open(contract.contract_gdrive_url, '_blank')}
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-indigo-500" />
                      </div>
                      <h4 className="font-semibold mb-2">No contracts yet</h4>
                      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                        Generate a contract to formalize the agreement with your client.
                        The contract template will be auto-selected based on your department.
                      </p>
                      <Button
                        onClick={() => setShowGenerateContract(true)}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Contract
                      </Button>
                    </Card>
                  )}

                  {/* Contract Info */}
                  <Card className="p-5 rounded-2xl border-white/10 bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <AlertCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Smart Contract Generation</p>
                        <p className="text-muted-foreground">
                          {hasMainContract ? (
                            mainContractSigned ? (
                              'The main contract is signed. New platforms will be covered by generating an annex.'
                            ) : (
                              'The main contract is being processed. Once signed, you can generate annexes for new platforms.'
                            )
                          ) : (
                            'Generate the main contract first. It will cover all current platforms. Add more platforms later with annexes.'
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })()}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-6">
            <div className="space-y-6">
              {/* Header with Summary */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Invoices & Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Track payments and invoice status for this campaign
                  </p>
                </div>
                <Button className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>

              {/* Payment Summary Cards */}
              {totalBudget > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                        <p className="text-lg font-semibold">{formatMoney(totalBudget, 'EUR')}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Check className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Received</p>
                        <p className="text-lg font-semibold">{formatMoney(totalSpent, 'EUR')}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Target className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className="text-lg font-semibold">{formatMoney(totalBudget - totalSpent, 'EUR')}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Invoice List Placeholder - Will be populated when invoice data is available */}
              <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-emerald-500" />
                </div>
                <h4 className="font-semibold mb-2">No invoices yet</h4>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                  Create invoices to track payments from your client.
                  Invoices can be linked to specific platforms or the entire campaign.
                </p>
                <Button className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Invoice
                </Button>
              </Card>

              {/* Payment Schedule by Platform */}
              {campaign.subcampaigns && campaign.subcampaigns.length > 0 && (
                <Card className="p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Payment by Platform
                  </h4>
                  <div className="space-y-3">
                    {campaign.subcampaigns.map((sub) => {
                      const platformConfig = PLATFORM_CONFIG[sub.platform]
                      const subBudget = parseFloat(sub.budget)
                      const subSpent = parseFloat(sub.spent)

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{platformConfig.emoji}</span>
                            <div>
                              <p className="font-medium text-sm">{platformConfig.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {sub.payment_method_display || sub.payment_method}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatMoney(subBudget, sub.currency)}</p>
                            <p className="text-xs text-muted-foreground">
                              {subSpent > 0 ? `${formatMoney(subSpent, sub.currency)} received` : 'Pending'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Activity History
                </h3>
                {history && history.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {history.length} events
                  </Badge>
                )}
              </div>

              {history && history.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-muted to-transparent" />

                  <div className="space-y-1">
                    {history.map((entry) => {
                      // Event type icon/emoji mapping
                      const eventConfig: Record<string, { icon: string; color: string }> = {
                        created: { icon: '🆕', color: 'bg-green-500' },
                        status_changed: { icon: '🔄', color: 'bg-blue-500' },
                        subcampaign_added: { icon: '➕', color: 'bg-emerald-500' },
                        subcampaign_removed: { icon: '➖', color: 'bg-red-500' },
                        budget_updated: { icon: '💰', color: 'bg-amber-500' },
                        contract_signed: { icon: '✍️', color: 'bg-purple-500' },
                        contract_added: { icon: '📄', color: 'bg-indigo-500' },
                        note_added: { icon: '📝', color: 'bg-cyan-500' },
                        assignment_added: { icon: '👤', color: 'bg-pink-500' },
                        assignment_removed: { icon: '👋', color: 'bg-orange-500' },
                        field_changed: { icon: '✏️', color: 'bg-gray-500' },
                      }
                      const config = eventConfig[entry.event_type] || { icon: '•', color: 'bg-primary' }

                      return (
                        <div
                          key={entry.id}
                          className="relative pl-12 py-3 pr-4 hover:bg-muted/30 rounded-xl transition-colors group"
                        >
                          {/* Timeline dot with icon */}
                          <div
                            className={cn(
                              'absolute left-2 top-3.5 w-8 h-8 rounded-full flex items-center justify-center text-sm',
                              config.color + '/20',
                              'ring-2 ring-background'
                            )}
                          >
                            {config.icon}
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">
                                  {entry.event_type_display || entry.event_type.replace(/_/g, ' ')}
                                </p>
                                {entry.created_by_name && (
                                  <span className="text-xs text-muted-foreground">
                                    by {entry.created_by_name}
                                  </span>
                                )}
                              </div>
                              {entry.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {entry.description}
                                </p>
                              )}
                              {entry.old_value && entry.new_value && (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 line-through">
                                    {entry.old_value}
                                  </span>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                                    {entry.new_value}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(entry.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-1">No activity recorded yet</p>
                  <p className="text-xs text-muted-foreground">
                    Events will appear here as you make changes
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate Contract Modal */}
      {campaign && (
        <GenerateContractModal
          campaign={campaign}
          open={showGenerateContract}
          onOpenChange={setShowGenerateContract}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
              All subcampaigns and related data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCampaign.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Transition Confirmation */}
      <AlertDialog
        open={showStatusConfirm !== null}
        onOpenChange={(open) => !open && setShowStatusConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showStatusConfirm === 'lost'
                ? 'Mark Campaign as Lost'
                : showStatusConfirm === 'cancelled'
                ? 'Cancel Campaign'
                : `Move to ${showStatusConfirm ? CAMPAIGN_STATUS_CONFIG[showStatusConfirm]?.label : ''}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showStatusConfirm === 'lost' ? (
                <>
                  Are you sure you want to mark this campaign as lost? This will move the campaign
                  out of the active workflow.
                </>
              ) : showStatusConfirm === 'cancelled' ? (
                <>
                  Are you sure you want to cancel this campaign? This will move the campaign
                  out of the active workflow.
                </>
              ) : (
                <>
                  Move campaign from{' '}
                  <strong>{CAMPAIGN_STATUS_CONFIG[campaign.status]?.label}</strong> to{' '}
                  <strong>{showStatusConfirm ? CAMPAIGN_STATUS_CONFIG[showStatusConfirm]?.label : ''}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showStatusConfirm && handleStatusChange(showStatusConfirm)}
              className={cn(
                showStatusConfirm === 'lost' && 'bg-red-500 hover:bg-red-600',
                showStatusConfirm === 'cancelled' && 'bg-gray-500 hover:bg-gray-600'
              )}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {showStatusConfirm && CAMPAIGN_STATUS_CONFIG[showStatusConfirm]?.emoji}{' '}
                  {showStatusConfirm === 'lost'
                    ? 'Mark as Lost'
                    : showStatusConfirm === 'cancelled'
                    ? 'Cancel Campaign'
                    : 'Confirm'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
