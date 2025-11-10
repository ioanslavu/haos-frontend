import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Disc3, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCreateRelease } from '@/api/hooks/useCatalog';
import { addReleaseToSong } from '@/api/songApi';
import { toast as sonnerToast } from 'sonner';
import apiClient from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const releaseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  release_type: z.enum(['single', 'ep', 'album', 'compilation', 'live_album', 'mixtape', 'soundtrack']),
  status: z.enum(['draft', 'scheduled', 'released']).default('draft'),
  release_date: z.string().optional(),
  label_name: z.string().optional(),
  catalog_number: z.string().optional(),
  upc: z.string().optional(),
  notes: z.string().optional(),
});

type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

export default function ReleaseCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const createRelease = useCreateRelease();

  // Get songId from URL params
  const songIdParam = searchParams.get('songId');
  const songId = songIdParam ? parseInt(songIdParam) : undefined;

  // Fetch song if songId provided
  const { data: songData } = useQuery({
    queryKey: ['song', songId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/songs/${songId}/`);
      return response.data;
    },
    enabled: !!songId,
  });

  const song = songData?.data || songData;

  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      title: '',
      release_type: 'single',
      status: 'draft',
      release_date: '',
      label_name: 'HaHaHa Production',
      catalog_number: '',
      upc: '',
      notes: '',
    },
  });

  // Pre-fill from song
  useEffect(() => {
    if (song) {
      if (song.title && !form.getValues('title')) {
        form.setValue('title', song.title);
      }
      if (song.target_release_date) {
        form.setValue('release_date', song.target_release_date);
      }
    }
  }, [song, form]);

  const onSubmit = async (values: ReleaseFormValues) => {
    try {
      // Clean up empty values
      const payload: any = {
        title: values.title,
        release_type: values.release_type,
        status: values.status,
      };

      if (values.release_date) payload.release_date = values.release_date;
      if (values.label_name) payload.label_name = values.label_name;
      if (values.catalog_number) payload.catalog_number = values.catalog_number;
      if (values.upc) payload.upc = values.upc;
      if (values.notes) payload.notes = values.notes;

      const release = await createRelease.mutateAsync(payload);
      sonnerToast.success('Release created successfully');

      // If songId exists, link song to release
      if (songId && release?.id) {
        try {
          await addReleaseToSong(songId, release.id);
          sonnerToast.success('Release linked to song');
          queryClient.invalidateQueries({ queryKey: ['song', songId] });
          navigate(`/songs/${songId}`);
        } catch (linkError) {
          console.error('Failed to link release to song:', linkError);
          sonnerToast.error('Release created but failed to link to song');
          navigate(`/catalog/releases/${release.id}`);
        }
      } else {
        navigate(`/catalog/releases/${release.id}`);
      }
    } catch (error: any) {
      console.error('Release creation error:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to create release');
    }
  };

  const handleCancel = () => {
    navigate(songId ? `/songs/${songId}` : '/catalog/releases');
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Create Release</h1>
            <p className="text-muted-foreground">
              Singles, EPs, albums, and compilations
            </p>
          </div>
        </div>

        {/* Context Banner */}
        {song && (
          <Alert className="border-primary/20 bg-primary/5">
            <Disc3 className="h-4 w-4 text-primary" />
            <AlertDescription>
              Creating release for song: <strong>{song.title}</strong>
              {song.artist?.display_name && ` by ${song.artist.display_name}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle>Release Information</CardTitle>
            <CardDescription>
              Enter the release details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Release title" {...field} />
                      </FormControl>
                      <FormDescription>
                        The official title of this release
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Release Type */}
                <FormField
                  control={form.control}
                  name="release_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormDescription>
                        Type of release (Single, EP, Album, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="released">Released</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Current status of this release
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Release Date */}
                <FormField
                  control={form.control}
                  name="release_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Official release date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Label Name */}
                <FormField
                  control={form.control}
                  name="label_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label Name</FormLabel>
                      <FormControl>
                        <Input placeholder="HaHaHa Production" {...field} />
                      </FormControl>
                      <FormDescription>
                        Record label releasing this
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Catalog Number */}
                <FormField
                  control={form.control}
                  name="catalog_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catalog Number</FormLabel>
                      <FormControl>
                        <Input placeholder="HAH-001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Label catalog number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* UPC */}
                <FormField
                  control={form.control}
                  name="upc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPC</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012" {...field} />
                      </FormControl>
                      <FormDescription>
                        Universal Product Code (12 or 13 digits)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Internal notes about this release..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Internal notes (not visible to public)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={createRelease.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRelease.isPending}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {createRelease.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : songId ? (
                      'Save & Return to Song'
                    ) : (
                      'Create Release'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
