import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createWorkInSongContext } from '@/api/songApi';
import { useToast } from '@/hooks/use-toast';

interface CreateWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: number;
  songTitle: string;
  onSuccess: () => void;
}

interface WorkFormData {
  title: string;
  iswc?: string;
  notes?: string;
}

export function CreateWorkDialog({
  open,
  onOpenChange,
  songId,
  songTitle,
  onSuccess,
}: CreateWorkDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WorkFormData>({
    defaultValues: {
      title: songTitle,
      iswc: '',
      notes: '',
    },
  });

  const createWorkMutation = useMutation({
    mutationFn: async (data: WorkFormData) => {
      // Create work and automatically link to song in a single atomic operation
      const response = await createWorkInSongContext(songId, {
        title: data.title,
        iswc: data.iswc || undefined,
        notes: data.notes || undefined,
      });

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Work Created',
        description: 'The work has been created and linked to this song.',
      });
      form.reset();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.response?.data?.detail || 'Failed to create work. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: WorkFormData) => {
    setIsSubmitting(true);
    try {
      await createWorkMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Work</DialogTitle>
          <DialogDescription>
            Create a new work record and link it to this song. The work represents the underlying composition.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter work title"
                      {...field}
                      className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-white/10"
                    />
                  </FormControl>
                  <FormDescription>
                    The title of the composition (pre-filled with song title)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iswc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ISWC (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., T-123.456.789-0"
                      {...field}
                      className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-white/10"
                    />
                  </FormControl>
                  <FormDescription>
                    International Standard Musical Work Code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this work"
                      className="resize-none bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-white/10"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information about the work
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Work
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
