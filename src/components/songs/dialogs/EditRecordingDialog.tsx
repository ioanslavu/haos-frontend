import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Recording } from '@/types/song';
import { useUpdateRecording } from '@/api/hooks/useSongs';

interface EditRecordingDialogProps {
  recording: Recording;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface RecordingUpdate {
  title?: string;
  type?: string;
  status?: string;
  duration_seconds?: number;
  bpm?: number;
  key?: string;
  studio?: string;
  recording_date?: string;
  version?: string;
  notes?: string;
}

const RECORDING_TYPES = [
  { value: 'audio_master', label: 'Audio Master' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'live_audio', label: 'Live Audio' },
  { value: 'live_video', label: 'Live Video' },
  { value: 'remix', label: 'Remix' },
  { value: 'radio_edit', label: 'Radio Edit' },
  { value: 'acoustic', label: 'Acoustic Version' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'acapella', label: 'A Cappella' },
  { value: 'extended', label: 'Extended Version' },
  { value: 'demo', label: 'Demo' },
];

const RECORDING_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'approved', label: 'Approved' },
  { value: 'released', label: 'Released' },
  { value: 'archived', label: 'Archived' },
];

export function EditRecordingDialog({
  recording,
  open,
  onOpenChange,
  onSuccess,
}: EditRecordingDialogProps) {
  const [formData, setFormData] = useState<RecordingUpdate>({
    title: recording.title,
    type: recording.type,
    status: recording.status,
    duration_seconds: recording.duration_seconds,
    bpm: recording.bpm,
    key: recording.key,
    studio: recording.studio,
    recording_date: recording.recording_date,
    version: recording.version,
    notes: recording.notes,
  });

  useEffect(() => {
    setFormData({
      title: recording.title,
      type: recording.type,
      status: recording.status,
      duration_seconds: recording.duration_seconds,
      bpm: recording.bpm,
      key: recording.key,
      studio: recording.studio,
      recording_date: recording.recording_date,
      version: recording.version,
      notes: recording.notes,
    });
  }, [recording]);

  const updateMutationHook = useUpdateRecording();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutationHook.mutate(
      { id: recording.id, data: formData as Partial<Recording> },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recording</DialogTitle>
          <DialogDescription>
            Update recording details and metadata
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORDING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORDING_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="e.g., Radio Edit, Album Version"
                value={formData.version || ''}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration_seconds || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_seconds: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                min="20"
                max="300"
                value={formData.bpm || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bpm: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Musical Key</Label>
              <Input
                id="key"
                placeholder="e.g., C Major, A Minor"
                value={formData.key || ''}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studio">Recording Studio</Label>
              <Input
                id="studio"
                placeholder="Studio name"
                value={formData.studio || ''}
                onChange={(e) =>
                  setFormData({ ...formData, studio: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording_date">Recording Date</Label>
              <Input
                id="recording_date"
                type="date"
                value={formData.recording_date || ''}
                onChange={(e) =>
                  setFormData({ ...formData, recording_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes about this recording"
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutationHook.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutationHook.isPending}>
              {updateMutationHook.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
