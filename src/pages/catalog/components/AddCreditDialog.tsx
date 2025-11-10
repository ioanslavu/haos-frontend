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
import { useCreateCredit, useUpdateCredit } from '@/api/hooks/useRights';
import { useEntities } from '@/api/hooks/useEntities';
import { toast as sonnerToast } from 'sonner';
import { useEffect } from 'react';

interface Credit {
  id: number;
  entity: number;
  role: string;
  credited_as?: string;
  share_kind?: string;
  share_value?: number;
}

interface AddCreditDialogProps {
  scope: 'work' | 'recording';
  objectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credit?: Credit | null;
}

export function AddCreditDialog({ scope, objectId, open, onOpenChange, credit }: AddCreditDialogProps) {
  const [entityId, setEntityId] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [creditedAs, setCreditedAs] = useState('');
  const [shareKind, setShareKind] = useState<string>('');
  const [shareValue, setShareValue] = useState('');

  const createCredit = useCreateCredit();
  const updateCredit = useUpdateCredit();
  const { data: entitiesData } = useEntities({ page_size: 100 });

  const isEditing = !!credit;

  // Populate form when editing
  useEffect(() => {
    if (credit && open) {
      setEntityId(credit.entity.toString());
      setRole(credit.role);
      setCreditedAs(credit.credited_as || '');
      setShareKind(credit.share_kind || '');
      setShareValue(credit.share_value?.toString() || '');
    } else if (!open) {
      // Reset form when dialog closes
      setEntityId('');
      setRole('');
      setCreditedAs('');
      setShareKind('');
      setShareValue('');
    }
  }, [credit, open]);

  // Auto-populate credited_as with stage_name when entity is selected
  const handleEntityChange = (newEntityId: string) => {
    setEntityId(newEntityId);

    if (newEntityId && entitiesData?.results) {
      const selectedEntity = entitiesData.results.find(e => e.id.toString() === newEntityId);
      if (selectedEntity?.stage_name) {
        setCreditedAs(selectedEntity.stage_name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entityId || !role) {
      sonnerToast.error('Please select an entity and role');
      return;
    }

    try {
      const payload: any = {
        scope,
        object_id: objectId,
        entity: parseInt(entityId),
        role,
      };

      if (creditedAs.trim()) payload.credited_as = creditedAs.trim();
      if (shareKind) payload.share_kind = shareKind;
      if (shareValue.trim()) payload.share_value = parseFloat(shareValue);

      if (isEditing && credit) {
        await updateCredit.mutateAsync({ id: credit.id, payload });
        sonnerToast.success('Credit updated successfully');
      } else {
        await createCredit.mutateAsync(payload);
        sonnerToast.success('Credit added successfully');
      }

      // Reset form
      setEntityId('');
      setRole('');
      setCreditedAs('');
      setShareKind('');
      setShareValue('');
      onOpenChange(false);
    } catch (error: any) {
      console.error(`Failed to ${isEditing ? 'update' : 'add'} credit:`, error);
      sonnerToast.error(error.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'add'} credit`);
    }
  };

  // Roles based on scope
  const workRoles = [
    { value: 'composer', label: 'Composer' },
    { value: 'lyricist', label: 'Lyricist' },
    { value: 'arranger', label: 'Editor' },
  ];

  const recordingRoles = [
    { value: 'artist', label: 'Artist' },
    { value: 'producer', label: 'Producer' },
    { value: 'audio_editor', label: 'Editor' },
  ];

  const roles = scope === 'work' ? workRoles : recordingRoles;

  // Share kinds based on scope
  const workShareKinds = [
    { value: 'none', label: 'No Share' },
    { value: 'writer_share', label: 'Writer Share' },
    { value: 'publisher_share', label: 'Publisher Share' },
  ];

  const recordingShareKinds = [
    { value: 'none', label: 'No Share' },
    { value: 'master_share', label: 'Master Share' },
    { value: 'points', label: 'Producer Points' },
  ];

  const shareKinds = scope === 'work' ? workShareKinds : recordingShareKinds;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Credit' : 'Add Credit'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update' : 'Add a'} credit {isEditing ? 'for' : 'to'} this {scope}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entity">Entity *</Label>
              <Select value={entityId} onValueChange={handleEntityChange}>
                <SelectTrigger id="entity">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {entitiesData?.results?.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id.toString()}>
                      {entity.display_name}
                      {entity.stage_name && ` (${entity.stage_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditedAs">Credited As</Label>
              <Input
                id="creditedAs"
                placeholder="Stage name or alternative name"
                value={creditedAs}
                onChange={(e) => setCreditedAs(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto-filled with stage name if available
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shareKind">Share Type</Label>
                <Select value={shareKind} onValueChange={setShareKind}>
                  <SelectTrigger id="shareKind">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareKinds.map((sk) => (
                      <SelectItem key={sk.value} value={sk.value}>
                        {sk.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shareValue">Share Value</Label>
                <Input
                  id="shareValue"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={shareValue}
                  onChange={(e) => setShareValue(e.target.value)}
                  disabled={!shareKind || shareKind === 'none'}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCredit.isPending || updateCredit.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCredit.isPending || updateCredit.isPending}>
              {(createCredit.isPending || updateCredit.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Credit' : 'Add Credit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
