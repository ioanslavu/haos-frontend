/**
 * ContractsTab - Contract management and generation
 */

import {
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, cn } from '@/lib/utils'
import type { UseCampaignDetailReturn } from '../../../hooks/useCampaignDetail'

interface ContractsTabProps {
  ctx: UseCampaignDetailReturn
}

export function ContractsTab({ ctx }: ContractsTabProps) {
  const {
    campaign,
    contracts,
    setShowGenerateContract,
    setSendSignatureContract,
    setSigners,
    setSelectedContractId,
    handleRefreshSignatureStatus,
    handleRefreshContractGeneration,
    refreshSignatureStatus,
    refreshContractGeneration,
  } = ctx

  if (!campaign) return null

  // Compute contract state for smart UI
  const mainContract = contracts?.find(c => !c.is_annex)
  const hasMainContract = !!mainContract

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
                        handleRefreshContractGeneration(contract.contract)
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
                        handleRefreshSignatureStatus(contract.contract)
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
}
