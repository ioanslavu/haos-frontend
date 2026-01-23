/**
 * CampaignDetailPage - Detailed view of a single campaign
 *
 * Features:
 * - Status workflow visualization with clickable progression
 * - Budget overview with payment tracking
 * - Tabbed interface for Overview, Platforms, Tasks, Contracts, Invoices, History
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Edit2,
  FileText,
  History,
  Loader2,
  MoreHorizontal,
  Plus,
  Receipt,
  RefreshCw,
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
  Send,
  X,
  RotateCcw,
} from 'lucide-react'
import { HiSquares2X2 } from 'react-icons/hi2'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  useReopenCampaign,
  useCampaignHistory,
  useCampaignFinancials,
  useCampaignContracts,
  useSendContractForSignature,
  useContractValidation,
  useRefreshSignatureStatus,
  useAllCampaignInvoices,
} from '@/api/hooks/useCampaigns'
import { useEntity, useCreateContactPerson } from '@/api/hooks/useEntities'
import { useClientProfileByEntity } from '@/api/hooks/useClientProfiles'
import { ContactPersonFormDialog } from '@/components/entities/ContactPersonFormDialog'
import type { ContactPerson } from '@/api/services/entities.service'
import type { CampaignContract } from '@/api/services/campaigns.service'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatMoney, formatDate, formatDateTime, cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import type { CampaignStatus } from '@/types/campaign'
import {
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_TYPE_CONFIG,
  PLATFORM_CONFIG,
  ACTIVE_STATUSES,
  STATUS_FLOW,
} from '@/types/campaign'
import {
  CONTACT_ROLE_LABELS,
  ENGAGEMENT_STAGE_LABELS,
  CONTACT_SENTIMENT_LABELS,
  ENGAGEMENT_STAGE_COLORS,
  CONTACT_SENTIMENT_COLORS,
  ContactRole,
  EngagementStage,
  ContactSentiment,
} from '@/types/contact'
import { SubCampaignsList } from './components/SubCampaignsList'
import { GenerateContractModal } from './components/GenerateContractModal'
import { GenerateReportModal } from './components/GenerateReportModal'
import { CampaignNotesSection } from './components/CampaignNotesSection'
import { AssignmentSection } from './components/AssignmentSection'
import { ClientScoreSection } from './components/ClientScoreSection'
import { ContractDetailSheet } from '@/components/contracts/ContractDetailSheet'
import { useRefreshContractGeneration } from '@/api/hooks/useContracts'
import { CampaignTasksTab } from './components/CampaignTasksTab'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const campaignId = parseInt(id || '0')

  const [activeTab, setActiveTab] = useState('overview')
  const [showAddSubCampaign, setShowAddSubCampaign] = useState(false)
  const [showGenerateContract, setShowGenerateContract] = useState(false)
  const [showGenerateReport, setShowGenerateReport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState<CampaignStatus | null>(null)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)
  const [isSavingContactPerson, setIsSavingContactPerson] = useState(false)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [editingContactPerson, setEditingContactPerson] = useState<ContactPerson | null>(null)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  // Send for signature state
  const [sendSignatureContract, setSendSignatureContract] = useState<CampaignContract | null>(null)
  const [signers, setSigners] = useState<Array<{ email: string; name: string; role: string }>>([])
  const [testMode, setTestMode] = useState(true)

  // Contract detail sheet state
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  // Expanded platform invoices state (for Invoices tab)
  const [expandedPlatformId, setExpandedPlatformId] = useState<number | null>(null)

  // Safety cleanup: Remove pointer-events: none from body when dialogs close
  useEffect(() => {
    const allDialogsClosed = !showDeleteConfirm && !showStatusConfirm && !sendSignatureContract && !showGenerateContract && !showGenerateReport
    if (allDialogsClosed) {
      // Clear immediately and after a short delay (for animations)
      document.body.style.pointerEvents = ''
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = ''
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showDeleteConfirm, showStatusConfirm, sendSignatureContract, showGenerateContract, showGenerateReport])

  // Fetch validation data for signers when dialog opens
  const { data: validation, isLoading: validationLoading, refetch: refetchValidation } = useContractValidation(
    campaignId,
    !!sendSignatureContract // Only fetch when dialog is open
  )

  // Auto-populate signers when validation data loads
  useEffect(() => {
    if (validation?.signers && sendSignatureContract) {
      const initialSigners: Array<{ email: string; name: string; role: string }> = []

      // Add HaHaHa rep as first signer (they sign first)
      if (validation.signers.hahaha_rep?.email && validation.signers.hahaha_rep?.name) {
        initialSigners.push({
          email: validation.signers.hahaha_rep.email,
          name: validation.signers.hahaha_rep.name,
          role: validation.signers.hahaha_rep.role || 'HaHaHa Production',
        })
      }

      // Add client as second signer
      if (validation.signers.client) {
        initialSigners.push({
          email: validation.signers.client.email || '',
          name: validation.signers.client.name || '',
          role: validation.signers.client.role || 'Client',
        })
      }

      // Only update if we have signers
      if (initialSigners.length > 0) {
        setSigners(initialSigners)
      }
    }
  }, [validation?.signers, sendSignatureContract])

  // Fetch campaign data
  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const { data: history } = useCampaignHistory(campaignId)
  const { data: financials } = useCampaignFinancials(campaignId)
  const { data: contracts } = useCampaignContracts(campaignId)

  // Fetch all invoices (campaign-level + subcampaign invoices)
  const subcampaignIds = campaign?.subcampaigns?.map(sc => sc.id) || []
  const invoiceData = useAllCampaignInvoices(campaignId, subcampaignIds, !!campaign)

  // Fetch client entity to get contact persons
  const { data: clientEntity } = useEntity(campaign?.client?.id || 0, !!campaign?.client?.id)
  const contactPersons = clientEntity?.contact_persons || []

  // Fetch client health score
  const { data: clientProfile } = useClientProfileByEntity(campaign?.client?.id)

  // Mutations
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()
  const updateStatus = useUpdateCampaignStatus()
  const reopenCampaign = useReopenCampaign()
  const sendForSignature = useSendContractForSignature()
  const refreshSignatureStatus = useRefreshSignatureStatus()
  const refreshContractGeneration = useRefreshContractGeneration()
  const createContactPerson = useCreateContactPerson()

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
    } catch {
      // Error handled by mutation
    } finally {
      setShowStatusConfirm(null)
    }
  }

  // Get current status index in flow
  const currentStatusIndex = STATUS_FLOW.indexOf(campaign?.status || 'lead')
  const isTerminalStatus = campaign?.status === 'completed' || campaign?.status === 'lost' || campaign?.status === 'cancelled'

  // Check if a status is clickable (next step or previous steps)
  const canTransitionTo = (status: CampaignStatus) => {
    if (!campaign || isTerminalStatus) return false
    const targetIndex = STATUS_FLOW.indexOf(status)
    // Can go to next status or back to any previous status
    return targetIndex <= currentStatusIndex + 1 && targetIndex >= 0
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

  const handleChangeContactPerson = async (contactPersonId: string) => {
    setIsSavingContactPerson(true)
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { contact_person: contactPersonId === 'none' ? null : parseInt(contactPersonId) },
      })
      // Wait for the campaign query to refetch with fresh data
      await queryClient.refetchQueries({ queryKey: ['campaigns', 'detail', campaignId] })
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingContactPerson(false)
    }
  }

  const handleCreateContactPerson = async () => {
    if (!newContactName.trim() || !campaign?.client?.id) return

    try {
      const newContact = await createContactPerson.mutateAsync({
        entity: campaign.client.id,
        name: newContactName.trim(),
        emails: newContactEmail.trim() ? [{ email: newContactEmail.trim(), is_primary: true }] : [],
        phones: newContactPhone.trim() ? [{ phone: newContactPhone.trim(), is_primary: true }] : [],
      })
      // Set the new contact as the campaign's contact person
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { contact_person: newContact.id },
      })
      // Wait for queries to refetch with fresh data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['campaigns', 'detail', campaignId] }),
        queryClient.refetchQueries({ queryKey: ['entities', 'detail', campaign.client.id] }),
      ])
      // Reset form
      setShowCreateContact(false)
      setNewContactName('')
      setNewContactEmail('')
      setNewContactPhone('')
    } catch {
      // Error handled by mutation
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaignId)
      setShowDeleteConfirm(false)
      navigate('/campaigns')
    } catch {
      // Error handled by mutation
      setShowDeleteConfirm(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
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

        {/* Compact Header Card */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
          <div className="p-5 space-y-4">
            {/* Row 1: Title, Client, Status, Actions */}
            <div className="flex items-center justify-between gap-6">
              {/* Left: Title and Client */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold truncate">{campaign.name}</h1>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {typeConfig.emoji} {typeConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link
                      to={`/entities/${campaign.client.id}`}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      {campaign.client.image_url ? (
                        <img
                          src={campaign.client.image_url}
                          alt={campaign.client.display_name}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      <span className="font-medium">{campaign.client.display_name}</span>
                      {clientProfile?.health_score && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 ml-1",
                            clientProfile.health_score <= 3 && "border-red-500 text-red-500",
                            clientProfile.health_score > 3 && clientProfile.health_score <= 6 && "border-yellow-500 text-yellow-500",
                            clientProfile.health_score > 6 && "border-green-500 text-green-500"
                          )}
                        >
                          {clientProfile.health_score}/10
                        </Badge>
                      )}
                    </Link>
                    <span className="text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
                              !campaign.start_date && "text-amber-500"
                            )}
                            disabled={isSavingDates}
                          >
                            {campaign.start_date ? formatDate(campaign.start_date) : 'Start'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={campaign.start_date ? new Date(campaign.start_date) : undefined}
                            onSelect={handleSaveStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <span className="text-muted-foreground/50">-</span>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
                              !campaign.end_date && "text-amber-500"
                            )}
                            disabled={isSavingDates}
                          >
                            {campaign.end_date ? formatDate(campaign.end_date) : 'End'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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
                    </div>
                    <span className="text-muted-foreground/50">•</span>
                    {/* Contact Person */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
                            !campaign.contact_person && "text-amber-500"
                          )}
                          disabled={isSavingContactPerson}
                        >
                          <User className="h-3.5 w-3.5" />
                          {isSavingContactPerson ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : campaign.contact_person ? (
                            <span>{campaign.contact_person.name}</span>
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
                              {campaign.contact_person ? (
                                <div className="space-y-2">
                                  {/* Contact person name with remove button */}
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{campaign.contact_person.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleChangeContactPerson('none')}
                                      disabled={isSavingContactPerson}
                                      title="Remove contact person"
                                    >
                                      {isSavingContactPerson ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  {/* Role, Engagement, Sentiment badges */}
                                  <div className="flex flex-wrap gap-1">
                                    {campaign.contact_person.role && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {CONTACT_ROLE_LABELS[campaign.contact_person.role as ContactRole] || campaign.contact_person.role}
                                      </Badge>
                                    )}
                                    {campaign.contact_person.engagement_stage && (
                                      <Badge className={cn("text-[10px] px-1.5 py-0", ENGAGEMENT_STAGE_COLORS[campaign.contact_person.engagement_stage as EngagementStage])}>
                                        {ENGAGEMENT_STAGE_LABELS[campaign.contact_person.engagement_stage as EngagementStage]?.split(' ')[0] || campaign.contact_person.engagement_stage}
                                      </Badge>
                                    )}
                                    {campaign.contact_person.sentiment && (
                                      <Badge className={cn("text-[10px] px-1.5 py-0", CONTACT_SENTIMENT_COLORS[campaign.contact_person.sentiment as ContactSentiment])}>
                                        {CONTACT_SENTIMENT_LABELS[campaign.contact_person.sentiment as ContactSentiment]?.split(' ')[0] || campaign.contact_person.sentiment}
                                      </Badge>
                                    )}
                                  </div>
                                  {/* Contact info */}
                                  <div className="space-y-1 text-xs">
                                    {campaign.contact_person.emails?.[0]?.email && (
                                      <a
                                        href={`mailto:${campaign.contact_person.emails[0].email}`}
                                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        <Mail className="h-3 w-3" />
                                        {campaign.contact_person.emails[0].email}
                                      </a>
                                    )}
                                    {campaign.contact_person.phones?.[0]?.phone && (
                                      <a
                                        href={`tel:${campaign.contact_person.phones[0].phone}`}
                                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        <Phone className="h-3 w-3" />
                                        {campaign.contact_person.phones[0].phone}
                                      </a>
                                    )}
                                  </div>
                                  {/* Edit button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-7 text-xs mt-1"
                                    onClick={() => setEditingContactPerson(campaign.contact_person!)}
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit Contact
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {contactPersons.length > 0 ? (
                                    contactPersons.map((cp) => (
                                      <button
                                        key={cp.id}
                                        onClick={() => handleChangeContactPerson(cp.id.toString())}
                                        disabled={isSavingContactPerson}
                                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors disabled:opacity-50"
                                      >
                                        {cp.name}
                                      </button>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      No contacts yet. Click "New" to create one.
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Client Health Scores */}
                              {clientProfile && (
                                <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
                                  <div className="text-xs font-medium flex items-center gap-1.5">
                                    <TrendingUp className="h-3 w-3" />
                                    Client Health
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                                    <div className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                                      <span className="text-muted-foreground">Collaboration</span>
                                      <span className={cn(
                                        "font-medium",
                                        !clientProfile.collaboration_frequency_score && "text-muted-foreground",
                                        clientProfile.collaboration_frequency_score && clientProfile.collaboration_frequency_score <= 3 && "text-red-500",
                                        clientProfile.collaboration_frequency_score && clientProfile.collaboration_frequency_score > 3 && clientProfile.collaboration_frequency_score <= 6 && "text-yellow-500",
                                        clientProfile.collaboration_frequency_score && clientProfile.collaboration_frequency_score > 6 && "text-green-500"
                                      )}>
                                        {clientProfile.collaboration_frequency_score ?? '-'}/10
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                                      <span className="text-muted-foreground">Feedback</span>
                                      <span className={cn(
                                        "font-medium",
                                        !clientProfile.feedback_score && "text-muted-foreground",
                                        clientProfile.feedback_score && clientProfile.feedback_score <= 3 && "text-red-500",
                                        clientProfile.feedback_score && clientProfile.feedback_score > 3 && clientProfile.feedback_score <= 6 && "text-yellow-500",
                                        clientProfile.feedback_score && clientProfile.feedback_score > 6 && "text-green-500"
                                      )}>
                                        {clientProfile.feedback_score ?? '-'}/10
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between p-1.5 rounded bg-muted/30 col-span-2">
                                      <span className="text-muted-foreground">Payment Timeliness</span>
                                      <span className={cn(
                                        "font-medium",
                                        !clientProfile.payment_latency_score && "text-muted-foreground",
                                        clientProfile.payment_latency_score && clientProfile.payment_latency_score <= 3 && "text-red-500",
                                        clientProfile.payment_latency_score && clientProfile.payment_latency_score > 3 && clientProfile.payment_latency_score <= 6 && "text-yellow-500",
                                        clientProfile.payment_latency_score && clientProfile.payment_latency_score > 6 && "text-green-500"
                                      )}>
                                        {clientProfile.payment_latency_score ?? '-'}/10
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {/* Contract Status Badge */}
                    <span className="text-muted-foreground/50">•</span>
                    {(() => {
                      const mainContract = contracts?.find(c => !c.is_annex)
                      if (mainContract) {
                        const status = mainContract.contract_status
                        return (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs gap-1",
                              status === 'signed'
                                ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                                : status === 'pending_signature'
                                ? 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                                : 'border-muted-foreground/50 text-muted-foreground'
                            )}
                          >
                            <FileText className="h-3 w-3" />
                            Contract {status === 'signed' ? 'Signed' :
                             status === 'pending_signature' ? 'Pending' :
                             status === 'draft' ? 'Draft' : ''}
                          </Badge>
                        )
                      }
                      return (
                        <Badge
                          variant="outline"
                          className="text-xs gap-1 border-muted-foreground/30 text-muted-foreground/60"
                        >
                          <FileText className="h-3 w-3" />
                          No Contract
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Center: Status Flow */}
              <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
                {isTerminalStatus ? (
                  <Badge
                    className={cn(
                      'text-xs px-3 py-1.5',
                      statusConfig.bgColor,
                      statusConfig.color
                    )}
                  >
                    {statusConfig.emoji} {statusConfig.label}
                  </Badge>
                ) : (
                  STATUS_FLOW.map((status, index) => {
                    const config = CAMPAIGN_STATUS_CONFIG[status]
                    const isCompleted = index < currentStatusIndex
                    const isCurrent = status === campaign.status
                    const isNext = index === currentStatusIndex + 1
                    const isClickable = canTransitionTo(status) && !isCurrent

                    return (
                      <div key={status} className="flex items-center">
                        <button
                          onClick={() => isClickable && setShowStatusConfirm(status)}
                          disabled={!isClickable}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                            isCurrent && 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md',
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
                            {config.label}
                          </span>
                        </button>
                        {index < STATUS_FLOW.length - 1 && (
                          <ChevronRight className={cn(
                            'h-3 w-3 mx-0.5 shrink-0',
                            index < currentStatusIndex ? 'text-primary' : 'text-muted-foreground/30'
                          )} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Generate Report Button - only for completed campaigns */}
                {campaign.status === 'completed' && (
                  <Button
                    onClick={() => setShowGenerateReport(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-purple-500/30 text-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* Mark as Lost - only from LEAD or NEGOTIATION */}
                    {(campaign.status === 'lead' || campaign.status === 'negotiation') && (
                      <DropdownMenuItem
                        onClick={() => setShowStatusConfirm('lost')}
                        className="text-red-500 focus:text-red-500"
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Mark as Lost
                      </DropdownMenuItem>
                    )}
                    {/* Cancel - from LEAD, NEGOTIATION, CONFIRMED, or ACTIVE */}
                    {!isTerminalStatus && (
                      <DropdownMenuItem
                        onClick={() => setShowStatusConfirm('cancelled')}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Campaign
                      </DropdownMenuItem>
                    )}
                    {/* Mark as Completed - only from ACTIVE */}
                    {campaign.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() => setShowStatusConfirm('completed')}
                        className="text-green-500 focus:text-green-500"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </DropdownMenuItem>
                    )}
                    {!isTerminalStatus && <DropdownMenuSeparator />}
                    {/* Reopen - from terminal states */}
                    {isTerminalStatus && (
                      <>
                        <DropdownMenuItem
                          onClick={() => reopenCampaign.mutate(campaignId)}
                          className="text-blue-500 focus:text-blue-500"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reopen Campaign
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Campaign
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Row 2: Budget Stats Inline + Progress */}
            <div className="flex items-center gap-4 pt-2 border-t border-white/10">
              {/* Budget Stats */}
              <div className="flex items-center gap-6 flex-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/20">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Budget</p>
                    <p className="text-sm font-semibold">
                      {totalBudget > 0 ? formatMoney(totalBudget, 'EUR') : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-500/20">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Spent</p>
                    <p className="text-sm font-semibold">
                      {totalSpent > 0 ? formatMoney(totalSpent, 'EUR') : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/20">
                    <Target className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Remaining</p>
                    <p className="text-sm font-semibold">
                      {totalBudget > 0 ? formatMoney(totalBudget - totalSpent, 'EUR') : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-500/20">
                    <Settings className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Platforms</p>
                    <p className="text-sm font-semibold">{campaign.subcampaign_count || 0}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-white/10" />

                {/* Progress */}
                {totalBudget > 0 && (
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="flex-1">
                      <Progress value={utilization} className="h-2" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-12 text-right">
                      {utilization.toFixed(0)}%
                    </span>
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
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="subcampaigns"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <HiSquares2X2 className="h-4 w-4" />
              Platforms
              {campaign.subcampaign_count !== undefined && campaign.subcampaign_count > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {campaign.subcampaign_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
            >
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
            <div className="space-y-6">
              {/* Subcampaigns Summary */}
                <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <HiSquares2X2 className="h-4 w-4" />
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
                              {(() => {
                                const Icon = PLATFORM_ICONS[sub.platform]
                                const brandColor = PLATFORM_COLORS[sub.platform]
                                return (
                                  <div className={cn(
                                    'p-2 rounded-lg',
                                    brandColor.split(' ')[1]
                                  )}>
                                    <Icon className={cn(
                                      'h-6 w-6',
                                      brandColor.split(' ')[0]
                                    )} />
                                  </div>
                                )
                              })()}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium truncate">
                                    {platformConfig.label}
                                  </span>
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
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                        <HiSquares2X2 className="h-6 w-6 text-purple-500" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        No platforms added yet
                      </p>
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

                {/* Team Assignments */}
                <AssignmentSection
                  campaignId={campaignId}
                  assignments={campaign.assignments || []}
                  createdBy={campaign.created_by}
                  isLoading={isLoading}
                />

                {/* Client Score */}
                <ClientScoreSection
                  entityId={campaign.client?.id}
                  entityName={campaign.client?.display_name}
                  isLoading={isLoading}
                />

                {/* Notes */}
                <CampaignNotesSection
                  notes={campaign.notes}
                  onSave={async (notes) => {
                    await updateCampaign.mutateAsync({
                      id: campaignId,
                      data: { notes },
                    })
                  }}
                  isLoading={isLoading}
                />
            </div>
          </TabsContent>

          {/* SubCampaigns Tab */}
          <TabsContent value="subcampaigns" className="mt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Platforms</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage advertising platforms and budget allocation
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddSubCampaign(true)}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={showAddSubCampaign}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Platform
                </Button>
              </div>
              <SubCampaignsList
                campaignId={campaignId}
                campaignName={campaign?.name || ''}
                showAddForm={showAddSubCampaign}
                onAddFormClose={() => setShowAddSubCampaign(false)}
              />
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <CampaignTasksTab campaignId={campaignId} />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-6">
            {(() => {
              // Compute contract state for smart UI
              const mainContract = contracts?.find(c => !c.is_annex)
              const hasMainContract = !!mainContract
              const mainContractSigned = mainContract?.contract_status === 'signed'

              // Check if there are uncovered platforms
              const uncoveredPlatforms = campaign.subcampaigns?.filter(sc => !sc.has_contract) || []
              const hasUncoveredPlatforms = uncoveredPlatforms.length > 0

              // Show generate button only if:
              // - No main contract yet, OR
              // - Has main contract AND has uncovered platforms
              const showGenerateButton = !hasMainContract || hasUncoveredPlatforms
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
                    {showGenerateButton && (
                      <Button
                        onClick={() => setShowGenerateContract(true)}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {buttonLabel}
                      </Button>
                    )}
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
                            "p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm hover:bg-muted/30 transition-colors cursor-pointer",
                            !contract.is_annex && "border-l-4 border-l-indigo-500"
                          )}
                          onClick={() => setSelectedContractId(contract.contract)}
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
                              {contract.contract_status === 'processing' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg text-blue-600 border-blue-500/50 hover:bg-blue-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    refreshContractGeneration.mutate(contract.contract)
                                  }}
                                  disabled={refreshContractGeneration.isPending}
                                  title="Check if contract generation is complete"
                                >
                                  <RefreshCw className={cn(
                                    "h-4 w-4",
                                    refreshContractGeneration.isPending && "animate-spin"
                                  )} />
                                </Button>
                              )}
                              {contract.contract_status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg text-amber-600 border-amber-500/50 hover:bg-amber-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSendSignatureContract(contract)
                                    setSigners([{ email: '', name: '', role: 'Client' }])
                                  }}
                                  title="Send for Signature"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send to Sign
                                </Button>
                              )}
                              {contract.contract_status === 'pending_signature' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg text-blue-600 border-blue-500/50 hover:bg-blue-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    refreshSignatureStatus.mutate({
                                      campaignId,
                                      contractId: contract.contract,
                                    })
                                  }}
                                  disabled={refreshSignatureStatus.isPending}
                                  title="Refresh signature status from Dropbox Sign"
                                >
                                  <RefreshCw className={cn(
                                    "h-4 w-4",
                                    refreshSignatureStatus.isPending && "animate-spin"
                                  )} />
                                </Button>
                              )}
                              {contract.contract_gdrive_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(contract.contract_gdrive_url, '_blank')
                                  }}
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
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Generate a contract to formalize the agreement with your client.
                        The contract template will be auto-selected based on your department.
                      </p>
                    </Card>
                  )}
                </div>
              )
            })()}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Invoices & Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Track income from client and expenses to platforms
                  </p>
                </div>
              </div>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Income</p>
                      <p className="text-lg font-semibold text-emerald-600">{formatMoney(invoiceData.totalIncome, 'EUR')}</p>
                      <p className="text-xs text-muted-foreground">{invoiceData.incomeInvoices.length} invoice{invoiceData.incomeInvoices.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Expenses</p>
                      <p className="text-lg font-semibold text-red-600">{formatMoney(invoiceData.totalExpense, 'EUR')}</p>
                      <p className="text-xs text-muted-foreground">{invoiceData.expenseInvoices.length} invoice{invoiceData.expenseInvoices.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Check className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid Profit</p>
                      <p className={cn("text-lg font-semibold", invoiceData.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {formatMoney(invoiceData.profit, 'EUR')}
                      </p>
                      <p className="text-xs text-muted-foreground">received - spent</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Target className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected Balance</p>
                      <p className={cn("text-lg font-semibold", invoiceData.balance >= 0 ? "text-emerald-600" : "text-red-600")}>
                        {formatMoney(invoiceData.balance, 'EUR')}
                      </p>
                      <p className="text-xs text-muted-foreground">income - expenses</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Invoice Lists */}
              {invoiceData.isLoading ? (
                <Card className="p-8 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Loading invoices...</p>
                </Card>
              ) : invoiceData.incomeInvoices.length === 0 && invoiceData.expenseInvoices.length === 0 ? (
                <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h4 className="font-semibold mb-2">No invoices yet</h4>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Upload invoices to platforms to track expenses and payments.
                    Go to Platforms tab and add invoices to each platform.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Income Invoices */}
                  <Card className="p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-emerald-600">
                      <ArrowDownLeft className="h-4 w-4" />
                      Income (from Client)
                    </h4>
                    {invoiceData.incomeInvoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No income invoices</p>
                    ) : (
                      <div className="space-y-2">
                        {invoiceData.incomeInvoices.map((inv) => (
                          <div
                            key={`income-${inv.id}`}
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-500/10">
                                <FileText className="h-4 w-4 text-emerald-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{inv.invoice_name || inv.invoice_number}</p>
                                <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-medium text-sm text-emerald-600">
                                  {inv.amount ? formatMoney(parseFloat(inv.amount), inv.currency) : 'Pending'}
                                </p>
                                <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className="text-xs">
                                  {inv.status_display || inv.status}
                                </Badge>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Expense Invoices */}
                  <Card className="p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
                      <ArrowUpRight className="h-4 w-4" />
                      Expenses (to Platforms)
                    </h4>
                    {invoiceData.expenseInvoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No expense invoices</p>
                    ) : (
                      <div className="space-y-2">
                        {invoiceData.expenseInvoices.map((inv) => (
                          <div
                            key={`expense-${inv.id}`}
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-red-500/10">
                                <FileText className="h-4 w-4 text-red-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{inv.invoice_name || inv.invoice_number}</p>
                                <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-medium text-sm text-red-600">
                                  {inv.amount ? formatMoney(parseFloat(inv.amount), inv.currency) : 'Pending'}
                                </p>
                                <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className="text-xs">
                                  {inv.status_display || inv.status}
                                </Badge>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Platform Spending Summary with Expandable Invoices */}
              {campaign.subcampaigns && campaign.subcampaigns.length > 0 && (
                <Card className="p-5 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <HiSquares2X2 className="h-4 w-4" />
                    Platform Budgets & Invoices
                  </h4>
                  <div className="space-y-2">
                    {campaign.subcampaigns.map((sub) => {
                      const platformConfig = PLATFORM_CONFIG[sub.platform]
                      const PlatformIcon = PLATFORM_ICONS[sub.platform]
                      const brandColor = PLATFORM_COLORS[sub.platform]
                      const subBudget = parseFloat(sub.budget)
                      const subSpent = parseFloat(sub.spent)
                      const utilizationPercent = subBudget > 0 ? (subSpent / subBudget) * 100 : 0
                      const isExpanded = expandedPlatformId === sub.id

                      // Get invoices for this platform
                      const platformInvoices = invoiceData.subcampaignInvoices.filter(
                        inv => 'subcampaign' in inv && inv.subcampaign === sub.id
                      )
                      const platformIncome = platformInvoices.filter(inv => inv.invoice_type === 'income')
                      const platformExpenses = platformInvoices.filter(inv => inv.invoice_type === 'expense')

                      return (
                        <div key={sub.id} className="rounded-xl overflow-hidden">
                          {/* Platform Header - Clickable */}
                          <div
                            onClick={() => setExpandedPlatformId(isExpanded ? null : sub.id)}
                            className={cn(
                              "flex items-center justify-between p-3 cursor-pointer transition-colors",
                              isExpanded ? "bg-muted/50" : "bg-muted/30 hover:bg-muted/40"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'p-2 rounded-lg',
                                brandColor ? brandColor.split(' ')[1] : 'bg-muted'
                              )}>
                                <PlatformIcon className={cn(
                                  'h-5 w-5',
                                  brandColor ? brandColor.split(' ')[0] : 'text-foreground'
                                )} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{platformConfig?.label || sub.platform}</p>
                                <p className="text-xs text-muted-foreground">
                                  Budget: {formatMoney(subBudget, sub.currency)} • {platformInvoices.length} invoice{platformInvoices.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-medium text-sm text-red-600">
                                  {formatMoney(subSpent, sub.currency)} spent
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {utilizationPercent.toFixed(0)}% of budget
                                </p>
                              </div>
                              <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isExpanded && "rotate-180"
                              )} />
                            </div>
                          </div>

                          {/* Expanded Invoice List */}
                          {isExpanded && (
                            <div className="bg-muted/20 p-4 space-y-4 border-t border-white/5">
                              {platformInvoices.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No invoices for this platform yet
                                </p>
                              ) : (
                                <>
                                  {/* Income invoices for this platform */}
                                  {platformIncome.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1">
                                        <ArrowDownLeft className="h-3 w-3" />
                                        Income ({platformIncome.length})
                                      </p>
                                      <div className="space-y-1">
                                        {platformIncome.map((inv) => (
                                          <div
                                            key={`platform-income-${inv.id}`}
                                            onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                                            className="flex items-center justify-between p-2 rounded-lg bg-background/50 text-sm cursor-pointer hover:bg-background/80 transition-colors group"
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-3.5 w-3.5 text-emerald-500" />
                                              <span>{inv.invoice_name || inv.invoice_number}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-emerald-600">
                                                {inv.amount ? formatMoney(parseFloat(inv.amount), inv.currency) : 'Pending'}
                                              </span>
                                              <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className="text-xs">
                                                {inv.status}
                                              </Badge>
                                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Expense invoices for this platform */}
                                  {platformExpenses.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                                        <ArrowUpRight className="h-3 w-3" />
                                        Expenses ({platformExpenses.length})
                                      </p>
                                      <div className="space-y-1">
                                        {platformExpenses.map((inv) => (
                                          <div
                                            key={`platform-expense-${inv.id}`}
                                            onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                                            className="flex items-center justify-between p-2 rounded-lg bg-background/50 text-sm cursor-pointer hover:bg-background/80 transition-colors group"
                                          >
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-3.5 w-3.5 text-red-500" />
                                              <span>{inv.invoice_name || inv.invoice_number}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-red-600">
                                                {inv.amount ? formatMoney(parseFloat(inv.amount), inv.currency) : 'Pending'}
                                              </span>
                                              <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className="text-xs">
                                                {inv.status}
                                              </Badge>
                                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
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

      {/* Generate Report Modal */}
      {campaign && (
        <GenerateReportModal
          campaign={campaign}
          open={showGenerateReport}
          onOpenChange={setShowGenerateReport}
        />
      )}

      {/* Send for Signature Dialog */}
      <Dialog
        open={!!sendSignatureContract}
        onOpenChange={(open) => !open && setSendSignatureContract(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send for Signature
            </DialogTitle>
            <DialogDescription>
              Send {sendSignatureContract?.contract_title || sendSignatureContract?.contract_number} for e-signature via Dropbox Sign.
            </DialogDescription>
          </DialogHeader>

          {validationLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading signer information...</span>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!sendSignatureContract) return

                // Validate signers
                const invalidSigners = signers.filter(s => !s.email || !s.name)
                if (invalidSigners.length > 0) {
                  alert('Please fill in email and name for all signers.')
                  return
                }

                try {
                  await sendForSignature.mutateAsync({
                    campaignId,
                    linkId: sendSignatureContract.id,
                    data: {
                      signers,
                      test_mode: testMode,
                    },
                  })
                  setSendSignatureContract(null)
                } catch {
                  // Error handled by mutation
                }
              }}
              className="space-y-4"
            >
              {/* Client validation warning */}
              {validation?.signers?.client && !validation.signers.client.is_valid && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-600 dark:text-amber-400">
                    <span className="font-medium">Missing client information:</span>
                    <ul className="mt-1 ml-4 list-disc text-sm">
                      {validation.signers.client.missing_fields?.map((field) => (
                        <li key={field.field}>{field.label}</li>
                      ))}
                    </ul>
                    <Link
                      to={`/entities/${campaign?.client?.id}`}
                      className="text-xs underline mt-2 inline-block"
                    >
                      Edit client profile →
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Signers (in signing order)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSigners([...signers, { email: '', name: '', role: '' }])}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Signer
                  </Button>
                </div>

                {signers.map((signer, index) => {
                  const isHahahaRep = signer.role === 'HaHaHa Production'
                  const isClient = signer.role === 'Client'
                  const clientInvalid = isClient && validation?.signers?.client && !validation.signers.client.is_valid

                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border space-y-3",
                        isHahahaRep && "bg-indigo-500/10 border-indigo-500/30",
                        isClient && !clientInvalid && "bg-muted/30",
                        clientInvalid && "bg-amber-500/10 border-amber-500/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {index + 1}. {isHahahaRep ? 'HaHaHa Representative' : isClient ? 'Client' : `Signer ${index + 1}`}
                          </span>
                          {clientInvalid && (
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        {signers.length > 1 && !isHahahaRep && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setSigners(signers.filter((_, i) => i !== index))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`name-${index}`} className="text-xs">Name *</Label>
                          <Input
                            id={`name-${index}`}
                            value={signer.name}
                            onChange={(e) => {
                              const newSigners = [...signers]
                              newSigners[index].name = e.target.value
                              setSigners(newSigners)
                            }}
                            placeholder="Full name"
                            className={cn(
                              "h-8 text-sm",
                              isHahahaRep && "bg-indigo-500/5"
                            )}
                            readOnly={isHahahaRep}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`role-${index}`} className="text-xs">Role</Label>
                          <Input
                            id={`role-${index}`}
                            value={signer.role}
                            onChange={(e) => {
                              const newSigners = [...signers]
                              newSigners[index].role = e.target.value
                              setSigners(newSigners)
                            }}
                            placeholder="e.g. Client, Artist"
                            className={cn(
                              "h-8 text-sm",
                              (isHahahaRep || isClient) && "bg-muted/50"
                            )}
                            readOnly={isHahahaRep || isClient}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`} className="text-xs">Email *</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={signer.email}
                          onChange={(e) => {
                            const newSigners = [...signers]
                            newSigners[index].email = e.target.value
                            setSigners(newSigners)
                          }}
                          placeholder="email@example.com"
                          className={cn(
                            "h-8 text-sm",
                            isHahahaRep && "bg-indigo-500/5",
                            clientInvalid && !signer.email && "border-amber-500"
                          )}
                          readOnly={isHahahaRep}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
                <div>
                  <Label htmlFor="test-mode" className="text-sm font-medium">Test Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    {testMode
                      ? 'All signature requests will be sent to a test email'
                      : 'Signatures will be legally binding'}
                  </p>
                </div>
                <Switch
                  id="test-mode"
                  checked={testMode}
                  onCheckedChange={setTestMode}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSendSignatureContract(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendForSignature.isPending || signers.some(s => !s.email || !s.name)}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {sendForSignature.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send for Signature
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel disabled={deleteCampaign.isPending}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={deleteCampaign.isPending}
              variant="destructive"
            >
              {deleteCampaign.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
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
            <AlertDialogCancel disabled={updateStatus.isPending}>Cancel</AlertDialogCancel>
            <Button
              onClick={() => showStatusConfirm && handleStatusChange(showStatusConfirm)}
              disabled={updateStatus.isPending}
              className={cn(
                showStatusConfirm === 'lost' && 'bg-red-500 hover:bg-red-600',
                showStatusConfirm === 'cancelled' && 'bg-gray-500 hover:bg-gray-600'
              )}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  {showStatusConfirm && CAMPAIGN_STATUS_CONFIG[showStatusConfirm]?.emoji}{' '}
                </>
              )}
              {showStatusConfirm === 'lost'
                ? 'Mark as Lost'
                : showStatusConfirm === 'cancelled'
                ? 'Cancel Campaign'
                : 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Person Edit Dialog */}
      {campaign?.client?.id && (
        <ContactPersonFormDialog
          open={!!editingContactPerson}
          onOpenChange={(open) => !open && setEditingContactPerson(null)}
          entityId={campaign.client.id}
          contactPerson={editingContactPerson}
          onSuccess={async () => {
            // Refresh campaign data and entity data to get updated contact person info
            await Promise.all([
              queryClient.refetchQueries({ queryKey: ['campaigns', 'detail', campaignId] }),
              queryClient.refetchQueries({ queryKey: ['entities', 'detail', campaign.client.id] }),
            ])
          }}
        />
      )}

      {/* Contract Detail Sheet */}
      <ContractDetailSheet
        contractId={selectedContractId}
        open={!!selectedContractId}
        onOpenChange={(open) => !open && setSelectedContractId(null)}
      />

    </AppLayout>
  )
}
