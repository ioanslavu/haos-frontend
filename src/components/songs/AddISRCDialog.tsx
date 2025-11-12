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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast as sonnerToast } from 'sonner';

interface AddISRCDialogProps {
  recordingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddISRCDialog({ recordingId, open, onOpenChange }: AddISRCDialogProps) {
  const queryClient = useQueryClient();
  const [isrc, setIsrc] = useState('');

  const addISRC = useMutation({
    mutationFn: async ({ recordingId, isrc }: { recordingId: number; isrc: string }) => {
      const response = await apiClient.post(`/api/v1/recordings/${recordingId}/add_isrc/`, { isrc });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recording'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isrc.trim()) {
      sonnerToast.error('Please enter an ISRC code');
      return;
    }

    try {
      await addISRC.mutateAsync({ recordingId, isrc: isrc.trim() });
      sonnerToast.success('ISRC added successfully');
      setIsrc('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to add ISRC:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to add ISRC');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add ISRC Code</DialogTitle>
            <DialogDescription>
              Enter the International Standard Recording Code for this recording
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="isrc">ISRC Code</Label>
              <Input
                id="isrc"
                placeholder="US-ABC-12-34567"
                value={isrc}
                onChange={(e) => setIsrc(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Format: CC-XXX-YY-NNNNN (e.g., US-ABC-12-34567)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addISRC.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addISRC.isPending}>
              {addISRC.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add ISRC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
