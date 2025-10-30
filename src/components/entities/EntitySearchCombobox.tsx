import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2, X, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useSearchEntities, useBusinessEntities, useEntity } from '@/api/hooks/useEntities';
import { EntityListItem } from '@/api/services/entities.service';

interface EntitySearchComboboxProps {
  value?: number | null;
  onValueChange: (entityId: number | null) => void;
  onEntitySelect?: (entity: EntityListItem | null) => void;
  placeholder?: string;
  className?: string;
  filter?: {
    kind?: 'PF' | 'PJ';
    has_role?: string;
  };
  /**
   * Use business endpoint - returns all entities with business roles
   * (client, brand, label, booking, etc.)
   * Set to true for client/brand searches to ensure same list
   */
  useBusinessEndpoint?: boolean;
}

export function EntitySearchCombobox({
  value,
  onValueChange,
  onEntitySelect,
  placeholder = 'Select entity...',
  className,
  filter,
  useBusinessEndpoint = false,
}: EntitySearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<EntityListItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch selected entity if value is provided (for edit mode)
  const { data: initialEntity } = useEntity(value || 0, !!value && value > 0 && !selectedEntity);

  // Update selected entity when initial entity is fetched
  useEffect(() => {
    if (initialEntity && value && !selectedEntity) {
      setSelectedEntity(initialEntity);
    }
  }, [initialEntity, value, selectedEntity]);

  // Clear selected entity when value is cleared from outside
  useEffect(() => {
    if (!value && selectedEntity) {
      setSelectedEntity(null);
    }
  }, [value, selectedEntity]);

  // Use business endpoint or general search based on prop
  const { data: searchEntitiesData = [], isLoading: searchLoading } = useSearchEntities(
    searchQuery,
    !useBusinessEndpoint && searchQuery.length > 0
  );

  const { data: businessEntitiesData, isLoading: businessLoading } = useBusinessEntities(
    {
      search: searchQuery,
      page_size: 50,
      ...filter,
    },
    useBusinessEndpoint
  );

  const entities = useBusinessEndpoint ? (businessEntitiesData?.results || []) : searchEntitiesData;
  const isLoading = useBusinessEndpoint ? businessLoading : searchLoading;

  // Filter entities based on provided filters (only for non-business endpoint)
  const filteredEntities = useBusinessEndpoint
    ? entities // Business endpoint already filters
    : entities.filter((entity) => {
        if (filter?.kind && entity.kind !== filter.kind) return false;
        if (filter?.has_role) {
          const hasRole = entity.roles?.some(role =>
            role.toLowerCase() === filter.has_role?.toLowerCase()
          );
          if (!hasRole) return false;
        }
        return true;
      });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (entity: EntityListItem) => {
    setSelectedEntity(entity);
    onValueChange(entity.id);
    onEntitySelect?.(entity);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEntity(null);
    onValueChange(null);
    onEntitySelect?.(null);
  };

  const getEntityIcon = (kind: 'PF' | 'PJ') => {
    return kind === 'PJ' ? (
      <Building2 className="h-3 w-3 text-muted-foreground" />
    ) : (
      <User className="h-3 w-3 text-muted-foreground" />
    );
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-auto min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <div className="flex items-center justify-between w-full">
          {selectedEntity ? (
            <div className="flex items-center gap-2">
              {getEntityIcon(selectedEntity.kind)}
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedEntity.display_name}</span>
                {selectedEntity.email && (
                  <span className="text-xs text-muted-foreground">
                    {selectedEntity.email}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 ml-2">
            {selectedEntity && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex flex-col">
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : searchQuery.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search entities...
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No entities found.
                </div>
              ) : (
                <div className="p-1">
                  {filteredEntities.map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      className={cn(
                        'w-full relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left',
                        value === entity.id && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => handleSelect(entity)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 flex-shrink-0',
                          value === entity.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getEntityIcon(entity.kind)}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{entity.display_name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                            {entity.email && <span className="truncate">{entity.email}</span>}
                            {entity.phone && (
                              <>
                                {entity.email && <span>•</span>}
                                <span className="truncate">{entity.phone}</span>
                              </>
                            )}
                            {entity.roles && entity.roles.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="truncate capitalize">
                                  {entity.roles.join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}