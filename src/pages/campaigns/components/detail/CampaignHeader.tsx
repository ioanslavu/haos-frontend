/**
 * CampaignHeader - Header card with campaign info, status flow, and actions
 */

import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import { CAMPAIGN_TYPE_CONFIG } from '@/types/campaign'
import { StatusFlow } from './header/StatusFlow'
import { HeaderActions } from './header/HeaderActions'
import { ContactPersonPopover } from './header/ContactPersonPopover'
import type { UseCampaignDetailReturn } from '../../hooks/useCampaignDetail'

interface CampaignHeaderProps {
  ctx: UseCampaignDetailReturn
}

export function CampaignHeader({ ctx }: CampaignHeaderProps) {
  const {
    campaign,
    contracts,
    clientProfile,
    contactPersons,
    navigate,
    totalBudget,
    totalSpent,
    utilization,
    currentStatusIndex,
    isTerminalStatus,
    canTransitionTo,
    startDateOpen,
    setStartDateOpen,
    endDateOpen,
    setEndDateOpen,
    isSavingDates,
    isSavingContactPerson,
    showCreateContact,
    setShowCreateContact,
    newContactName,
    setNewContactName,
    newContactEmail,
    setNewContactEmail,
    newContactPhone,
    setNewContactPhone,
    setShowStatusConfirm,
    setShowDeleteConfirm,
    setShowGenerateReport,
    setEditingContactPerson,
    handleSaveStartDate,
    handleSaveEndDate,
    handleChangeContactPerson,
    handleCreateContactPerson,
    handleReopenCampaign,
    createContactPerson,
    resetContactForm,
  } = ctx

  if (!campaign) return null

  const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.campaign_type]
  const mainContract = contracts?.find(c => !c.is_annex)

  return (
    <>
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
                  <DatePickers
                    campaign={campaign}
                    startDateOpen={startDateOpen}
                    setStartDateOpen={setStartDateOpen}
                    endDateOpen={endDateOpen}
                    setEndDateOpen={setEndDateOpen}
                    isSavingDates={isSavingDates}
                    handleSaveStartDate={handleSaveStartDate}
                    handleSaveEndDate={handleSaveEndDate}
                  />
                  <span className="text-muted-foreground/50">•</span>
                  <ContactPersonPopover
                    campaign={campaign}
                    contactPersons={contactPersons}
                    clientProfile={clientProfile}
                    isSavingContactPerson={isSavingContactPerson}
                    showCreateContact={showCreateContact}
                    setShowCreateContact={setShowCreateContact}
                    newContactName={newContactName}
                    setNewContactName={setNewContactName}
                    newContactEmail={newContactEmail}
                    setNewContactEmail={setNewContactEmail}
                    newContactPhone={newContactPhone}
                    setNewContactPhone={setNewContactPhone}
                    handleChangeContactPerson={handleChangeContactPerson}
                    handleCreateContactPerson={handleCreateContactPerson}
                    setEditingContactPerson={setEditingContactPerson}
                    createContactPerson={createContactPerson}
                    resetContactForm={resetContactForm}
                  />
                  <span className="text-muted-foreground/50">•</span>
                  <ContractStatusBadge mainContract={mainContract} />
                </div>
              </div>
            </div>

            {/* Center: Status Flow */}
            <StatusFlow
              campaign={campaign}
              currentStatusIndex={currentStatusIndex}
              isTerminalStatus={isTerminalStatus}
              canTransitionTo={canTransitionTo}
              setShowStatusConfirm={setShowStatusConfirm}
            />

            {/* Right: Actions */}
            <HeaderActions
              campaign={campaign}
              isTerminalStatus={isTerminalStatus}
              setShowGenerateReport={setShowGenerateReport}
              setShowStatusConfirm={setShowStatusConfirm}
              setShowDeleteConfirm={setShowDeleteConfirm}
              handleReopenCampaign={handleReopenCampaign}
            />
          </div>

          {/* Row 2: Budget Stats Inline + Progress */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-6 flex-1">
              <BudgetStat
                icon={<DollarSign className="h-3.5 w-3.5 text-emerald-500" />}
                iconBg="bg-emerald-500/20"
                label="Budget"
                value={totalBudget > 0 ? formatMoney(totalBudget, 'EUR') : '-'}
              />
              <BudgetStat
                icon={<TrendingUp className="h-3.5 w-3.5 text-blue-500" />}
                iconBg="bg-blue-500/20"
                label="Spent"
                value={totalSpent > 0 ? formatMoney(totalSpent, 'EUR') : '-'}
              />
              <BudgetStat
                icon={<Target className="h-3.5 w-3.5 text-amber-500" />}
                iconBg="bg-amber-500/20"
                label="Remaining"
                value={totalBudget > 0 ? formatMoney(totalBudget - totalSpent, 'EUR') : '-'}
              />
              <BudgetStat
                icon={<Settings className="h-3.5 w-3.5 text-purple-500" />}
                iconBg="bg-purple-500/20"
                label="Platforms"
                value={String(campaign.subcampaign_count || 0)}
              />

              <div className="h-8 w-px bg-white/10" />

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
    </>
  )
}

// Small helper components

function BudgetStat({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-md", iconBg)}>{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function ContractStatusBadge({ mainContract }: { mainContract: any }) {
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
}

function DatePickers({
  campaign,
  startDateOpen,
  setStartDateOpen,
  endDateOpen,
  setEndDateOpen,
  isSavingDates,
  handleSaveStartDate,
  handleSaveEndDate,
}: {
  campaign: any
  startDateOpen: boolean
  setStartDateOpen: (open: boolean) => void
  endDateOpen: boolean
  setEndDateOpen: (open: boolean) => void
  isSavingDates: boolean
  handleSaveStartDate: (date: Date | undefined) => void
  handleSaveEndDate: (date: Date | undefined) => void
}) {
  return (
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
  )
}
