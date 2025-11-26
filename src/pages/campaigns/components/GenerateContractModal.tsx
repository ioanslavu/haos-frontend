/**
 * GenerateContractModal - Generate a contract for a campaign
 *
 * Smart contract generation:
 * - Backend auto-resolves template based on user's department
 * - Backend auto-detects whether to generate main contract or annex
 * - Dates default to campaign dates (override optional)
 * - Validates entity data completeness before generation
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Loader2, Calendar, Info, FilePlus, FileStack, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useGenerateCampaignContract, useCampaignContracts, useSubCampaigns, useContractValidation } from '@/api/hooks/useCampaigns'
import type { Campaign } from '@/types/campaign'

interface GenerateContractModalProps {
  campaign: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateContractModal({
  campaign,
  open,
  onOpenChange,
}: GenerateContractModalProps) {
  const [startDateOverride, setStartDateOverride] = useState('')
  const [endDateOverride, setEndDateOverride] = useState('')
  const [showDateOverrides, setShowDateOverrides] = useState(false)

  // Get existing contracts to determine if this will be main or annex
  const { data: contracts } = useCampaignContracts(campaign.id, open)

  // Get subcampaigns to show coverage info
  const { data: subcampaignsData } = useSubCampaigns(campaign.id, undefined, open)

  // Get validation data
  const { data: validation, isLoading: validationLoading } = useContractValidation(campaign.id, open)

  const generateContract = useGenerateCampaignContract()

  // Determine if this will generate main contract or annex
  const mainContract = contracts?.find(c => !c.is_annex)
  const willGenerateAnnex = !!mainContract

  // Count uncovered subcampaigns
  const subcampaigns = subcampaignsData?.results || []
  const uncoveredCount = subcampaigns.filter(sc => !sc.has_contract).length

  // Entity validation from backend
  const entityValid = validation?.entity?.is_valid ?? true
  const entityMissingFields = validation?.entity?.missing_fields ?? []
  const entityWarnings = validation?.entity?.warnings ?? []
  const entityType = validation?.entity?.entity_type

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStartDateOverride('')
      setEndDateOverride('')
      setShowDateOverrides(false)
    }
  }, [open])

  const handleClose = () => {
    setStartDateOverride('')
    setEndDateOverride('')
    setShowDateOverrides(false)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    try {
      await generateContract.mutateAsync({
        campaignId: campaign.id,
        data: {
          // Only send if overriding - backend uses campaign dates by default
          start_date: startDateOverride || undefined,
          end_date: endDateOverride || undefined,
        },
      })
      handleClose()
    } catch {
      // Error handled by mutation
    }
  }

  // Check if we can generate (need both dates and valid entity)
  const hasStartDate = campaign.start_date || startDateOverride
  const hasEndDate = campaign.end_date || endDateOverride
  const canGenerate = hasStartDate && hasEndDate && entityValid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {willGenerateAnnex ? (
              <FileStack className="h-5 w-5" />
            ) : (
              <FilePlus className="h-5 w-5" />
            )}
            {willGenerateAnnex ? 'Generate Annex' : 'Generate Contract'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Contract Type & Template Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div className="space-y-3">
              {/* Type Badge Row */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-indigo-500/50 text-indigo-500">
                  Context: Campaign
                </Badge>
                <Badge
                  variant="outline"
                  className={willGenerateAnnex
                    ? "text-xs border-purple-500/50 text-purple-500"
                    : "text-xs border-emerald-500/50 text-emerald-500"
                  }
                >
                  {willGenerateAnnex ? 'Type: Annex' : 'Type: Main Contract'}
                </Badge>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                {willGenerateAnnex ? (
                  <FileStack className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                ) : (
                  <FilePlus className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {willGenerateAnnex ? 'Adding Annex' : 'Creating Main Contract'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {willGenerateAnnex ? (
                      <>
                        Annex to <span className="font-medium text-foreground">{mainContract?.contract_number}</span>.
                        {uncoveredCount > 0 && (
                          <> Covers {uncoveredCount} uncovered platform{uncoveredCount !== 1 ? 's' : ''}.</>
                        )}
                      </>
                    ) : (
                      <>
                        Main contract for {campaign.client?.display_name || 'the client'}.
                        {uncoveredCount > 0 && (
                          <> Covers {uncoveredCount} platform{uncoveredCount !== 1 ? 's' : ''}.</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Dates Info */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Using Campaign Dates</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <p>
                    Start: <span className="font-medium text-foreground">{campaign.start_date || 'Not set'}</span>
                    {!campaign.start_date && <span className="text-amber-500 ml-1">(required)</span>}
                  </p>
                  <p>
                    End: <span className="font-medium text-foreground">{campaign.end_date || 'Not set'}</span>
                    {!campaign.end_date && <span className="text-amber-500 ml-1">(required)</span>}
                  </p>
                </div>

                {/* Override Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDateOverrides(!showDateOverrides)}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  {showDateOverrides ? 'Use campaign dates' : 'Override dates'}
                </button>
              </div>
            </div>
          </div>

          {/* Date Overrides (collapsed by default) */}
          {showDateOverrides && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/50 bg-background">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium">
                  Start Date Override
                  {!campaign.start_date && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start_date"
                    type="date"
                    value={startDateOverride}
                    onChange={(e) => setStartDateOverride(e.target.value)}
                    placeholder="Use campaign date"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium">
                  End Date Override
                  {!campaign.end_date && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end_date"
                    type="date"
                    value={endDateOverride}
                    onChange={(e) => setEndDateOverride(e.target.value)}
                    min={startDateOverride || campaign.start_date || undefined}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Template Resolution Info */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Template is auto-selected based on your department.
                Counterparty: <span className="font-medium text-foreground">{campaign.client?.display_name || 'Campaign client'}</span>
              </p>
            </div>
          </div>

          {/* Warning if missing dates */}
          {(!hasStartDate || !hasEndDate) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {!hasStartDate && !hasEndDate
                    ? 'Campaign has no dates set. Please set both dates on the campaign or use date overrides above.'
                    : !hasStartDate
                    ? 'Campaign has no start date. Please set one on the campaign or use date override above.'
                    : 'Campaign has no end date. Please set one on the campaign or use date override above.'}
                </p>
              </div>
            </div>
          )}

          {/* Entity Validation Status */}
          {validationLoading ? (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Checking client data...</p>
              </div>
            </div>
          ) : !entityValid ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-destructive">
                    Client Missing Required Data
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {campaign.client?.display_name || 'The client'} ({entityType}) is missing information required for contract generation:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {entityMissingFields.map((field, idx) => (
                      <li key={idx} className="text-xs text-destructive flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                        {field.label}
                      </li>
                    ))}
                  </ul>
                  {campaign.client?.id && (
                    <Link
                      to={`/entities/${campaign.client.id}`}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline"
                      onClick={() => onOpenChange(false)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Edit client profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : entityWarnings.length > 0 ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Recommendations for {campaign.client?.display_name}:
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {entityWarnings.map((warning, idx) => (
                      <li key={idx} className="text-xs text-amber-600 dark:text-amber-400">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Client data verified: <span className="font-medium">{campaign.client?.display_name}</span> ({entityType})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canGenerate || generateContract.isPending || validationLoading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {generateContract.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {willGenerateAnnex ? 'Generate Annex' : 'Generate Contract'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
