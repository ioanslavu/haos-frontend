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
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsService } from '@/api/services/campaigns.service';
import { Campaign, CampaignStatus, CampaignType, CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from '@/types/campaign';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QuickCreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated?: (campaign: Campaign) => void;
}

export function QuickCreateCampaignDialog({
  open,
  onOpenChange,
  onCampaignCreated,
}: QuickCreateCampaignDialogProps) {
  const [campaignName, setCampaignName] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [artistId, setArtistId] = useState<number | null>(null);
  const [campaignType, setCampaignType] = useState<CampaignType | ''>('');
  const [status, setStatus] = useState<CampaignStatus>('lead');
  const queryClient = useQueryClient();

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!clientId || !brandId) {
        throw new Error('Client and Brand are required');
      }
      return campaignsService.createCampaign({
        campaign_name: campaignName,
        client: clientId,
        brand: brandId,
        artist: artistId || undefined,
        campaign_type: campaignType || undefined,
        status,
        currency: 'EUR', // Default currency
      });
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully');
      onCampaignCreated?.(campaign);
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create campaign');
    },
  });

  const handleClose = () => {
    setCampaignName('');
    setClientId(null);
    setBrandId(null);
    setArtistId(null);
    setCampaignType('');
    setStatus('lead');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (!clientId) {
      toast.error('Client is required');
      return;
    }
    if (!brandId) {
      toast.error('Brand is required');
      return;
    }
    createCampaignMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Quickly create a new campaign with basic information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name" className="text-sm font-medium">
                Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                required
                autoFocus
              />
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">
                Client <span className="text-destructive">*</span>
              </Label>
              <EntitySearchCombobox
                value={clientId}
                onValueChange={setClientId}
                placeholder="Select client"
                useBusinessEndpoint={true}
                allowAddEntity={true}
              />
              <p className="text-xs text-muted-foreground">
                Required - the client entity
              </p>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand" className="text-sm font-medium">
                Brand <span className="text-destructive">*</span>
              </Label>
              <EntitySearchCombobox
                value={brandId}
                onValueChange={setBrandId}
                placeholder="Select brand"
                useBusinessEndpoint={true}
                allowAddEntity={true}
              />
              <p className="text-xs text-muted-foreground">
                Required - the brand entity
              </p>
            </div>

            {/* Artist (optional) */}
            <div className="space-y-2">
              <Label htmlFor="artist" className="text-sm font-medium">
                Artist
              </Label>
              <EntitySearchCombobox
                value={artistId}
                onValueChange={setArtistId}
                placeholder="Select artist (optional)"
                filter={{ has_role: 'artist' }}
                allowAddEntity={true}
              />
              <p className="text-xs text-muted-foreground">
                Optional - can be added later
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Campaign Type */}
              <div className="space-y-2">
                <Label htmlFor="campaign-type" className="text-sm font-medium">
                  Campaign Type
                </Label>
                <Select value={campaignType} onValueChange={(value) => setCampaignType(value as CampaignType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="endorsement">{CAMPAIGN_TYPE_LABELS.endorsement}</SelectItem>
                    <SelectItem value="post">{CAMPAIGN_TYPE_LABELS.post}</SelectItem>
                    <SelectItem value="song">{CAMPAIGN_TYPE_LABELS.song}</SelectItem>
                    <SelectItem value="sale">{CAMPAIGN_TYPE_LABELS.sale}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select value={status} onValueChange={(value) => setStatus(value as CampaignStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">{CAMPAIGN_STATUS_LABELS.lead}</SelectItem>
                    <SelectItem value="negotiation">{CAMPAIGN_STATUS_LABELS.negotiation}</SelectItem>
                    <SelectItem value="confirmed">{CAMPAIGN_STATUS_LABELS.confirmed}</SelectItem>
                    <SelectItem value="active">{CAMPAIGN_STATUS_LABELS.active}</SelectItem>
                    <SelectItem value="completed">{CAMPAIGN_STATUS_LABELS.completed}</SelectItem>
                    <SelectItem value="lost">{CAMPAIGN_STATUS_LABELS.lost}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createCampaignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCampaignMutation.isPending || !campaignName.trim() || !clientId || !brandId}
            >
              {createCampaignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
