import { useState } from 'react';
import { Loader2, Search, AlertCircle } from 'lucide-react';
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
import { useSearchEntities, useAddRecordingSplit, useRecordingDetail } from '@/api/hooks/useSongs';

interface AddMasterSplitDialogProps {
  recordingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SplitCreate {
  entity_id: number;
  share: number;
  territory?: string;
}

interface Entity {
  id: number;
  name: string;
  type: string;
}

export function AddMasterSplitDialog({
  recordingId,
  open,
  onOpenChange,
  onSuccess,
}: AddMasterSplitDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<SplitCreate>({
    entity_id: 0,
    share: 0,
    territory: '',
  });

  // Search entities (labels, artists, rights holders)
  const { data: entitiesData, isLoading: searchLoading } = useSearchEntities(searchTerm);

  const entities = (entitiesData || []) as Entity[];

  // Get current splits to show remaining percentage
  const { data: recordingData } = useRecordingDetail(recordingId, open);

  const currentSplits = (recordingData as any)?.splits || [];
  const currentTotal = currentSplits.reduce(
    (sum: number, split: any) => sum + split.share,
    0
  );
  const remaining = 100 - currentTotal;

  const addSplitMutation = useAddRecordingSplit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.entity_id && formData.share > 0 && formData.share <= remaining) {
      addSplitMutation.mutate(
        {
          recording_id: recordingId,
          entity_id: formData.entity_id,
          share: formData.share,
          territory: formData.territory || undefined,
        },
        {
          onSuccess: () => {
            onSuccess();
            setFormData({ entity_id: 0, share: 0, territory: '' });
            setSearchTerm('');
          },
        }
      );
    }
  };

  const selectedEntity = entities.find((e) => e.id === formData.entity_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Master Split</DialogTitle>
          <DialogDescription>
            Define master recording ownership and revenue share
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current split status */}
          <div className="bg-accent/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Total:</span>
              <span className="font-medium">{currentTotal.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-semibold text-primary">
                {remaining.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-search">Rights Holder *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="entity-search"
                placeholder="Search labels, artists, rights holders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {searchLoading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </div>
            )}

            {entities.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {entities.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                      formData.entity_id === entity.id ? 'bg-accent' : ''
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, entity_id: entity.id })
                    }
                  >
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {entity.type}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedEntity && (
              <div className="text-sm bg-accent/50 rounded-lg p-3">
                <div className="font-medium">Selected: {selectedEntity.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {selectedEntity.type}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="share">Share (%) *</Label>
            <Input
              id="share"
              type="number"
              min="0.01"
              max={remaining}
              step="0.01"
              placeholder="e.g., 50.00"
              value={formData.share || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  share: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
            {formData.share > remaining && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Share cannot exceed remaining {remaining.toFixed(2)}%
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="territory">Territory (Optional)</Label>
            <Input
              id="territory"
              placeholder="e.g., Worldwide, US, EU"
              value={formData.territory || ''}
              onChange={(e) =>
                setFormData({ ...formData, territory: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for worldwide rights
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addSplitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                addSplitMutation.isPending ||
                !formData.entity_id ||
                !formData.share ||
                formData.share <= 0 ||
                formData.share > remaining
              }
            >
              {addSplitMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Split
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
