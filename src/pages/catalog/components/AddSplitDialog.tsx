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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateSplit } from '@/api/hooks/useRights';
import { useEntities } from '@/api/hooks/useEntities';
import { toast as sonnerToast } from 'sonner';

interface AddSplitDialogProps {
  scope: 'work' | 'recording';
  objectId: number;
  rightType: 'writer' | 'publisher' | 'master' | 'performance' | 'sync' | 'producer';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSplitDialog({ scope, objectId, rightType, open, onOpenChange }: AddSplitDialogProps) {
  const [entityId, setEntityId] = useState<string>('');
  const [share, setShare] = useState('');
  const [source, setSource] = useState('');

  const createSplit = useCreateSplit();
  const { data: entitiesData } = useEntities({ page_size: 100 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entityId || !share) {
      sonnerToast.error('Please select an entity and enter a share percentage');
      return;
    }

    const shareNum = parseFloat(share);
    if (isNaN(shareNum) || shareNum <= 0 || shareNum > 100) {
      sonnerToast.error('Share must be between 0 and 100');
      return;
    }

    try {
      const payload: any = {
        scope,
        object_id: objectId,
        entity: parseInt(entityId),
        right_type: rightType,
        share: shareNum,
      };

      if (source.trim()) payload.source = source.trim();

      await createSplit.mutateAsync(payload);
      sonnerToast.success('Split added successfully');

      // Reset form
      setEntityId('');
      setShare('');
      setSource('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to add split:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to add split');
    }
  };

  const rightTypeLabels: Record<string, string> = {
    writer: 'Writer',
    publisher: 'Publisher',
    master: 'Master',
    performance: 'Performance',
    sync: 'Sync',
    producer: 'Producer',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add {rightTypeLabels[rightType]} Split</DialogTitle>
            <DialogDescription>
              Add a {rightTypeLabels[rightType].toLowerCase()} split to this {scope}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entity">Entity *</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger id="entity">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {entitiesData?.results?.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id.toString()}>
                      {entity.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share">Share Percentage *</Label>
              <div className="relative">
                <Input
                  id="share"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  value={share}
                  onChange={(e) => setShare(e.target.value)}
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g., Contract, Agreement (optional)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSplit.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSplit.isPending}>
              {createSplit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Split
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
