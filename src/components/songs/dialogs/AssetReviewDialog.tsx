import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SongAsset } from '@/types/song';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AssetReviewDialogProps {
  asset: SongAsset;
  open: boolean;
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject' | 'revision_requested', notes?: string) => void;
  isSubmitting?: boolean;
}

const assetTypeLabels: Record<string, string> = {
  cover_art: 'Cover Art',
  back_cover: 'Back Cover',
  press_photo: 'Press Photo',
  promotional_graphic: 'Promotional Graphic',
  social_media_asset: 'Social Media Asset',
  marketing_copy: 'Marketing Copy',
  other: 'Other',
};

export const AssetReviewDialog = ({
  asset,
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AssetReviewDialogProps) => {
  const [notes, setNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'revision_requested' | null>(null);

  const handleSubmit = () => {
    if (!selectedAction) return;
    onSubmit(selectedAction, notes || undefined);
    setNotes('');
    setSelectedAction(null);
  };

  const handleClose = () => {
    setNotes('');
    setSelectedAction(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Asset</DialogTitle>
          <DialogDescription>
            Review this marketing asset and provide feedback to the Marketing team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset Details */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{asset.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{assetTypeLabels[asset.asset_type]}</Badge>
                  {asset.file_extension && (
                    <Badge variant="secondary">.{asset.file_extension}</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(asset.google_drive_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Drive
              </Button>
            </div>

            {asset.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description:</p>
                <p className="text-sm mt-1">{asset.description}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Uploaded by {asset.created_by.full_name}{' '}
              {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
            </div>
          </div>

          {/* Previous Review Notes */}
          {asset.review_notes && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Previous Review Notes:</p>
              <p className="text-sm text-muted-foreground">{asset.review_notes}</p>
              {asset.reviewed_by && asset.reviewed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  By {asset.reviewed_by.full_name} on{' '}
                  {new Date(asset.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Review Actions */}
          <div className="space-y-3">
            <Label>Select Review Action</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={selectedAction === 'approve' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setSelectedAction('approve')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant={selectedAction === 'revision_requested' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setSelectedAction('revision_requested')}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Request Revision
              </Button>
              <Button
                variant={selectedAction === 'reject' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setSelectedAction('reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>

          {/* Review Notes */}
          <div className="space-y-2">
            <Label htmlFor="review-notes">
              Review Notes {selectedAction !== 'approve' && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="review-notes"
              placeholder={
                selectedAction === 'approve'
                  ? 'Optional: Add any comments or feedback...'
                  : selectedAction === 'revision_requested'
                  ? 'Required: Describe what needs to be changed...'
                  : selectedAction === 'reject'
                  ? 'Required: Explain why this asset is being rejected...'
                  : 'Select an action above to add notes...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={!selectedAction}
            />
            {selectedAction && selectedAction !== 'approve' && !notes.trim() && (
              <p className="text-xs text-destructive">
                Notes are required when requesting revisions or rejecting assets.
              </p>
            )}
          </div>

          {/* Review Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Review Guidelines</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Check if the asset meets quality standards and brand guidelines</li>
              <li>Verify the asset matches the requested specifications</li>
              <li>Ensure the asset is appropriate for its intended use</li>
              <li>Provide specific, actionable feedback when requesting revisions</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedAction ||
              (selectedAction !== 'approve' && !notes.trim()) ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
