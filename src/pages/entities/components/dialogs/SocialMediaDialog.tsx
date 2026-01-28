import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SocialMediaFormState } from '../../types';

interface SocialMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  formState: SocialMediaFormState;
  onFormChange: (form: SocialMediaFormState) => void;
  onSave: () => void;
  saving: boolean;
}

export function SocialMediaDialog({
  open,
  onOpenChange,
  isEditing,
  formState,
  onFormChange,
  onSave,
  saving,
}: SocialMediaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Social Media Account</DialogTitle>
          <DialogDescription>Add your social media profile to showcase your online presence</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={formState.platform}
              onValueChange={(value) => onFormChange({ ...formState, platform: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="spotify">Spotify</SelectItem>
                <SelectItem value="apple_music">Apple Music</SelectItem>
                <SelectItem value="soundcloud">SoundCloud</SelectItem>
                <SelectItem value="bandcamp">Bandcamp</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Username/Handle</Label>
            <Input
              id="handle"
              placeholder="username (without @)"
              value={formState.handle}
              onChange={(e) => onFormChange({ ...formState, handle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Profile URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              value={formState.url}
              onChange={(e) => onFormChange({ ...formState, url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="Name shown on platform"
              value={formState.display_name}
              onChange={(e) => onFormChange({ ...formState, display_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="follower_count">Followers/Subscribers</Label>
            <Input
              id="follower_count"
              type="number"
              placeholder="0"
              value={formState.follower_count}
              onChange={(e) => onFormChange({ ...formState, follower_count: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_verified"
              checked={formState.is_verified}
              onCheckedChange={(checked) => onFormChange({ ...formState, is_verified: checked })}
            />
            <Label htmlFor="is_verified">Verified account</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_primary"
              checked={formState.is_primary}
              onCheckedChange={(checked) => onFormChange({ ...formState, is_primary: checked })}
            />
            <Label htmlFor="is_primary">Primary account for this platform</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !formState.url.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update' : 'Add'} Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
