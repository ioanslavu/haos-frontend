/**
 * GenerateContractModal - Generate a contract for a campaign
 *
 * Smart contract generation:
 * - Backend auto-resolves template based on user's department
 * - Backend auto-detects whether to generate main contract or annex
 * - Dates default to campaign dates (override optional)
 * - Validates entity data completeness before generation
 * - For annexes: validates that uncovered platforms have budgets set
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Loader2, Calendar, Info, FilePlus, FileStack, CheckCircle2, AlertTriangle, XCircle, ExternalLink, DollarSign } from 'lucide-react'
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
import type { Campaign, SubCampaign } from '@/types/campaign'
import { PLATFORM_CONFIG } from '@/types/campaign'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import { formatMoney } from '@/lib/utils'

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

  // Get covered and uncovered subcampaigns
  const subcampaigns = subcampaignsData?.results || []
  const coveredSubcampaigns = subcampaigns.filter(sc => sc.has_contract)
  const uncoveredSubcampaigns = subcampaigns.filter(sc => !sc.has_contract)
  const coveredCount = coveredSubcampaigns.length
  const uncoveredCount = uncoveredSubcampaigns.length

  // Budget validation for uncovered platforms
  // 'revenue_share' needs revenue_share_percentage > 0
  // 'service_fee' needs client_value > 0
  const platformsWithoutBudget = uncoveredSubcampaigns.filter(sc => {
    const clientValue = parseFloat(sc.client_value || '0')
    const revSharePct = parseFloat(sc.revenue_share_percentage || '0')

    if (sc.payment_method === 'revenue_share') {
      return revSharePct <= 0
    }
    // service_fee needs client_value
    return clientValue <= 0
  })
  const hasBudgetIssues = platformsWithoutBudget.length > 0

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

  // Check if we can generate
  // Main contract: needs dates + valid entity (platforms optional)
  // Annex: needs valid entity + uncovered platforms with budgets
  const hasStartDate = campaign.start_date || startDateOverride
  const hasEndDate = campaign.end_date || endDateOverride
  const datesValid = hasStartDate && hasEndDate
  const canGenerate = willGenerateAnnex
    ? entityValid && !hasBudgetIssues && uncoveredCount > 0
    : datesValid && entityValid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Already covered platforms (for annexes) */}
          {willGenerateAnnex && coveredCount > 0 && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Already Covered Platforms</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    These platforms are already covered by existing contracts:
                  </p>
                  <div className="space-y-2">
                    {coveredSubcampaigns.slice(0, 5).map((sc) => {
                      const platformConfig = PLATFORM_CONFIG[sc.platform]
                      const contractInfo = sc.contract_info

                      return (
                        <div
                          key={sc.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                        >
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = PLATFORM_ICONS[sc.platform]
                              const colorClass = PLATFORM_TEXT_COLORS[sc.platform]
                              return Icon ? <Icon className={`h-4 w-4 ${colorClass}`} /> : <span className="text-base">📍</span>
                            })()}
                            <div>
                              <p className="text-xs font-medium">{platformConfig?.label || sc.platform}</p>
                              {contractInfo && (
                                <p className="text-[10px] text-muted-foreground">
                                  {contractInfo.is_annex ? 'Annex' : 'Contract'}: {contractInfo.contract_number}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {contractInfo && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  contractInfo.status === 'signed'
                                    ? 'border-emerald-500/50 text-emerald-500'
                                    : contractInfo.status === 'pending_signature'
                                    ? 'border-amber-500/50 text-amber-500'
                                    : 'border-muted-foreground/50 text-muted-foreground'
                                }`}
                              >
                                {contractInfo.status === 'signed' ? 'Signed' :
                                 contractInfo.status === 'pending_signature' ? 'Pending Signature' :
                                 contractInfo.status === 'draft' ? 'Draft' :
                                 contractInfo.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {coveredSubcampaigns.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{coveredSubcampaigns.length - 5} more platforms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Platforms to be covered */}
          {uncoveredCount > 0 && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {willGenerateAnnex ? 'Platforms in this Annex' : 'Platforms in this Contract'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    {willGenerateAnnex
                      ? 'The annex will cover these uncovered platforms with their financial terms:'
                      : 'The contract will cover all platforms with their financial terms:'}
                  </p>
                  <div className="space-y-2">
                    {uncoveredSubcampaigns.slice(0, 5).map((sc) => {
                      const platformConfig = PLATFORM_CONFIG[sc.platform]
                      const clientValue = parseFloat(sc.client_value || '0')
                      const hasBudgetIssue = platformsWithoutBudget.some(p => p.id === sc.id)

                      return (
                        <div
                          key={sc.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            hasBudgetIssue ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-background/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = PLATFORM_ICONS[sc.platform]
                              const colorClass = PLATFORM_TEXT_COLORS[sc.platform]
                              return Icon ? <Icon className={`h-4 w-4 ${colorClass}`} /> : <span className="text-base">📍</span>
                            })()}
                            <div>
                              <p className="text-xs font-medium">{platformConfig?.label || sc.platform}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {sc.payment_method_display || sc.payment_method}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {sc.payment_method === 'revenue_share' ? (
                              sc.revenue_share_percentage && parseFloat(sc.revenue_share_percentage) > 0 ? (
                                <p className="text-xs font-medium">{sc.revenue_share_percentage}% rev share</p>
                              ) : (
                                <p className="text-xs text-amber-500 font-medium">No rev share %</p>
                              )
                            ) : (
                              clientValue > 0 ? (
                                <p className="text-xs font-medium">{formatMoney(clientValue, sc.currency)}</p>
                              ) : (
                                <p className="text-xs text-amber-500 font-medium">No client value set</p>
                              )
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {uncoveredSubcampaigns.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{uncoveredSubcampaigns.length - 5} more platforms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Issues Warning */}
          {hasBudgetIssues && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-amber-600 dark:text-amber-400">
                    Missing Financial Information
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The following platforms need financial information for the contract:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {platformsWithoutBudget.map((sc) => {
                      const platformConfig = PLATFORM_CONFIG[sc.platform]
                      const isRevShare = sc.payment_method === 'revenue_share'

                      return (
                        <li key={sc.id} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="font-medium">{platformConfig?.label || sc.platform}</span>
                          <span className="text-muted-foreground">
                            - {isRevShare ? 'needs revenue share %' : 'needs client value'}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Go to the Platforms tab to set these values before generating.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No platforms warning - only blocks annex generation */}
          {uncoveredCount === 0 && willGenerateAnnex && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-amber-600 dark:text-amber-400">No Platforms to Cover</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All platforms already have contracts. Add new platforms first to generate an annex.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info when generating main contract without platforms */}
          {uncoveredCount === 0 && !willGenerateAnnex && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">No Platforms Added</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can generate the main contract now. Platforms can be added later and covered by annexes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Dates Info - Only for main contract, not annexes */}
          {!willGenerateAnnex && (
            <>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Contract Period</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Using campaign dates:</p>
                    <div className="text-xs mt-2 space-y-1">
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
            </>
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
