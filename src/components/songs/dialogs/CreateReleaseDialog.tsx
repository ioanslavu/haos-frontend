import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCreateRelease, useLinkRelease } from '@/api/hooks/useSongs';

const releaseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['single', 'ep', 'album', 'compilation', 'live_album', 'mixtape', 'soundtrack']),
  upc: z.string().optional(),
  release_date: z.date().optional(),
  catalog_number: z.string().optional(),
  label_name: z.string().optional(),
  description: z.string().optional(),
});

type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

interface CreateReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: number;
  songTitle: string;
  onSuccess?: () => void;
}

export function CreateReleaseDialog({
  open,
  onOpenChange,
  songId,
  songTitle,
  onSuccess,
}: CreateReleaseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      title: songTitle,
      type: 'single',
      upc: '',
      catalog_number: '',
      label_name: '',
      description: '',
    },
  });

  const createReleaseMutation = useCreateRelease();
  const linkReleaseMutation = useLinkRelease();

  const onSubmit = async (data: ReleaseFormValues) => {
    setIsSubmitting(true);
    const releasePayload = {
      title: data.title,
      type: data.type,
      upc: data.upc || undefined,
      release_date: data.release_date ? format(data.release_date, 'yyyy-MM-dd') : undefined,
      catalog_number: data.catalog_number || undefined,
      label_name: data.label_name || undefined,
      description: data.description || undefined,
      status: 'draft',
    };
    try {
      const release = await createReleaseMutation.mutateAsync(releasePayload as any);
      await linkReleaseMutation.mutateAsync({ songId, releaseId: release.id });
      toast({
        title: 'Success',
        description: 'Release created and linked to song successfully.',
      });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to create release. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto glassmorphic">
        <DialogHeader>
          <DialogTitle>Create Release</DialogTitle>
          <DialogDescription>
            Create a new release and link it to this song. Fill in the release details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Release title"
                      {...field}
                      className="glassmorphic"
                    />
                  </FormControl>
                  <FormDescription>
                    The title of the release (pre-filled with song title)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="glassmorphic">
                        <SelectValue placeholder="Select release type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                      <SelectItem value="compilation">Compilation</SelectItem>
                      <SelectItem value="live_album">Live Album</SelectItem>
                      <SelectItem value="mixtape">Mixtape</SelectItem>
                      <SelectItem value="soundtrack">Soundtrack</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="release_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Release Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal glassmorphic',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The official release date for this release
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="upc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Universal Product Code"
                        {...field}
                        className="glassmorphic"
                      />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="catalog_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catalog Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., HAHA-001"
                        {...field}
                        className="glassmorphic"
                      />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="label_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Label name"
                      {...field}
                      className="glassmorphic"
                    />
                  </FormControl>
                  <FormDescription>
                    The label name for this release
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Release description..."
                      className="resize-none glassmorphic"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description for the release
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
                Create Release
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
