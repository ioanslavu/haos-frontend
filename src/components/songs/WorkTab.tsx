import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Link2, Edit, X, CheckCircle2, AlertCircle, Users, DollarSign, Music, Calendar, Loader2, AlertTriangle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useWorkDetails, useCreateWork, useUpdateWork } from '@/api/hooks/useCatalog';
import { useSplitsByObject, useDeleteCredit, useCreditsByObject } from '@/api/hooks/useRights';
import { fetchSongWork, createWorkInSongContext } from '@/api/songApi';
import { toast as sonnerToast } from 'sonner';
import { Song } from '@/types/song';
import { AddISWCDialog } from '../../pages/catalog/components/AddISWCDialog';
import { AddCreditDialog } from '../../pages/catalog/components/AddCreditDialog';
import { AddSplitDialog } from '../../pages/catalog/components/AddSplitDialog';

interface WorkTabProps {
  song: Song;
}

type ViewMode = 'details' | 'create' | 'edit';

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

export function WorkTab({ song }: WorkTabProps) {
  const queryClient = useQueryClient();
  const songId = song.id;
  const hasWork = !!song.work;

  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [activeFormTab, setActiveFormTab] = useState('basic');

  // Dialog states for details view
  const [iswcDialogOpen, setIswcDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<any>(null);
  const [writerSplitDialogOpen, setWriterSplitDialogOpen] = useState(false);
  const [publisherSplitDialogOpen, setPublisherSplitDialogOpen] = useState(false);

  // Queries - Fetch work from song context (consistent with recordings)
  const { data: workData, isLoading: workLoading } = useQuery({
    queryKey: ['song-work', songId],
    queryFn: () => fetchSongWork(songId),
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (no work exists yet)
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const workDetails = workData?.data;
  const workId = workDetails?.id;

  // Fetch credits and splits using the workId from workDetails
  const { data: credits } = useCreditsByObject('work', workId, !!workId);
  const { data: writerSplits } = useSplitsByObject('work', workId, 'writer');
  const { data: publisherSplits } = useSplitsByObject('work', workId, 'publisher');

  // Mutations
  const deleteCredit = useDeleteCredit();

  // Mutations
  const createWork = useCreateWork();
  const updateWork = useUpdateWork();

  // Form
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

  // Set view mode and populate form when work exists
  useEffect(() => {
    if (hasWork && viewMode === 'details') {
      // Stay in details mode
    } else if (!hasWork && viewMode === 'details') {
      // No work, stay in details mode (will show create buttons)
    }
  }, [hasWork, viewMode]);

  // Populate form when editing or creating
  useEffect(() => {
    if (viewMode === 'edit' && workDetails) {
      form.reset({
        title: workDetails.title || '',
        alternate_titles: Array.isArray(workDetails.alternate_titles)
          ? workDetails.alternate_titles.join(', ')
          : workDetails.alternate_titles || '',
        language: workDetails.language || '',
        genre: workDetails.genre || '',
        sub_genre: workDetails.sub_genre || '',
        year_composed: workDetails.year_composed || ('' as any),
        lyrics: workDetails.lyrics || '',
        notes: workDetails.notes || '',
        translation_of: workDetails.translation_of || ('' as any),
        adaptation_of: workDetails.adaptation_of || ('' as any),
      });
    } else if (viewMode === 'create') {
      form.reset({
        title: song.title || '',
        alternate_titles: '',
        language: song.language || '',
        genre: song.genre || '',
        sub_genre: '',
        year_composed: '' as any,
        lyrics: '',
        notes: '',
        translation_of: '' as any,
        adaptation_of: '' as any,
      });
    }
  }, [viewMode, workDetails, song, form]);

  // Delete credit handler
  const handleDeleteCredit = async (creditId: number) => {
    if (!confirm('Are you sure you want to delete this credit?')) return;

    try {
      await deleteCredit.mutateAsync(creditId);
      sonnerToast.success('Credit deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['song-work', songId] });
    } catch (error: any) {
      console.error('Failed to delete credit:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to delete credit');
    }
  };

  const onSubmit = async (values: WorkFormValues) => {
    try {
      // Clean up empty values
      const payload: any = {
        title: values.title,
      };

      if (values.alternate_titles && values.alternate_titles.trim()) {
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

      if (viewMode === 'create') {
        // Create work and automatically link to song in a single atomic operation
        const response = await createWorkInSongContext(songId, payload);
        const createdWork = response.data;
        sonnerToast.success('Work created and linked to song');
        queryClient.invalidateQueries({ queryKey: ['song', song.id] });
        queryClient.invalidateQueries({ queryKey: ['song-work', songId] });
        setViewMode('details');
      } else if (viewMode === 'edit' && workId) {
        await updateWork.mutateAsync({ id: workId, payload });
        sonnerToast.success('Work updated successfully');
        queryClient.invalidateQueries({ queryKey: ['song', song.id] });
        queryClient.invalidateQueries({ queryKey: ['song-work', songId] });
        setViewMode('details');
      }
    } catch (error: any) {
      console.error('Failed to save work:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to save work');
    }
  };

  const handleCancel = () => {
    setViewMode('details');
    form.reset();
  };

  // Loading state
  if (workLoading && hasWork) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSubmitting = createWork.isPending || updateWork.isPending;

  // NO WORK - Create or Link
  if (!hasWork && viewMode === 'details') {
    return (
      <>
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Musical Work
            </CardTitle>
            <CardDescription>
              Link or create a musical work for publishing administration
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <FileText className="h-12 w-12 text-primary opacity-50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Work Linked</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                A musical work represents the composition and lyrics. Link an existing work or create a new one to manage publishing rights.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
               
                <Button
                  onClick={() => setViewMode('create')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Work
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


      </>
    );
  }

  // CREATE MODE - Inline form
  if (viewMode === 'create') {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Create New Work
              </CardTitle>
              <CardDescription>for {song.title}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
                <TabsList>
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="relationships">Relationships</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
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
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4 mt-4">
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
                </TabsContent>

                {/* Relationships Tab */}
                <TabsContent value="relationships" className="space-y-4 mt-4">
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
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Work
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // EDIT MODE - Inline form
  if (viewMode === 'edit') {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Edit Work
              </CardTitle>
              <CardDescription>for {song.title}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
                <TabsList>
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="relationships">Relationships</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
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
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4 mt-4">
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
                </TabsContent>

                {/* Relationships Tab */}
                <TabsContent value="relationships" className="space-y-4 mt-4">
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
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
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
        </CardContent>
      </Card>
    );
  }

  // DETAILS MODE - Show work details with tabs
  if (!workDetails) {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">Unable to load work details</p>
        </CardContent>
      </Card>
    );
  }

  const work = workDetails;

  // Calculate total split percentages
  const writerTotal = writerSplits?.reduce((sum, split) => sum + Number(split.share || 0), 0) || 0;
  const publisherTotal = publisherSplits?.reduce((sum, split) => sum + Number(split.share || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Work Details Card */}
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Musical Work
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </CardTitle>
              <CardDescription>
                Publishing composition and rights information
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('edit')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ISWC Code</CardTitle>
              </CardHeader>
              <CardContent>
                {work.iswc ? (
                  <div className="text-2xl font-bold font-mono">{work.iswc}</div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIswcDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Add ISWC
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{credits?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Contributors</p>
              </CardContent>
            </Card>


            <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Publishing</CardTitle>
              </CardHeader>
              <CardContent>
                {work.has_complete_publishing_splits ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Complete</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Incomplete</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tabs */}
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="splits">Publishing Splits</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Work Title
                  </p>
                  <p className="font-semibold text-lg">{work.title || 'Untitled Work'}</p>
                </div>

                {work.language && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Language</p>
                    <p className="text-lg">{work.language}</p>
                  </div>
                )}

                {work.genre && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Genre</p>
                    <Badge variant="secondary">{work.genre}</Badge>
                  </div>
                )}

                {work.year_composed && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Year Composed</p>
                    <p className="text-lg">{work.year_composed}</p>
                  </div>
                )}
              </div>

              {work.lyrics && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Lyrics</p>
                  <div className="p-4 bg-accent/30 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap">{work.lyrics}</pre>
                  </div>
                </div>
              )}

              {work.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Internal Notes</p>
                  <div className="p-4 bg-accent/30 rounded-lg">
                    <p className="text-sm">{work.notes}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits">
              <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Credits
                    </CardTitle>
                    <Button size="sm" onClick={() => setCreditDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Credit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {credits && credits.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Credited As</TableHead>
                          <TableHead>Share</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {credits.map((credit: any) => (
                          <TableRow key={credit.id}>
                            <TableCell className="font-medium">{credit.entity_name || 'Unknown'}</TableCell>
                            <TableCell><Badge variant="outline">{credit.role_display || credit.role}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">{credit.credited_as || '-'}</TableCell>
                            <TableCell>
                              {credit.share_kind && credit.share_kind !== 'none' ? (
                                <div className="flex flex-col">
                                  <span className="text-sm">{credit.share_value}%</span>
                                  <span className="text-xs text-muted-foreground">{credit.share_kind_display}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingCredit(credit);
                                      setCreditDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteCredit(credit.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">No credits added yet</p>
                      <Button className="mt-4" onClick={() => setCreditDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Credit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Splits Tab */}
            <TabsContent value="splits" className="space-y-6">
              {/* Writer Splits */}
              <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Writer Splits
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={writerTotal} className="w-32" />
                        <span className="text-sm font-medium">{writerTotal.toFixed(1)}%</span>
                        {Math.abs(writerTotal - 100) < 0.01 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setWriterSplitDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Split
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {writerSplits && writerSplits.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Writer</TableHead>
                          <TableHead>Share</TableHead>
                          <TableHead>Territory</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {writerSplits.map((split: any) => (
                          <TableRow key={split.id}>
                            <TableCell className="font-medium">{split.entity_name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge>{split.share}%</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{split.territory || 'Worldwide'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">No writer splits defined</p>
                      <Button className="mt-4" onClick={() => setWriterSplitDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Writer Split
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Publisher Splits */}
              <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Publisher Splits
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={publisherTotal} className="w-32" />
                        <span className="text-sm font-medium">{publisherTotal.toFixed(1)}%</span>
                        {Math.abs(publisherTotal - 100) < 0.01 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setPublisherSplitDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Split
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {publisherSplits && publisherSplits.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Publisher</TableHead>
                          <TableHead>Share</TableHead>
                          <TableHead>Territory</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {publisherSplits.map((split: any) => (
                          <TableRow key={split.id}>
                            <TableCell className="font-medium">{split.entity_name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge>{split.share}%</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{split.territory || 'Worldwide'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">No publisher splits defined</p>
                      <Button className="mt-4" onClick={() => setPublisherSplitDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Publisher Split
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {workId && (
        <>
          <AddISWCDialog
            open={iswcDialogOpen}
            onOpenChange={setIswcDialogOpen}
            workId={workId}
            onSuccess={() => {
              setIswcDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['song-work', songId] });
            }}
          />
          <AddCreditDialog
            scope="work"
            objectId={workId}
            open={creditDialogOpen}
            onOpenChange={(open) => {
              setCreditDialogOpen(open);
              if (!open) setEditingCredit(null);
            }}
            credit={editingCredit}
          />
          <AddSplitDialog
            scope="work"
            objectId={workId}
            rightType="writer"
            open={writerSplitDialogOpen}
            onOpenChange={setWriterSplitDialogOpen}
          />
          <AddSplitDialog
            scope="work"
            objectId={workId}
            rightType="publisher"
            open={publisherSplitDialogOpen}
            onOpenChange={setPublisherSplitDialogOpen}
          />
        </>
      )}

      
    </div>
  );
}
