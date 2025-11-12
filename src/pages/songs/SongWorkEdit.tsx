import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWork, useUpdateWork } from '@/api/hooks/useSongs';
import { toast as sonnerToast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

// Form schema
const workFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  alternate_titles: z.string().optional(),
  language: z.string().optional(),
  genre: z.string().optional(),
  sub_genre: z.string().optional(),
  year_composed: z.number().min(1000).max(9999).optional().or(z.literal('')),
  lyrics: z.string().optional(),
  notes: z.string().optional(),
  translation_of: z.number().optional().or(z.literal('')),
  adaptation_of: z.number().optional().or(z.literal('')),
});

type WorkFormValues = z.infer<typeof workFormSchema>;

export default function SongWorkEdit() {
  const { id: songIdParam } = useParams();
  const navigate = useNavigate();
  const songId = parseInt(songIdParam || '0', 10);
  const updateWork = useUpdateWork();
  const [activeTab, setActiveTab] = useState('basic');

  // Fetch song to get work ID
  const { data: songData, isLoading: songLoading } = useQuery({
    queryKey: ['song', songId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/songs/${songId}/`);
      return response.data;
    },
    enabled: !!songId,
  });

  const song = songData?.data || songData;
  const workId = song?.work?.id;

  const { data: work, isLoading: workLoading } = useWork(workId, !!workId);

  const form = useForm<WorkFormValues>({
    resolver: zodResolver(workFormSchema),
    defaultValues: {
      title: '',
      alternate_titles: '',
      language: '',
      genre: '',
      sub_genre: '',
      year_composed: '' as any,
      lyrics: '',
      notes: '',
      translation_of: '' as any,
      adaptation_of: '' as any,
    },
  });

  // Update form when work data loads
  useEffect(() => {
    if (work) {
      form.reset({
        title: work.title || '',
        alternate_titles: Array.isArray(work.alternate_titles)
          ? work.alternate_titles.join(', ')
          : work.alternate_titles || '',
        language: work.language || '',
        genre: work.genre || '',
        sub_genre: work.sub_genre || '',
        year_composed: work.year_composed || ('' as any),
        lyrics: work.lyrics || '',
        notes: work.notes || '',
        translation_of: work.translation_of || ('' as any),
        adaptation_of: work.adaptation_of || ('' as any),
      });
    }
  }, [work, form]);

  const onSubmit = async (values: WorkFormValues) => {
    if (!workId) {
      sonnerToast.error('Work ID is missing');
      return;
    }

    try {
      // Clean up empty values
      const payload: any = {
        title: values.title,
      };

      if (values.alternate_titles && values.alternate_titles.trim()) {
        // Convert comma-separated string to array
        payload.alternate_titles = values.alternate_titles.split(',').map(t => t.trim()).filter(t => t);
      }

      if (values.language && values.language.trim()) payload.language = values.language;
      if (values.genre && values.genre.trim()) payload.genre = values.genre;
      if (values.sub_genre && values.sub_genre.trim()) payload.sub_genre = values.sub_genre;
      if (values.year_composed && values.year_composed !== '') payload.year_composed = Number(values.year_composed);
      if (values.lyrics && values.lyrics.trim()) payload.lyrics = values.lyrics;
      if (values.notes && values.notes.trim()) payload.notes = values.notes;
      if (values.translation_of && values.translation_of !== '') payload.translation_of = Number(values.translation_of);
      if (values.adaptation_of && values.adaptation_of !== '') payload.adaptation_of = Number(values.adaptation_of);

      await updateWork.mutateAsync({ id: workId, payload });
      sonnerToast.success('Work updated successfully');
      navigate(`/songs/${songId}`);
    } catch (error: any) {
      console.error('Failed to update work:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to update work');
    }
  };

  if (songLoading || workLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!song || !workId || !work) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/songs/${songId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Edit Work</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No work linked to this song or work not found</p>
            <Button className="mt-4" onClick={() => navigate(`/songs/${songId}`)}>
              Back to Song
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isSubmitting = updateWork.isPending;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/songs/${songId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Music className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Work</h1>
              <p className="text-sm text-muted-foreground mt-1">for {song.title}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Essential details about the musical work
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter work title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alternate_titles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alternate Titles</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter alternate titles separated by commas..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Separate multiple titles with commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ro">Romanian</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="it">Italian</SelectItem>
                                <SelectItem value="pt">Portuguese</SelectItem>
                                <SelectItem value="ru">Russian</SelectItem>
                                <SelectItem value="ja">Japanese</SelectItem>
                                <SelectItem value="ko">Korean</SelectItem>
                                <SelectItem value="zh">Chinese</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="year_composed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year Composed</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="YYYY"
                                min="1000"
                                max="9999"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Pop, Rock, Hip-Hop..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sub_genre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sub-genre</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Indie Pop, Alternative Rock..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lyrics & Notes</CardTitle>
                    <CardDescription>
                      Add the full lyrics and any internal notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="lyrics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lyrics</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter the full lyrics here..."
                              className="min-h-[300px] font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Full lyrics of the work
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
                              placeholder="Add any internal notes, reminders, or additional information..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Notes visible only to your team
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Relationships Tab */}
              <TabsContent value="relationships" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Related Works</CardTitle>
                    <CardDescription>
                      Link this work to other works if it's a translation or adaptation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="translation_of"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Translation Of</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter work ID if this is a translation..."
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Work ID of the original work (if this is a translation)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="adaptation_of"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adaptation Of</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter work ID if this is an adaptation..."
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Work ID of the original work (if this is an adaptation)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/songs/${songId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
