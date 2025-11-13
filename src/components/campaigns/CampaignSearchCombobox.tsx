import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, X, Briefcase, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { campaignsService } from '@/api/services/campaigns.service';
import { Campaign } from '@/types/campaign';
import { Badge } from '@/components/ui/badge';
import { CAMPAIGN_STATUS_LABELS } from '@/types/campaign';

interface CampaignSearchComboboxProps {
  value?: number | null;
  onValueChange: (campaignId: number | null) => void;
  onCampaignSelect?: (campaign: Campaign | null) => void;
  placeholder?: string;
  className?: string;
  onCreateNew?: () => void;
}

export function CampaignSearchCombobox({
  value,
  onValueChange,
  onCampaignSelect,
  placeholder = 'Search campaigns...',
  className,
  onCreateNew,
}: CampaignSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Fetch selected campaign if value is provided (for edit mode)
  const { data: initialCampaign } = useQuery({
    queryKey: ['campaign', value],
    queryFn: () => campaignsService.getCampaign(value!),
    enabled: !!value && value > 0 && !selectedCampaign,
  });

  // Update selected campaign when initial campaign is fetched
  useEffect(() => {
    if (initialCampaign && value && !selectedCampaign) {
      setSelectedCampaign(initialCampaign);
    }
  }, [initialCampaign, value, selectedCampaign]);

  // Clear selected campaign when value is cleared from outside
  useEffect(() => {
    if (!value && selectedCampaign) {
      setSelectedCampaign(null);
    }
  }, [value, selectedCampaign]);

  // Search campaigns
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', 'search', searchQuery],
    queryFn: () => campaignsService.getCampaigns({ search: searchQuery, page_size: 50 }),
    enabled: searchQuery.length >= 2,
  });

  const campaigns = campaignsData?.results || [];

  const handleSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    onValueChange(campaign.id);
    onCampaignSelect?.(campaign);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    setSelectedCampaign(null);
    onValueChange(null);
    onCampaignSelect?.(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && !(event.target as Element).closest('.campaign-search-combobox')) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={cn('campaign-search-combobox relative', className)}>
      {/* Selected Campaign Display or Search Button */}
      {selectedCampaign ? (
        <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
          <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedCampaign.campaign_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {selectedCampaign.client?.display_name && (
                <span className="truncate">{selectedCampaign.client.display_name}</span>
              )}
              {selectedCampaign.status && (
                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">
                  {CAMPAIGN_STATUS_LABELS[selectedCampaign.status]}
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
      {open && !selectedCampaign && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, client, artist..."
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

            {!isLoading && searchQuery.length >= 2 && campaigns.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No campaigns found</p>
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
                    + Create New Campaign
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

            {!isLoading && campaigns.length > 0 && (
              <div className="py-1">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => handleSelect(campaign)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{campaign.campaign_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {campaign.client?.display_name && (
                          <span className="truncate">{campaign.client.display_name}</span>
                        )}
                        {campaign.artist?.display_name && (
                          <span className="truncate">• {campaign.artist.display_name}</span>
                        )}
                        {campaign.status && (
                          <Badge variant="outline" className="text-xs py-0 px-1.5 h-4">
                            {CAMPAIGN_STATUS_LABELS[campaign.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Check className="h-4 w-4 opacity-0" />
                  </button>
                ))}
              </div>
            )}

            {onCreateNew && campaigns.length > 0 && (
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
                  + Create New Campaign
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
