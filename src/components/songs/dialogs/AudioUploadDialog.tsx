import { useState, useRef } from 'react';
import { Loader2, Upload, FileAudio, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useUploadRecordingAsset } from '@/api/hooks/useSongs';

interface AudioUploadDialogProps {
  recordingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AssetUpload {
  file: File | null;
  kind: string;
  is_master: boolean;
  is_public: boolean;
  notes?: string;
}

const ASSET_KINDS = [
  { value: 'master', label: 'Master Audio' },
  { value: 'audio', label: 'Audio Mix' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'stems', label: 'Stems Package' },
  { value: 'demo', label: 'Demo Recording' },
  { value: 'alternate_mix', label: 'Alternate Mix' },
];

const ACCEPTED_FORMATS = [
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/mpeg',
  'audio/mp3',
  'audio/aiff',
  'audio/x-aiff',
  'audio/m4a',
  'audio/mp4',
];

export function AudioUploadDialog({
  recordingId,
  open,
  onOpenChange,
  onSuccess,
}: AudioUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState<AssetUpload>({
    file: null,
    kind: 'audio',
    is_master: false,
    is_public: false,
    notes: '',
  });

  const uploadMutation = useUploadRecordingAsset();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        alert('Please select a valid audio file (WAV, FLAC, MP3, AIFF, M4A)');
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.file) {
      uploadMutation.mutate(
        {
          recordingId,
          file: formData.file,
          metadata: {
            kind: formData.kind,
            is_master: formData.is_master,
            is_public: formData.is_public,
            notes: formData.notes,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
            setFormData({
              file: null,
              kind: 'audio',
              is_master: false,
              is_public: false,
              notes: '',
            });
            setUploadProgress(0);
          },
          onError: () => {
            setUploadProgress(0);
          },
        }
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Audio File</DialogTitle>
          <DialogDescription>
            Upload master recordings, stems, or alternate mixes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Audio File *</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                formData.file
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FORMATS.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />

              {formData.file ? (
                <div className="space-y-2">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                  <div className="font-medium">{formData.file.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(formData.file.size)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, file: null });
                    }}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileAudio className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="font-medium">Click to select audio file</div>
                  <div className="text-xs text-muted-foreground">
                    WAV, FLAC, MP3, AIFF, M4A (max 500MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kind">File Type *</Label>
              <Select
                value={formData.kind}
                onValueChange={(value) =>
                  setFormData({ ...formData, kind: value })
                }
              >
                <SelectTrigger id="kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_KINDS.map((kind) => (
                    <SelectItem key={kind.value} value={kind.value}>
                      {kind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-8">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_master"
                  checked={formData.is_master}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_master: checked as boolean })
                  }
                />
                <label
                  htmlFor="is_master"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Master Recording
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_public: checked as boolean })
                  }
                />
                <label
                  htmlFor="is_public"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Publicly Accessible
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Technical notes, version info, etc."
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          {uploadMutation.isError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Upload failed. Please try again or contact support.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !formData.file}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
