import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SongAsset, AssetType } from '@/types/song';
import { updateAsset } from '@/api/songApi';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AssetEditDialogProps {
  asset: SongAsset;
  open: boolean;
  onClose: () => void;
  songId: number;
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'cover_art', label: 'Cover Art' },
  { value: 'back_cover', label: 'Back Cover' },
  { value: 'press_photo', label: 'Press Photo' },
  { value: 'promotional_graphic', label: 'Promotional Graphic' },
  { value: 'social_media_asset', label: 'Social Media Asset' },
  { value: 'marketing_copy', label: 'Marketing Copy' },
  { value: 'other', label: 'Other' },
];

export const AssetEditDialog = ({
  asset,
  open,
  onClose,
  songId,
}: AssetEditDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    asset_type: asset.asset_type,
    title: asset.title,
    description: asset.description || '',
    google_drive_url: asset.google_drive_url,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateAssetMutation = useMutation({
    mutationFn: (data: typeof formData) => updateAsset(songId, asset.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
      toast({
        title: 'Asset Updated',
        description: 'The asset has been updated successfully.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update asset.',
        variant: 'destructive',
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.google_drive_url.trim()) {
      newErrors.google_drive_url = 'Google Drive URL is required';
    } else {
      try {
        new URL(formData.google_drive_url);
      } catch {
        newErrors.google_drive_url = 'Must be a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    updateAssetMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      asset_type: asset.asset_type,
      title: asset.title,
      description: asset.description || '',
      google_drive_url: asset.google_drive_url,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Update the asset metadata and details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset Type */}
          <div className="space-y-2">
            <Label htmlFor="asset_type">Asset Type</Label>
            <Select
              value={formData.asset_type}
              onValueChange={(value) =>
                setFormData({ ...formData, asset_type: value as AssetType })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) {
                  setErrors({ ...errors, title: '' });
                }
              }}
              placeholder="e.g., Album Cover - Final Version"
              maxLength={200}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Google Drive URL */}
          <div className="space-y-2">
            <Label htmlFor="google_drive_url">
              Google Drive URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="google_drive_url"
              value={formData.google_drive_url}
              onChange={(e) => {
                setFormData({ ...formData, google_drive_url: e.target.value });
                if (errors.google_drive_url) {
                  setErrors({ ...errors, google_drive_url: '' });
                }
              }}
              placeholder="https://drive.google.com/file/d/..."
            />
            {errors.google_drive_url && (
              <p className="text-xs text-destructive">{errors.google_drive_url}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Make sure the sharing settings are enabled for this file.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Additional notes about this asset, version info, or special instructions..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={updateAssetMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateAssetMutation.isPending}>
            {updateAssetMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
