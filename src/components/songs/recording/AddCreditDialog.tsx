import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
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
import apiClient from '@/api/client';

interface AddCreditDialogProps {
  recordingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreditCreate {
  entity: number;
  role: string;
}

interface Entity {
  id: number;
  name: string;
  type: string;
}

const CREDIT_ROLES = [
  { value: 'artist', label: 'Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'audio_editor', label: 'Editor' },
];

export function AddCreditDialog({
  recordingId,
  open,
  onOpenChange,
  onSuccess,
}: AddCreditDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreditCreate>({
    entity: 0,
    role: '',
  });

  // Search entities
  const { data: entitiesData, isLoading: searchLoading } = useQuery({
    queryKey: ['entities-search', searchTerm],
    queryFn: () =>
      apiClient.get<{ results: Entity[] }>('/api/v1/identity/entities/', {
        params: { search: searchTerm, page_size: 20 },
      }),
    enabled: searchTerm.length > 1,
  });

  const entities = entitiesData?.data?.results || [];

  const createMutation = useMutation({
    mutationFn: (data: CreditCreate) =>
      apiClient.post('/api/v1/rights/credits/', {
        ...data,
        scope: 'recording',
        object_id: recordingId,
      }),
    onSuccess: () => {
      onSuccess();
      setFormData({ entity: 0, role: '' });
      setSearchTerm('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.entity && formData.role) {
      createMutation.mutate(formData);
    }
  };

  const selectedEntity = entities.find((e) => e.id === formData.entity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recording Credit</DialogTitle>
          <DialogDescription>
            Add a performer, producer, or contributor to this recording
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entity-search">Search Entity *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="entity-search"
                placeholder="Search artists, producers, studios..."
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
                      formData.entity === entity.id ? 'bg-accent' : ''
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, entity: entity.id })
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
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {CREDIT_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                !formData.entity ||
                !formData.role
              }
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Credit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
