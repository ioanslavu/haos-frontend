import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import { ReleaseDetails } from '@/types/song';

const editReleaseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['single', 'ep', 'album', 'compilation', 'live_album', 'mixtape', 'soundtrack']),
  status: z.enum(['draft', 'scheduled', 'released', 'cancelled']),
  upc: z.string().optional(),
  release_date: z.date().optional(),
  catalog_number: z.string().optional(),
  label_name: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type EditReleaseFormValues = z.infer<typeof editReleaseFormSchema>;

interface EditReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release: ReleaseDetails;
  onSuccess?: () => void;
}

export function EditReleaseDialog({
  open,
  onOpenChange,
  release,
  onSuccess,
}: EditReleaseDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditReleaseFormValues>({
    resolver: zodResolver(editReleaseFormSchema),
    defaultValues: {
      title: release.title,
      type: release.type as any,
      status: release.status as any,
      upc: release.upc || '',
      release_date: release.release_date ? new Date(release.release_date) : undefined,
      catalog_number: release.catalog_number || '',
      label_name: release.label_name || '',
      description: release.description || '',
      notes: release.notes || '',
    },
  });

  // Reset form when release changes
  useEffect(() => {
    form.reset({
      title: release.title,
      type: release.type as any,
      status: release.status as any,
      upc: release.upc || '',
      release_date: release.release_date ? new Date(release.release_date) : undefined,
      catalog_number: release.catalog_number || '',
      label_name: release.label_name || '',
      description: release.description || '',
      notes: release.notes || '',
    });
  }, [release, form]);

  const updateReleaseMutation = useMutation({
    mutationFn: async (data: EditReleaseFormValues) => {
      const payload = {
        title: data.title,
        type: data.type,
        status: data.status,
        upc: data.upc || undefined,
        release_date: data.release_date ? format(data.release_date, 'yyyy-MM-dd') : undefined,
        catalog_number: data.catalog_number || undefined,
        label_name: data.label_name || undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
      };

      const response = await apiClient.patch(`/api/v1/releases/${release.id}/`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Release details updated successfully.',
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to update release. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: EditReleaseFormValues) => {
    setIsSubmitting(true);
    try {
      await updateReleaseMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Edit Release Details</DialogTitle>
          <DialogDescription>
            Update the release information and metadata.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Release title"
                        {...field}
                        className="glassmorphic"
                      />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="glassmorphic">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="released">Released</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    Public description for the release
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
                  <FormLabel>Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Internal notes..."
                      className="resize-none glassmorphic"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Internal notes (not visible publicly)
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
