/**
 * DeleteSubCampaignDialog - Confirmation dialog for deleting a subcampaign
 */

import { Loader2 } from 'lucide-react'
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
import { useDeleteSubCampaign } from '@/api/hooks/useCampaigns'
import type { DeleteSubCampaignDialogProps } from './types'

export function DeleteSubCampaignDialog({
  campaignId,
  subcampaignId,
  platformLabel,
  open,
  onOpenChange,
}: DeleteSubCampaignDialogProps) {
  const deleteMutation = useDeleteSubCampaign()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ campaignId, subCampaignId: subcampaignId })
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Platform</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {platformLabel} from this campaign?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
