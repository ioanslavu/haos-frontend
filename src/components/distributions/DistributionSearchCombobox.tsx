import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, X, Briefcase, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { distributionsService } from '@/api/services/distributions.service';
import { Distribution } from '@/types/distribution';
import { Badge } from '@/components/ui/badge';

const DEAL_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  in_negotiation: 'In Negotiation',
  expired: 'Expired',
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  artist: 'Artist',
  label: 'Label',
  aggregator: 'Aggregator',
  company: 'Company',
};

interface DistributionSearchComboboxProps {
  value?: number | null;
  onValueChange: (distributionId: number | null) => void;
  onDistributionSelect?: (distribution: Distribution | null) => void;
  placeholder?: string;
  className?: string;
  onCreateNew?: () => void;
}

export function DistributionSearchCombobox({
  value,
  onValueChange,
  onDistributionSelect,
  placeholder = 'Search distributions...',
  className,
  onCreateNew,
}: DistributionSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null);

  // Fetch selected distribution if value is provided (for edit mode)
  const { data: initialDistribution } = useQuery({
    queryKey: ['distribution', value],
    queryFn: () => distributionsService.getDistribution(value!),
    enabled: !!value && value > 0 && !selectedDistribution,
  });

  // Update selected distribution when initial distribution is fetched
  useEffect(() => {
    if (initialDistribution && value && !selectedDistribution) {
      setSelectedDistribution(initialDistribution);
    }
  }, [initialDistribution, value, selectedDistribution]);

  // Clear selected distribution when value is cleared from outside
  useEffect(() => {
    if (!value && selectedDistribution) {
      setSelectedDistribution(null);
    }
  }, [value, selectedDistribution]);

  // Search distributions
  const { data: distributionsData, isLoading } = useQuery({
    queryKey: ['distributions', 'search', searchQuery],
    queryFn: () => distributionsService.getDistributions({ search: searchQuery, page_size: 50 }),
    enabled: searchQuery.length >= 2,
  });

  const distributions = distributionsData?.results || [];

  const handleSelect = (distribution: Distribution) => {
    setSelectedDistribution(distribution);
    onValueChange(distribution.id);
    onDistributionSelect?.(distribution);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    setSelectedDistribution(null);
    onValueChange(null);
    onDistributionSelect?.(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && !(event.target as Element).closest('.distribution-search-combobox')) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={cn('distribution-search-combobox relative', className)}>
      {/* Selected Distribution Display or Search Button */}
      {selectedDistribution ? (
        <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
          <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {selectedDistribution.entity?.display_name || `Distribution #${selectedDistribution.id}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {selectedDistribution.deal_type && (
                <span className="truncate">{DEAL_TYPE_LABELS[selectedDistribution.deal_type]}</span>
              )}
              {selectedDistribution.deal_status && (
                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                  {DEAL_STATUS_LABELS[selectedDistribution.deal_status]}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-destructive/10"
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="w-full justify-between"
        >
          <span className="text-muted-foreground">{placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      )}

      {/* Dropdown */}
      {open && !selectedDistribution && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by entity name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {!isLoading && searchQuery.length >= 2 && distributions.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No distributions found</p>
                {onCreateNew && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                    className="text-xs"
                  >
                    + Create New Distribution
                  </Button>
                )}
              </div>
            )}

            {!isLoading && searchQuery.length < 2 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            )}

            {!isLoading && distributions.length > 0 && (
              <div className="py-1">
                {distributions.map((distribution) => (
                  <button
                    key={distribution.id}
                    onClick={() => handleSelect(distribution)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {distribution.entity?.display_name || `Distribution #${distribution.id}`}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {distribution.deal_type && (
                          <span className="truncate">{DEAL_TYPE_LABELS[distribution.deal_type]}</span>
                        )}
                        {distribution.deal_status && (
                          <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                            {DEAL_STATUS_LABELS[distribution.deal_status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Check className="h-4 w-4 opacity-0" />
                  </button>
                ))}
              </div>
            )}

            {onCreateNew && distributions.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                  className="w-full justify-start text-xs"
                >
                  + Create New Distribution
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
