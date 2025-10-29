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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAddISWC } from '@/api/hooks/useCatalog';
import { toast as sonnerToast } from 'sonner';

interface AddISWCDialogProps {
  workId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddISWCDialog({ workId, open, onOpenChange }: AddISWCDialogProps) {
  const [iswc, setIswc] = useState('');
  const addISWC = useAddISWC();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!iswc.trim()) {
      sonnerToast.error('Please enter an ISWC code');
      return;
    }

    try {
      await addISWC.mutateAsync({ workId, iswc: iswc.trim() });
      sonnerToast.success('ISWC added successfully');
      setIswc('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to add ISWC:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to add ISWC');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add ISWC Code</DialogTitle>
            <DialogDescription>
              Enter the International Standard Musical Work Code for this work
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="iswc">ISWC Code</Label>
              <Input
                id="iswc"
                placeholder="T-123.456.789-0"
                value={iswc}
                onChange={(e) => setIswc(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Format: T-XXX.XXX.XXX-X
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addISWC.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addISWC.isPending}>
              {addISWC.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add ISWC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
