import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import catalogService from '@/api/services/catalog.service';
import { WorkWithSplits } from '@/types/catalog';
import { useToast } from '@/hooks/use-toast';

interface EditWorkDialogProps {
  work: WorkWithSplits;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditWorkDialog({ work, open, onClose, onSuccess }: EditWorkDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: work.title,
    iswc: work.iswc || '',
    language: work.language || '',
    genre: work.genre || '',
    sub_genre: work.sub_genre || '',
    year_composed: work.year_composed?.toString() || '',
    notes: work.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      title: work.title,
      iswc: work.iswc || '',
      language: work.language || '',
      genre: work.genre || '',
      sub_genre: work.sub_genre || '',
      year_composed: work.year_composed?.toString() || '',
      notes: work.notes || '',
    });
  }, [work]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const payload: any = {
        title: data.title,
        language: data.language || null,
        genre: data.genre || null,
        sub_genre: data.sub_genre || null,
        year_composed: data.year_composed ? parseInt(data.year_composed) : null,
        notes: data.notes || null,
      };

      // Only include ISWC if changed
      if (data.iswc && data.iswc !== work.iswc) {
        payload.iswc = data.iswc;
      }

      return catalogService.updateWork(work.id, payload);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to update work';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Handle field-specific errors
      if (error.response?.data) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach((key) => {
          if (Array.isArray(error.response.data[key])) {
            fieldErrors[key] = error.response.data[key][0];
          } else {
            fieldErrors[key] = error.response.data[key];
          }
        });
        setErrors(fieldErrors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.year_composed) {
      const year = parseInt(formData.year_composed);
      if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 10) {
        newErrors.year_composed = 'Please enter a valid year';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Work</DialogTitle>
          <DialogDescription>
            Update the work metadata. Changes will be reflected across all linked songs and recordings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter work title"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            {/* ISWC */}
            <div className="space-y-2">
              <Label htmlFor="iswc">ISWC</Label>
              <Input
                id="iswc"
                value={formData.iswc}
                onChange={(e) => setFormData({ ...formData, iswc: e.target.value })}
                placeholder="T-123.456.789-0"
                className={errors.iswc ? 'border-destructive' : ''}
              />
              {errors.iswc && <p className="text-sm text-destructive">{errors.iswc}</p>}
              <p className="text-xs text-muted-foreground">
                International Standard Musical Work Code
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  placeholder="e.g., English, Spanish"
                  className={errors.language ? 'border-destructive' : ''}
                />
                {errors.language && <p className="text-sm text-destructive">{errors.language}</p>}
              </div>

              {/* Year Composed */}
              <div className="space-y-2">
                <Label htmlFor="year_composed">Year Composed</Label>
                <Input
                  id="year_composed"
                  type="number"
                  value={formData.year_composed}
                  onChange={(e) => setFormData({ ...formData, year_composed: e.target.value })}
                  placeholder={new Date().getFullYear().toString()}
                  min="1000"
                  max={new Date().getFullYear() + 10}
                  className={errors.year_composed ? 'border-destructive' : ''}
                />
                {errors.year_composed && (
                  <p className="text-sm text-destructive">{errors.year_composed}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="e.g., Pop, Rock, Hip-Hop"
                  className={errors.genre ? 'border-destructive' : ''}
                />
                {errors.genre && <p className="text-sm text-destructive">{errors.genre}</p>}
              </div>

              {/* Sub-Genre */}
              <div className="space-y-2">
                <Label htmlFor="sub_genre">Sub-Genre</Label>
                <Input
                  id="sub_genre"
                  value={formData.sub_genre}
                  onChange={(e) => setFormData({ ...formData, sub_genre: e.target.value })}
                  placeholder="e.g., Indie Pop, Alternative"
                  className={errors.sub_genre ? 'border-destructive' : ''}
                />
                {errors.sub_genre && <p className="text-sm text-destructive">{errors.sub_genre}</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes about this work..."
                rows={4}
                className={errors.notes ? 'border-destructive' : ''}
              />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
