import React, { useState } from 'react';
import { Search, Plus, Building2, User, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchGlobal, useAddToMyDepartment } from '@/api/hooks/useEntities';
import { EntityListItem } from '@/api/services/entities.service';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AddEntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntityAdded?: () => void;
  onCreateNew?: () => void;
}

export function AddEntityModal({
  open,
  onOpenChange,
  onEntityAdded,
  onCreateNew,
}: AddEntityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Global search (bypasses department filter)
  const { data: globalResults = [], isLoading: searching } = useSearchGlobal(
    searchQuery,
    searchQuery.length >= 2
  );

  // Add to department mutation
  const addToMyDepartment = useAddToMyDepartment();

  const handleAddToDepartment = async (entity: EntityListItem) => {
    try {
      const result = await addToMyDepartment.mutateAsync(entity.id);

      if (result.status === 'added') {
        toast({
          title: 'Entity added',
          description: `${entity.display_name} has been added to your department.`,
        });
        onEntityAdded?.();
        onOpenChange(false);
        setSearchQuery('');
      } else if (result.status === 'already_added') {
        toast({
          title: 'Already added',
          description: `${entity.display_name} is already in your department.`,
          variant: 'default',
        });
      } else if (result.status === 'reactivated') {
        toast({
          title: 'Entity reactivated',
          description: `${entity.display_name} has been reactivated in your department.`,
        });
        onEntityAdded?.();
        onOpenChange(false);
        setSearchQuery('');
      } else if (result.status === 'already_visible') {
        toast({
          title: 'Already visible',
          description: result.message || `${entity.display_name} is already visible to all departments.`,
          variant: 'default',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add entity to your department.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNew = () => {
    onCreateNew?.();
    onOpenChange(false);
    setSearchQuery('');
  };

  const getEntityIcon = (kind: 'PF' | 'PJ') => {
    return kind === 'PJ' ? (
      <Building2 className="h-4 w-4 text-muted-foreground" />
    ) : (
      <User className="h-4 w-4 text-muted-foreground" />
    );
  };

  const hasInternalRole = (entity: EntityListItem) => {
    // Check if entity has internal role badge
    return entity.roles?.some(role =>
      ['artist', 'producer', 'composer'].includes(role.toLowerCase())
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Entity to Your Department</DialogTitle>
          <DialogDescription>
            Search for an existing entity or create a new one. This helps prevent duplicates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="border rounded-md">
            {searching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search all entities...
              </div>
            ) : globalResults.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No entities found matching "{searchQuery}"
                </p>
                {onCreateNew && (
                  <Button onClick={handleCreateNew} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Entity
                  </Button>
                )}
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <div className="divide-y">
                  {globalResults.map((entity) => {
                    const isInternal = hasInternalRole(entity);
                    return (
                      <div
                        key={entity.id}
                        className="p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Entity Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {getEntityIcon(entity.kind)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">
                                  {entity.display_name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {entity.kind === 'PJ' ? 'Company' : 'Person'}
                                </Badge>
                                {isInternal && (
                                  <Badge variant="secondary" className="text-xs">
                                    Internal
                                  </Badge>
                                )}
                              </div>

                              {/* Contact Info */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                {entity.email && (
                                  <span className="truncate">{entity.email}</span>
                                )}
                                {entity.phone && (
                                  <>
                                    {entity.email && <span>•</span>}
                                    <span className="truncate">{entity.phone}</span>
                                  </>
                                )}
                              </div>

                              {/* Roles */}
                              {entity.roles && entity.roles.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {entity.roles.map((role, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs capitalize">
                                      {role}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Add Button */}
                          <Button
                            onClick={() => handleAddToDepartment(entity)}
                            disabled={addToMyDepartment.isPending || isInternal}
                            size="sm"
                          >
                            {addToMyDepartment.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : isInternal ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Visible
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Create New Button */}
          {globalResults.length > 0 && onCreateNew && (
            <div className="pt-2 border-t">
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Can't find it? Create New Entity
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
