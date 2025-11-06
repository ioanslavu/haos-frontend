import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';

const addPlatformFormSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['planned', 'submitted', 'processing', 'live', 'private', 'blocked', 'taken_down', 'expired']),
  external_id: z.string().optional(),
  territory: z.string().min(1, 'Territory is required'),
  published_at: z.date().optional(),
  scheduled_for: z.date().optional(),
  is_monetized: z.boolean().default(true),
  notes: z.string().optional(),
});

type AddPlatformFormValues = z.infer<typeof addPlatformFormSchema>;

interface AddPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  releaseId: number;
  onSuccess?: () => void;
}

export function AddPlatformDialog({
  open,
  onOpenChange,
  releaseId,
  onSuccess,
}: AddPlatformDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddPlatformFormValues>({
    resolver: zodResolver(addPlatformFormSchema),
    defaultValues: {
      platform: '',
      url: '',
      status: 'planned',
      external_id: '',
      territory: 'GLOBAL',
      is_monetized: true,
      notes: '',
    },
  });

  const createPublicationMutation = useMutation({
    mutationFn: async (data: AddPlatformFormValues) => {
      const payload = {
        object_type: 'release',
        object_id: releaseId,
        platform: data.platform,
        url: data.url || undefined,
        status: data.status,
        external_id: data.external_id || undefined,
        territory: data.territory,
        published_at: data.published_at ? data.published_at.toISOString() : undefined,
        scheduled_for: data.scheduled_for ? data.scheduled_for.toISOString() : undefined,
        is_monetized: data.is_monetized,
        notes: data.notes || undefined,
      };

      return await apiClient.post('/api/v1/distribution/publications/', payload);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Platform added successfully.',
      });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to add platform. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: AddPlatformFormValues) => {
    setIsSubmitting(true);
    try {
      await createPublicationMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const platformOptions = [
    { value: 'spotify_album', label: 'Spotify Album' },
    { value: 'apple_music_album', label: 'Apple Music Album' },
    { value: 'youtube_music', label: 'YouTube Music' },
    { value: 'youtube_video', label: 'YouTube Video' },
    { value: 'amazon_music_album', label: 'Amazon Music Album' },
    { value: 'deezer_album', label: 'Deezer Album' },
    { value: 'tidal_album', label: 'Tidal Album' },
    { value: 'bandcamp_album', label: 'Bandcamp Album' },
    { value: 'soundcloud_track', label: 'SoundCloud' },
    { value: 'tiktok_sound', label: 'TikTok Sound' },
    { value: 'instagram_audio', label: 'Instagram Audio' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Add Distribution Platform</DialogTitle>
          <DialogDescription>
            Add a new platform for distribution of this release.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="glassmorphic">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {platformOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="taken_down">Taken Down</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="territory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Territory *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., GLOBAL, US, UK"
                        {...field}
                        className="glassmorphic"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      ISO country code or GLOBAL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      className="glassmorphic"
                    />
                  </FormControl>
                  <FormDescription>
                    Full URL to the content on the platform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="external_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Platform-specific ID"
                      {...field}
                      className="glassmorphic"
                    />
                  </FormControl>
                  <FormDescription>
                    Platform-specific ID (e.g., Spotify URI, YouTube video ID)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduled_for"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled For</FormLabel>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="published_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Published At</FormLabel>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_monetized"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Monetization Enabled
                    </FormLabel>
                    <FormDescription>
                      Is monetization enabled for this publication?
                    </FormDescription>
                  </div>
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
                Add Platform
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
