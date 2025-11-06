import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { Loader2, Search, Plus } from 'lucide-react';
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddSplitDialogProps {
  workId: number;
  rightType: 'writer' | 'publisher';
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Entity {
  id: number;
  display_name: string;
  type: 'person' | 'organization';
}

export function AddSplitDialog({ workId, rightType, open, onClose, onSuccess }: AddSplitDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [share, setShare] = useState('');
  const [source, setSource] = useState('manual');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search entities
  const { data: entitiesData, isLoading: searchLoading } = useQuery({
    queryKey: ['entities-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { results: [] };
      const { data } = await apiClient.get('/api/v1/identity/entities/', {
        params: { search: searchQuery, page_size: 10 },
      });
      return data;
    },
    enabled: searchQuery.length >= 2,
  });

  const entities = entitiesData?.results || [];

  const createSplitMutation = useMutation({
    mutationFn: async (data: { entity_id: number; share: string; source: string }) => {
      return apiClient.post('/api/v1/rights/splits/', {
        scope: 'work',
        object_id: workId,
        entity: data.entity_id,
        right_type: rightType,
        share: data.share,
        source: data.source,
      });
    },
    onSuccess: () => {
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to add split';
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
  });

  const resetForm = () => {
    setSearchQuery('');
    setSelectedEntity(null);
    setShare('');
    setSource('manual');
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!selectedEntity) {
      newErrors.entity = 'Please select an entity';
    }

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

    createSplitMutation.mutate({
      entity_id: selectedEntity!.id,
      share,
      source,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Add {rightType === 'writer' ? 'Writer' : 'Publisher'} Split
          </DialogTitle>
          <DialogDescription>
            Add a new {rightType} to this work and specify their ownership percentage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Entity Search */}
            <div className="space-y-2">
              <Label htmlFor="entity">
                {rightType === 'writer' ? 'Writer' : 'Publisher'}{' '}
                <span className="text-destructive">*</span>
              </Label>

              {!selectedEntity ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="entity"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for entities..."
                      className={`pl-9 ${errors.entity ? 'border-destructive' : ''}`}
                    />
                  </div>

                  {searchQuery.length >= 2 && (
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      {searchLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Searching...
                        </div>
                      ) : entities.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No entities found
                        </div>
                      ) : (
                        <ScrollArea className="max-h-48">
                          <div className="divide-y">
                            {entities.map((entity: Entity) => (
                              <button
                                key={entity.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEntity(entity);
                                  setSearchQuery('');
                                }}
                                className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-medium">{entity.display_name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {entity.type}
                                  </p>
                                </div>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}

                  {errors.entity && <p className="text-sm text-destructive">{errors.entity}</p>}
                  <p className="text-xs text-muted-foreground">
                    Type at least 2 characters to search
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm px-3 py-2">
                    {selectedEntity.display_name}
                    <span className="ml-2 text-xs opacity-70 capitalize">
                      ({selectedEntity.type})
                    </span>
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEntity(null);
                      setSearchQuery('');
                    }}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

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
                  className={errors.share ? 'border-destructive pr-8' : 'pr-8'}
                />
                <span className="absolute right-3 top-3 text-sm text-muted-foreground">%</span>
              </div>
              {errors.share && <p className="text-sm text-destructive">{errors.share}</p>}
              <p className="text-xs text-muted-foreground">
                Enter the ownership percentage (0-100)
              </p>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., Contract, Agreement, Manual entry"
              />
              <p className="text-xs text-muted-foreground">
                Where this split information came from
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createSplitMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSplitMutation.isPending}>
              {createSplitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Split
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
