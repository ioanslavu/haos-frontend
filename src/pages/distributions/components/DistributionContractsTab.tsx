/**
 * DistributionContractsTab - Contracts tab for distribution detail page
 *
 * Features:
 * - Display linked contract (if any)
 * - Generate new contract
 * - View contract details
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSignature,
  FileText,
  Loader2,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import { useGenerateDistributionContract } from '@/api/hooks/useDistributions'
import { ContractDetailSheet } from '@/components/contracts/ContractDetailSheet'
import type { Distribution } from '@/types/distribution'

interface DistributionContractsTabProps {
  distribution: Distribution
}

const CONTRACT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string; icon: React.ComponentType<any> }> = {
  draft: { label: 'Draft', color: 'text-slate-400', bgColor: 'bg-slate-500/20', dotColor: 'bg-slate-400', icon: FileText },
  processing: { label: 'Processing', color: 'text-amber-400', bgColor: 'bg-amber-500/20', dotColor: 'bg-amber-400', icon: Clock },
  ready: { label: 'Ready', color: 'text-blue-400', bgColor: 'bg-blue-500/20', dotColor: 'bg-blue-400', icon: FileCheck },
  sent: { label: 'Sent', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', dotColor: 'bg-cyan-400', icon: FileSignature },
  signed: { label: 'Signed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', dotColor: 'bg-emerald-400', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'text-red-400', bgColor: 'bg-red-500/20', dotColor: 'bg-red-400', icon: AlertCircle },
  expired: { label: 'Expired', color: 'text-slate-400', bgColor: 'bg-slate-500/20', dotColor: 'bg-slate-400', icon: Clock },
}

export function DistributionContractsTab({ distribution }: DistributionContractsTabProps) {
  const [showContractSheet, setShowContractSheet] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  const generateContract = useGenerateDistributionContract()

  const contract = distribution.contract

  const handleGenerateContract = async () => {
    await generateContract.mutateAsync({
      distributionId: distribution.id,
    })
  }

  const handleViewContract = (contractId: number) => {
    setSelectedContractId(contractId)
    setShowContractSheet(true)
  }

  const statusConfig = contract ? CONTRACT_STATUS_CONFIG[contract.status || 'draft'] || CONTRACT_STATUS_CONFIG.draft : null
  const StatusIcon = statusConfig?.icon || FileText

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">Contract</h3>
          <p className="text-sm text-muted-foreground">
            Manage the contract for this distribution deal
          </p>
        </div>
        {!contract && (
          <Button
            onClick={handleGenerateContract}
            disabled={generateContract.isPending}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {generateContract.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate Contract
          </Button>
        )}
      </div>

      {/* Contract Display */}
      {contract ? (
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn('p-3 rounded-xl', statusConfig?.bgColor)}>
                <StatusIcon className={cn('h-6 w-6', statusConfig?.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold truncate">{contract.title}</h4>
                  <Badge variant="outline" className={cn('gap-1', statusConfig?.bgColor, statusConfig?.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig?.dotColor)} />
                    {statusConfig?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {contract.contract_number}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {contract.start_date && (
                    <div>
                      <span className="text-muted-foreground">Start:</span>{' '}
                      <span className="font-medium">{formatDate(contract.start_date)}</span>
                    </div>
                  )}
                  {contract.end_date && (
                    <div>
                      <span className="text-muted-foreground">End:</span>{' '}
                      <span className="font-medium">{formatDate(contract.end_date)}</span>
                    </div>
                  )}
                  {contract.created_at && (
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      <span className="font-medium">{formatDate(contract.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => handleViewContract(contract.id)}
                >
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link to={`/contracts/${contract.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Action buttons based on status */}
          {contract.status === 'ready' && (
            <div className="px-6 py-4 border-t border-white/10 bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3">
                Contract is ready. You can send it for signature or generate an annex.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleGenerateContract}
                  disabled={generateContract.isPending}
                >
                  {generateContract.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Generate Annex
                </Button>
              </div>
            </div>
          )}

          {contract.status === 'signed' && (
            <div className="px-6 py-4 border-t border-white/10 bg-emerald-500/5">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Contract signed and active</span>
              </div>
            </div>
          )}

          {contract.status === 'processing' && (
            <div className="px-6 py-4 border-t border-white/10 bg-amber-500/5">
              <div className="flex items-center gap-2 text-amber-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Contract is being generated...</span>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <FileSignature className="h-8 w-8 text-cyan-500" />
          </div>
          <h4 className="font-semibold mb-2">No contract yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
            Generate a contract for this distribution deal to formalize the agreement.
          </p>
          <Button
            onClick={handleGenerateContract}
            disabled={generateContract.isPending}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {generateContract.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate Contract
          </Button>
        </Card>
      )}

      {/* Contract Detail Sheet */}
      {selectedContractId && (
        <ContractDetailSheet
          contractId={selectedContractId}
          open={showContractSheet}
          onOpenChange={setShowContractSheet}
        />
      )}
    </div>
  )
}
