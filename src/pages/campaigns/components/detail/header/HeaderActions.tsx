/**
 * HeaderActions - Campaign header action buttons and dropdown menu
 */

import {
  AlertCircle,
  Check,
  FileText,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CampaignStatus } from '@/types/campaign'

interface HeaderActionsProps {
  campaign: any
  isTerminalStatus: boolean
  setShowGenerateReport: (show: boolean) => void
  setShowStatusConfirm: (status: CampaignStatus | null) => void
  setShowDeleteConfirm: (show: boolean) => void
  handleReopenCampaign: () => void
}

export function HeaderActions({
  campaign,
  isTerminalStatus,
  setShowGenerateReport,
  setShowStatusConfirm,
  setShowDeleteConfirm,
  handleReopenCampaign,
}: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
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
          {(campaign.status === 'lead' || campaign.status === 'negotiation') && (
            <DropdownMenuItem
              onClick={() => setShowStatusConfirm('lost')}
              className="text-red-500 focus:text-red-500"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Mark as Lost
            </DropdownMenuItem>
          )}
          {!isTerminalStatus && (
            <DropdownMenuItem
              onClick={() => setShowStatusConfirm('cancelled')}
              className="text-muted-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Campaign
            </DropdownMenuItem>
          )}
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
          {isTerminalStatus && (
            <>
              <DropdownMenuItem
                onClick={handleReopenCampaign}
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
  )
}
