/**
 * CampaignDialogs - Delete confirmation, status transition, and contact person dialogs
 */

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'
import { CAMPAIGN_STATUS_CONFIG } from '@/types/campaign'
import { ContactPersonFormDialog } from '@/components/entities/ContactPersonFormDialog'
import { ContractDetailSheet } from '@/components/contracts/ContractDetailSheet'
import { GenerateContractModal } from '../../GenerateContractModal'
import { GenerateReportModal } from '../../GenerateReportModal'
import type { UseCampaignDetailReturn } from '../../../hooks/useCampaignDetail'

interface CampaignDialogsProps {
  ctx: UseCampaignDetailReturn
}

export function CampaignDialogs({ ctx }: CampaignDialogsProps) {
  const {
    campaign,
    campaignId,
    queryClient,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showStatusConfirm,
    setShowStatusConfirm,
    showGenerateContract,
    setShowGenerateContract,
    showGenerateReport,
    setShowGenerateReport,
    editingContactPerson,
    setEditingContactPerson,
    selectedContractId,
    setSelectedContractId,
    handleDelete,
    handleStatusChange,
    deleteCampaign,
    updateStatus,
  } = ctx

  if (!campaign) return null

  return (
    <>
      {/* Generate Contract Modal */}
      <GenerateContractModal
        campaign={campaign}
        open={showGenerateContract}
        onOpenChange={setShowGenerateContract}
      />

      {/* Generate Report Modal */}
      <GenerateReportModal
        campaign={campaign}
        open={showGenerateReport}
        onOpenChange={setShowGenerateReport}
      />

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
    </>
  )
}
