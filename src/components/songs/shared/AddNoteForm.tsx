import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AddNoteFormProps {
  onSubmit: (content: string, isImportant: boolean) => Promise<void>;
  onCancel?: () => void;
}

export const AddNoteForm = ({ onSubmit, onCancel }: AddNoteFormProps) => {
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content, isImportant);
      // Reset form after successful submission
      setContent('');
      setIsImportant(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="note-content">Note Content</Label>
            <Textarea
              id="note-content"
              placeholder="Enter your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 min-h-[120px]"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-important"
              checked={isImportant}
              onCheckedChange={(checked) => setIsImportant(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="is-important"
              className="text-sm font-normal cursor-pointer"
            >
              Mark as important
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
