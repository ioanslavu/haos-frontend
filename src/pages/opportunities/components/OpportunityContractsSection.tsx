/**
 * OpportunityContractsSection - Display and manage contracts linked to an opportunity
 *
 * Features:
 * - List linked contracts with status badges
 * - Primary contract indicator
 * - Link existing contract
 * - Create and link new contract
 * - Unlink contract
 */

import { useState } from 'react'
import {
  Plus,
  Trash2,
  FileSignature,
  Star,
  ExternalLink,
  Loader2,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useOpportunityContracts,
  useLinkContract,
  useCreateAndLinkContract,
  useUnlinkContract,
  useUpdateContractLink,
} from '@/api/hooks/useOpportunities'
import { formatDate, cn } from '@/lib/utils'
import type { OpportunityContractLink } from '@/api/services/opportunities.service'

// Contract status configuration
const CONTRACT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
  pending_signature: { label: 'Pending Signature', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  sent: { label: 'Sent', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  signed: { label: 'Signed', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  expired: { label: 'Expired', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
}

// Contract type configuration
const CONTRACT_TYPE_CONFIG: Record<string, { label: string }> = {
  sync_license: { label: 'Sync License' },
  artist_agreement: { label: 'Artist Agreement' },
  brand_partnership: { label: 'Brand Partnership' },
  sponsorship: { label: 'Sponsorship' },
  endorsement: { label: 'Endorsement' },
  other: { label: 'Other' },
}

interface OpportunityContractsSectionProps {
  opportunityId: number
  clientId?: number
}

export function OpportunityContractsSection({ opportunityId, clientId }: OpportunityContractsSectionProps) {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null)

  const { data: contractLinks = [], isLoading } = useOpportunityContracts(opportunityId)
  const unlinkMutation = useUnlinkContract()
  const updateLinkMutation = useUpdateContractLink()

  const handleUnlink = async () => {
    if (!unlinkingId) return
    await unlinkMutation.mutateAsync({ linkId: unlinkingId, opportunityId })
    setUnlinkingId(null)
  }

  const handleSetPrimary = async (linkId: number) => {
    await updateLinkMutation.mutateAsync({
      linkId,
      opportunityId,
      data: { is_primary: true },
    })
  }

  // Count contracts by status
  const signedCount = contractLinks.filter(c => c.contract_details?.status === 'signed').length
  const pendingCount = contractLinks.filter(c => ['draft', 'pending_signature', 'sent'].includes(c.contract_details?.status || '')).length

  if (isLoading) {
    return (
      <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Contracts
              {contractLinks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {contractLinks.length}
                </Badge>
              )}
            </h3>
            {contractLinks.length > 0 && (
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="text-green-500 font-medium">{signedCount} signed</span>
                {pendingCount > 0 && (
                  <span className="text-amber-500">{pendingCount} pending</span>
                )}
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setShowLinkModal(true)}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Link Contract
          </Button>
        </div>

        {contractLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No contracts linked to this opportunity</p>
            <p className="text-sm mt-1">Link or create contracts to formalize deals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contractLinks.map(link => {
              const statusConfig = CONTRACT_STATUS_CONFIG[link.contract_details?.status || 'draft']
              const typeConfig = CONTRACT_TYPE_CONFIG[link.contract_details?.contract_type || 'other']

              return (
                <div
                  key={link.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-xl bg-background/30 backdrop-blur-sm transition-all',
                    link.is_primary ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/10'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {link.is_primary && (
                      <Star className="h-4 w-4 text-primary fill-primary" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {typeConfig?.label || link.contract_details?.contract_type_display || 'Contract'}
                        </span>
                        <Badge variant="outline" className={cn('text-xs', statusConfig?.color)}>
                          {statusConfig?.label || link.contract_details?.status_display}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {link.contract_details?.entity_name && (
                          <span>{link.contract_details.entity_name} · </span>
                        )}
                        Created: {formatDate(link.contract_details?.created_at || link.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!link.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleSetPrimary(link.id)}
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => window.open(`/contracts/${link.contract}`, '_blank')}
                      title="View contract"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setUnlinkingId(link.id)}
                      title="Unlink contract"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Link/Create Contract Modal */}
      <LinkContractModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        opportunityId={opportunityId}
        clientId={clientId}
      />

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkingId} onOpenChange={(open) => !open && setUnlinkingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this contract from the opportunity?
              The contract will not be deleted, only the link will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              className="bg-destructive hover:bg-destructive/90"
            >
              {unlinkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Link/Create Contract Modal Component
interface LinkContractModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId: number
  clientId?: number
}

function LinkContractModal({ open, onOpenChange, opportunityId, clientId }: LinkContractModalProps) {
  const [mode, setMode] = useState<'link' | 'create'>('link')
  const [selectedContract, setSelectedContract] = useState<number | null>(null)
  const [contractType, setContractType] = useState('sync_license')
  const [isPrimary, setIsPrimary] = useState(false)

  const linkMutation = useLinkContract()
  const createAndLinkMutation = useCreateAndLinkContract()

  const handleLink = async () => {
    if (!selectedContract) return

    await linkMutation.mutateAsync({
      opportunity: opportunityId,
      contract: selectedContract,
      is_primary: isPrimary,
    })

    handleClose()
  }

  const handleCreate = async () => {
    if (!clientId) return

    await createAndLinkMutation.mutateAsync({
      opportunity: opportunityId,
      contract_type: contractType,
      entity: clientId,
      is_primary: isPrimary,
    })

    handleClose()
  }

  const handleClose = () => {
    onOpenChange(false)
    setMode('link')
    setSelectedContract(null)
    setContractType('sync_license')
    setIsPrimary(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Contract</DialogTitle>
          <DialogDescription>
            Link an existing contract or create a new one for this opportunity.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'link' | 'create')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Link Existing</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Contract ID</label>
              <input
                type="number"
                placeholder="Enter contract ID"
                className="w-full px-3 py-2 border rounded-lg bg-background"
                value={selectedContract || ''}
                onChange={(e) => setSelectedContract(e.target.value ? Number(e.target.value) : null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the ID of the contract to link
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimaryLink"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPrimaryLink" className="text-sm">
                Set as primary contract
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleLink}
                disabled={!selectedContract || linkMutation.isPending}
              >
                {linkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Link Contract
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4 py-4">
            {!clientId ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>Cannot create contract: No client associated with this opportunity</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contract Type</label>
                  <Select value={contractType} onValueChange={setContractType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTRACT_TYPE_CONFIG).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimaryCreate"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isPrimaryCreate" className="text-sm">
                    Set as primary contract
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createAndLinkMutation.isPending}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600"
                  >
                    {createAndLinkMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Create & Link
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
