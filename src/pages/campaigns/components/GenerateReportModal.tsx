/**
 * GenerateReportModal - Generate a PDF report for a completed campaign
 *
 * Features:
 * - Shows campaign summary before generation
 * - Validates campaign is in completed status
 * - Generates PDF report with budget, spend, and KPIs
 * - Provides download link after generation
 */

import { useState } from 'react'
import {
  FileText,
  Loader2,
  Download,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
  Building2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useGenerateCampaignReport } from '@/api/hooks/useCampaigns'
import type { Campaign } from '@/types/campaign'
import { formatMoney, formatDate } from '@/lib/utils'

interface GenerateReportModalProps {
  campaign: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateReportModal({
  campaign,
  open,
  onOpenChange,
}: GenerateReportModalProps) {
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [reportFilename, setReportFilename] = useState<string | null>(null)

  const generateReport = useGenerateCampaignReport()

  // Budget calculations
  const totalBudget = parseFloat(campaign.total_budget || '0')
  const totalSpent = parseFloat(campaign.total_spent || '0')
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const remaining = totalBudget - totalSpent

  // Validation
  const isCompleted = campaign.status === 'completed'
  const hasSubcampaigns = (campaign.subcampaign_count || 0) > 0
  const canGenerate = isCompleted && hasSubcampaigns

  const handleClose = () => {
    setReportUrl(null)
    setReportFilename(null)
    onOpenChange(false)
  }

  const handleGenerate = async () => {
    try {
      const result = await generateReport.mutateAsync(campaign.id)
      setReportUrl(result.report_url)
      setReportFilename(result.filename)
    } catch {
      // Error handled by mutation
    }
  }

  const handleDownload = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Campaign Report
          </DialogTitle>
          <DialogDescription>
            Generate a PDF report with campaign performance data for your client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Report Generated Success State */}
          {reportUrl ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
                      Report Generated Successfully
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your campaign report is ready for download.
                    </p>
                    {reportFilename && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Filename: <span className="font-medium">{reportFilename}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} className="rounded-xl">
                  Close
                </Button>
                <Button
                  onClick={handleDownload}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Campaign Info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-indigo-500/50 text-indigo-500">
                      Campaign Report
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-500/50 text-emerald-500"
                    >
                      {campaign.status_display || campaign.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{campaign.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Client: {campaign.client?.display_name || 'Unknown'}</span>
                    </div>
                    {(campaign.start_date || campaign.end_date) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {campaign.start_date && formatDate(campaign.start_date)}
                          {campaign.start_date && campaign.end_date && ' - '}
                          {campaign.end_date && formatDate(campaign.end_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Financial Summary</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      This data will be included in your report.
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center p-2 rounded-lg bg-background/50">
                        <p className="text-[10px] text-muted-foreground uppercase">Budget</p>
                        <p className="text-sm font-semibold">
                          {formatMoney(totalBudget)}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/50">
                        <p className="text-[10px] text-muted-foreground uppercase">Spent</p>
                        <p className="text-sm font-semibold">
                          {formatMoney(totalSpent)}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-background/50">
                        <p className="text-[10px] text-muted-foreground uppercase">Remaining</p>
                        <p className={`text-sm font-semibold ${remaining >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatMoney(remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Budget Utilization</span>
                        <span className="font-medium">{utilization.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(utilization, 100)} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Platforms Info */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Platforms</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {campaign.subcampaign_count || 0} platform{(campaign.subcampaign_count || 0) !== 1 ? 's' : ''} will be included in the report with their individual performance data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Contents */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Report Contents</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>- Executive summary with key metrics</li>
                      <li>- Budget allocation and utilization</li>
                      <li>- Platform-by-platform breakdown</li>
                      <li>- Performance metrics (if available)</li>
                      <li>- Campaign timeline and milestones</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Validation Warnings */}
              {!isCompleted && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-amber-600 dark:text-amber-400">
                        Campaign Not Completed
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reports can only be generated for completed campaigns. Mark this campaign as completed first.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isCompleted && !hasSubcampaigns && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-amber-600 dark:text-amber-400">
                        No Platforms
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This campaign has no platforms configured. Add at least one platform before generating a report.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleClose} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || generateReport.isPending}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {generateReport.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
