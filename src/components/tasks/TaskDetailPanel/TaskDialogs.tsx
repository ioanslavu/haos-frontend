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
import { AddEntityModal } from '@/components/entities/AddEntityModal'
import { QuickCreateSongDialog } from '@/components/songs'
import { QuickCreateCampaignDialog } from '@/components/campaigns/QuickCreateCampaignDialog'
import type { TaskDialogsProps } from './types'

export function TaskDialogs({
  task,
  localTitle,
  showDeleteDialog,
  setShowDeleteDialog,
  showAddArtistModal,
  setShowAddArtistModal,
  showAddClientModal,
  setShowAddClientModal,
  showCreateSongDialog,
  setShowCreateSongDialog,
  showCreateCampaignDialog,
  setShowCreateCampaignDialog,
  onDelete,
  onArtistAdded,
  onClientAdded,
  onSongCreated,
  onCampaignCreated,
}: TaskDialogsProps) {
  return (
    <>
      {/* Add Artist Modal */}
      <AddEntityModal
        open={showAddArtistModal}
        onOpenChange={setShowAddArtistModal}
        onEntityAdded={onArtistAdded}
      />

      {/* Add Client Modal */}
      <AddEntityModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onEntityAdded={onClientAdded}
      />

      {/* Quick Create Song Dialog */}
      <QuickCreateSongDialog
        open={showCreateSongDialog}
        onOpenChange={setShowCreateSongDialog}
        onSongCreated={onSongCreated}
      />

      {/* Quick Create Campaign Dialog */}
      <QuickCreateCampaignDialog
        open={showCreateCampaignDialog}
        onOpenChange={setShowCreateCampaignDialog}
        onCampaignCreated={onCampaignCreated}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task?.title || localTitle || 'this task'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
