import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createRecordingInSongContext } from '@/api/songApi';

interface CreateRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: number;
  songTitle: string;
  workId?: number;
}

interface RecordingFormData {
  title: string;
  type: string;
  work?: number;
  isrc?: string;
  duration_seconds?: number;
  bpm?: number;
  key?: string;
  studio?: string;
  version?: string;
  notes?: string;
}

const RECORDING_TYPES = [
  { value: 'audio_master', label: 'Studio' },
  { value: 'live_audio', label: 'Live' },
  { value: 'demo', label: 'Demo' },
  { value: 'remix', label: 'Remix' },
  { value: 'radio_edit', label: 'Radio Edit' },
  { value: 'acoustic', label: 'Acoustic' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'acapella', label: 'Acapella' },
  { value: 'extended', label: 'Extended' },
];

export function CreateRecordingDialog({
  open,
  onOpenChange,
  songId,
  songTitle,
  workId,
}: CreateRecordingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<RecordingFormData>({
    title: songTitle,
    type: 'audio_master',
    work: workId,
  });

  const createRecordingMutation = useMutation({
    mutationFn: async (data: RecordingFormData) => {
      // Create recording and automatically link to song in a single atomic operation
      const response = await createRecordingInSongContext(songId, {
        title: data.title,
        type: data.type as any,
        work: data.work,
        isrc: data.isrc,
        duration_seconds: data.duration_seconds,
        bpm: data.bpm,
        key: data.key,
        studio: data.studio,
        version: data.version,
        notes: data.notes,
        status: 'draft',
      });

      console.log('Created and linked recording:', response.data);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-recordings', songId] });
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Recording Created',
        description: 'The recording has been created and linked to the song successfully.',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Recording creation error:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.detail ||
                          error.message ||
                          'Failed to create recording. Please try again.';

      toast({
        title: 'Error Creating Recording',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: songTitle,
      type: 'audio_master',
      work: workId,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecordingMutation.mutate(formData);
  };

  const handleDurationChange = (value: string) => {
    // Parse MM:SS format to seconds
    const parts = value.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      setFormData({ ...formData, duration_seconds: minutes * 60 + seconds });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Recording
          </DialogTitle>
          <DialogDescription>
            Create a new recording and link it to this song. The recording will be associated with
            the song's work if available.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Recording title"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select recording type" />
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

          {/* Version */}
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={formData.version || ''}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g., Radio Edit, Acoustic Version"
            />
            <p className="text-xs text-muted-foreground">
              Optional version identifier (e.g., &quot;Radio Edit&quot;, &quot;Acoustic&quot;)
            </p>
          </div>

          {/* Grid for technical details */}
          <div className="grid grid-cols-2 gap-4">
            {/* ISRC */}
            <div className="space-y-2">
              <Label htmlFor="isrc">ISRC</Label>
              <Input
                id="isrc"
                value={formData.isrc || ''}
                onChange={(e) => setFormData({ ...formData, isrc: e.target.value })}
                placeholder="US-XXX-XX-XXXXX"
                maxLength={15}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (MM:SS)</Label>
              <Input
                id="duration"
                type="text"
                placeholder="03:45"
                pattern="[0-9]{1,2}:[0-9]{2}"
                onChange={(e) => handleDurationChange(e.target.value)}
              />
            </div>

            {/* BPM */}
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={formData.bpm || ''}
                onChange={(e) =>
                  setFormData({ ...formData, bpm: e.target.value ? parseInt(e.target.value) : undefined })
                }
                placeholder="120"
                min="1"
                max="300"
              />
            </div>

            {/* Key */}
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={formData.key || ''}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="C Major"
              />
            </div>
          </div>

          {/* Studio */}
          <div className="space-y-2">
            <Label htmlFor="studio">Studio</Label>
            <Input
              id="studio"
              value={formData.studio || ''}
              onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
              placeholder="Recording studio name"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this recording..."
              rows={3}
            />
          </div>

          {/* Work indicator */}
          {workId && (
            <div className="rounded-lg bg-muted/50 border border-muted p-3">
              <p className="text-sm text-muted-foreground">
                This recording will be automatically linked to the song's work.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createRecordingMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRecordingMutation.isPending}>
              {createRecordingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recording
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
