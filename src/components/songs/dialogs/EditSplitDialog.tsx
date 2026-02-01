import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Split } from '@/types/song';
import { useUpdateRecordingSplit, useDeleteRecordingSplit } from '@/api/hooks/useSongs';

interface EditSplitDialogProps {
  split: Split;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSplitDialog({ split, open, onClose, onSuccess }: EditSplitDialogProps) {
  const { toast } = useToast();
  const [share, setShare] = useState(split.share);
  const [source, setSource] = useState(split.source || 'manual');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    setShare(split.share);
    setSource(split.source || 'manual');
    setErrors({});
  }, [split]);

  const updateSplitHook = useUpdateRecordingSplit();
  const deleteSplitHook = useDeleteRecordingSplit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!share) {
      newErrors.share = 'Share percentage is required';
    } else {
      const shareNum = parseFloat(share);
      if (isNaN(shareNum) || shareNum <= 0 || shareNum > 100) {
        newErrors.share = 'Share must be between 0 and 100';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateSplitHook.mutate(
      { splitId: split.id, data: { share: parseFloat(share) as any, territory: undefined } },
      {
        onSuccess: () => {
          onSuccess();
          toast({
            title: 'Split Updated',
            description: 'Split has been updated successfully.',
          });
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.detail || 'Failed to update split';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });

          // Handle field-specific errors
          if (error.response?.data) {
            const fieldErrors: Record<string, string> = {};
            Object.keys(error.response.data).forEach((key) => {
              if (Array.isArray(error.response.data[key])) {
                fieldErrors[key] = error.response.data[key][0];
              } else {
                fieldErrors[key] = error.response.data[key];
              }
            });
            setErrors(fieldErrors);
          }
        },
      }
    );
  };

  const handleDelete = () => {
    deleteSplitHook.mutate(split.id, {
      onSuccess: () => {
        onSuccess();
        setShowDeleteDialog(false);
        toast({
          title: 'Split Deleted',
          description: 'Split has been removed successfully.',
        });
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.detail || 'Failed to delete split';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Split</DialogTitle>
            <DialogDescription>
              Update the split details for {split.entity_name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Entity Info (Read-only) */}
              <div className="space-y-2">
                <Label>Entity</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm px-3 py-2">
                    {split.entity_name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {split.right_type_display}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Entity cannot be changed</p>
              </div>

              {/* Locked Warning */}
              {split.is_locked && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      This split is locked
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Locked splits cannot be edited. Please unlock it first to make changes.
                    </p>
                  </div>
                </div>
              )}

              {/* Share Percentage */}
              <div className="space-y-2">
                <Label htmlFor="share">
                  Share Percentage <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="share"
                    type="number"
                    value={share}
                    onChange={(e) => setShare(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={split.is_locked}
                    className={errors.share ? 'border-destructive pr-8' : 'pr-8'}
                  />
                  <span className="absolute right-3 top-3 text-sm text-muted-foreground">%</span>
                </div>
                {errors.share && <p className="text-sm text-destructive">{errors.share}</p>}
              </div>

              {/* Source */}
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., Contract, Agreement, Manual entry"
                  disabled={split.is_locked}
                />
                <p className="text-xs text-muted-foreground">
                  Where this split information came from
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex-1">
                {!split.is_locked && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={updateSplitHook.isPending || deleteSplitHook.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={updateSplitHook.isPending || deleteSplitHook.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={split.is_locked || updateSplitHook.isPending || deleteSplitHook.isPending}
                >
                  {updateSplitHook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Split</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the split for <strong>{split.entity_name}</strong>?
              This action cannot be undone and will affect the total split distribution.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSplitHook.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSplitHook.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteSplitHook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Split
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
