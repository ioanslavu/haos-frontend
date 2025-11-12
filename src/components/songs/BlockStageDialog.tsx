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
import { AlertTriangle } from 'lucide-react';

interface BlockStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageName: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export const BlockStageDialog = ({
  open,
  onOpenChange,
  stageName,
  onConfirm,
  isLoading = false,
}: BlockStageDialogProps) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason(''); // Reset for next use
    }
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Block {stageName} Stage</DialogTitle>
              <DialogDescription>
                This will mark the stage as blocked and prevent further progress.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="blocked-reason">
              Reason for blocking <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="blocked-reason"
              placeholder="e.g., Waiting for legal clearance on sample usage..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Provide a clear reason so the team knows what needs to be resolved.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? 'Blocking...' : 'Block Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
