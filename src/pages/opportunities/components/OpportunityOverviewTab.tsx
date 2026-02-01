/**
 * OpportunityOverviewTab - Overview tab content with inline editing
 */

import {
  Calendar as CalendarIcon,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotesSection } from '@/components/notes/NotesSection'
import { OpportunityAssignmentSection } from './OpportunityAssignmentSection'
import { OpportunityNotesSection } from './OpportunityNotesSection'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { Opportunity } from '@/types/opportunities'

interface OpportunityOverviewTabProps {
  opportunity: Opportunity
  isLoading: boolean
  campaignStartDateOpen: boolean
  setCampaignStartDateOpen: (open: boolean) => void
  campaignEndDateOpen: boolean
  setCampaignEndDateOpen: (open: boolean) => void
  isSavingDates: boolean
  onSaveCampaignStartDate: (date: Date | undefined) => void
  onSaveCampaignEndDate: (date: Date | undefined) => void
  onSaveNotes: (notes: string) => void
}

export function OpportunityOverviewTab({
  opportunity,
  isLoading,
  campaignStartDateOpen,
  setCampaignStartDateOpen,
  campaignEndDateOpen,
  setCampaignEndDateOpen,
  isSavingDates,
  onSaveCampaignStartDate,
  onSaveCampaignEndDate,
  onSaveNotes,
}: OpportunityOverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Deal Info Card */}
        <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estimated Value */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Value</span>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold">
                  {opportunity.estimated_value
                    ? formatMoney(parseFloat(opportunity.estimated_value), opportunity.currency)
                    : '-'}
                </span>
              </div>
            </div>
            {/* Probability */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Probability</span>
              <span className="font-semibold">{opportunity.probability}%</span>
            </div>
            {/* Campaign Start Date */}
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Campaign Start</Label>
              <Popover open={campaignStartDateOpen} onOpenChange={setCampaignStartDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-muted/50 text-sm',
                      !opportunity.campaign_start_date && 'text-amber-500'
                    )}
                    disabled={isSavingDates}
                  >
                    {isSavingDates ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {opportunity.campaign_start_date
                      ? formatDate(opportunity.campaign_start_date)
                      : 'Set date'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={
                      opportunity.campaign_start_date
                        ? new Date(opportunity.campaign_start_date)
                        : undefined
                    }
                    onSelect={onSaveCampaignStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Campaign End Date */}
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Campaign End</Label>
              <Popover open={campaignEndDateOpen} onOpenChange={setCampaignEndDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-muted/50 text-sm',
                      !opportunity.campaign_end_date && 'text-amber-500'
                    )}
                    disabled={isSavingDates}
                  >
                    {isSavingDates ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {opportunity.campaign_end_date
                      ? formatDate(opportunity.campaign_end_date)
                      : 'Set date'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={
                      opportunity.campaign_end_date
                        ? new Date(opportunity.campaign_end_date)
                        : undefined
                    }
                    onSelect={onSaveCampaignEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Objectives Card */}
        <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Campaign Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunity.campaign_objectives ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {opportunity.campaign_objectives}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No objectives provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Assignments */}
      <OpportunityAssignmentSection
        opportunityId={opportunity.id}
        assignments={opportunity.assignments || []}
        createdBy={opportunity.created_by?.id}
        isLoading={isLoading}
      />

      {/* Notes with Autosave */}
      <OpportunityNotesSection
        notes={opportunity.notes}
        onSave={onSaveNotes}
        isLoading={isLoading}
      />
    </div>
  )
}
