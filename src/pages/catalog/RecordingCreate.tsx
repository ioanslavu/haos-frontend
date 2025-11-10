import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Mic, Search, Info, Music2 } from 'lucide-react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCreateRecording, useWork, useWorks } from '@/api/hooks/useCatalog';
import { addRecordingToSong } from '@/api/songApi';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

// Form schema
const recordingFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['audio_master', 'music_video', 'live_audio', 'live_video', 'remix', 'radio_edit', 'acoustic', 'instrumental', 'acapella', 'extended', 'demo']),
  status: z.enum(['draft', 'ready', 'approved', 'released', 'archived']).default('draft'),
  work: z.number().optional().or(z.literal('')),
  duration_seconds: z.number().min(0).optional().or(z.literal('')),
  bpm: z.number().min(1).max(300).optional().or(z.literal('')),
  key: z.string().optional(),
  recording_date: z.string().optional(),
  studio: z.string().optional(),
  version: z.string().optional(),
  notes: z.string().optional(),
});

type RecordingFormValues = z.infer<typeof recordingFormSchema>;

export default function RecordingCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const createRecording = useCreateRecording();
  const [activeTab, setActiveTab] = useState('basic');
  const [workSearchOpen, setWorkSearchOpen] = useState(false);
  const [workSearchQuery, setWorkSearchQuery] = useState('');

  // Get work from query params
  const workIdFromParams = searchParams.get('work');
  const workId = workIdFromParams ? parseInt(workIdFromParams) : undefined;

  // Get songId from query params
  const songIdParam = searchParams.get('songId');
  const songId = songIdParam ? parseInt(songIdParam) : undefined;

  // Fetch work if provided in params
  const { data: workFromParams } = useWork(workId || 0, !!workId);

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

  // Search works
  const { data: worksData } = useWorks({
    search: workSearchQuery || undefined,
    page_size: 20,
  });

  const form = useForm<RecordingFormValues>({
    resolver: zodResolver(recordingFormSchema),
    defaultValues: {
      title: '',
      type: 'audio_master',
      status: 'draft',
      work: workId || ('' as any),
      duration_seconds: '' as any,
      bpm: '' as any,
      key: '',
      recording_date: '',
      studio: '',
      version: '',
      notes: '',
    },
  });

  // Update form when work is loaded from params
  useEffect(() => {
    if (workFromParams && workId) {
      form.setValue('work', workId);
      // Auto-populate title with work title if recording title is empty
      if (!form.getValues('title')) {
        form.setValue('title', workFromParams.title);
      }
    }
  }, [workFromParams, workId, form]);

  // Pre-fill form from song
  useEffect(() => {
    if (song) {
      // If song has a work and form doesn't have one, use it
      if (song.work && !form.getValues('work')) {
        form.setValue('work', song.work.id);
      }
      // Pre-fill title from song if empty
      if (song.title && !form.getValues('title')) {
        form.setValue('title', song.title);
      }
    }
  }, [song, form]);

  const onSubmit = async (values: RecordingFormValues) => {
    try {
      const payload: any = {
        title: values.title,
        type: values.type,
        status: values.status,
      };

      if (values.work && values.work !== '') payload.work = Number(values.work);
      if (values.duration_seconds && values.duration_seconds !== '') payload.duration_seconds = Number(values.duration_seconds);
      if (values.bpm && values.bpm !== '') payload.bpm = Number(values.bpm);
      if (values.key && values.key.trim()) payload.key = values.key.trim();
      if (values.recording_date && values.recording_date.trim()) payload.recording_date = values.recording_date.trim();
      if (values.studio && values.studio.trim()) payload.studio = values.studio.trim();
      if (values.version && values.version.trim()) payload.version = values.version.trim();
      if (values.notes && values.notes.trim()) payload.notes = values.notes.trim();

      const createdRecording = await createRecording.mutateAsync(payload);
      sonnerToast.success('Recording created successfully');

      // If songId exists, link recording to song
      if (songId && createdRecording?.id) {
        try {
          await addRecordingToSong(songId, createdRecording.id);
          sonnerToast.success('Recording linked to song');
          queryClient.invalidateQueries({ queryKey: ['song', songId] });
          queryClient.invalidateQueries({ queryKey: ['song-recordings', songId] });
          navigate(`/songs/${songId}`);
        } catch (linkError) {
          console.error('Failed to link recording to song:', linkError);
          sonnerToast.error('Recording created but failed to link to song');
          navigate(`/catalog/recordings/${createdRecording.id}`);
        }
      } else {
        navigate(`/catalog/recordings/${createdRecording.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create recording:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to create recording');
    }
  };

  const selectedWorkId = form.watch('work');
  const selectedWork = selectedWorkId
    ? (workFromParams?.id === selectedWorkId ? workFromParams : worksData?.results?.find(w => w.id === selectedWorkId))
    : null;

  const isSubmitting = createRecording.isPending;

  const handleCancel = () => {
    navigate(songId ? `/songs/${songId}` : '/catalog/recordings');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Mic className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">Create New Recording</h1>
          </div>
        </div>

        {/* Context Banner */}
        {song && (
          <Alert className="border-primary/20 bg-primary/5">
            <Music2 className="h-4 w-4 text-primary" />
            <AlertDescription>
              Creating recording for song: <strong>{song.title}</strong>
              {song.artist?.display_name && ` by ${song.artist.display_name}`}
              {song.work && ` (Work: ${song.work.iswc || `ID ${song.work.id}`})`}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="technical">Technical Details</TabsTrigger>
                <TabsTrigger value="recording">Recording Info</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Essential details about the recording
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Work Selection */}
                    <FormField
                      control={form.control}
                      name="work"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Musical Work</FormLabel>
                          <Popover open={workSearchOpen} onOpenChange={setWorkSearchOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    'w-full justify-between',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {selectedWork
                                    ? selectedWork.title
                                    : 'Select work (optional)'}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search works..."
                                  value={workSearchQuery}
                                  onValueChange={setWorkSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>No works found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value=""
                                      onSelect={() => {
                                        field.onChange('');
                                        setWorkSearchOpen(false);
                                      }}
                                    >
                                      <span className="text-muted-foreground">No work selected</span>
                                    </CommandItem>
                                    {worksData?.results?.map((work) => (
                                      <CommandItem
                                        key={work.id}
                                        value={work.title}
                                        onSelect={() => {
                                          field.onChange(work.id);
                                          setWorkSearchOpen(false);
                                        }}
                                      >
                                        {work.title}
                                        {work.iswc && (
                                          <span className="ml-2 text-xs text-muted-foreground">
                                            ({work.iswc})
                                          </span>
                                        )}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Link this recording to a musical work/composition
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter recording title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="audio_master">Audio Master</SelectItem>
                                <SelectItem value="music_video">Music Video</SelectItem>
                                <SelectItem value="live_audio">Live Audio</SelectItem>
                                <SelectItem value="live_video">Live Video</SelectItem>
                                <SelectItem value="remix">Remix</SelectItem>
                                <SelectItem value="radio_edit">Radio Edit</SelectItem>
                                <SelectItem value="acoustic">Acoustic Version</SelectItem>
                                <SelectItem value="instrumental">Instrumental</SelectItem>
                                <SelectItem value="acapella">A Cappella</SelectItem>
                                <SelectItem value="extended">Extended Version</SelectItem>
                                <SelectItem value="demo">Demo</SelectItem>
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
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="released">Released</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Version</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Album Version, Radio Edit..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Version or variation descriptor
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Technical Details Tab */}
              <TabsContent value="technical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Details</CardTitle>
                    <CardDescription>
                      Audio/video technical specifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="duration_seconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="180"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormDescription>
                            Total duration in seconds (e.g., 180 for 3:00)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bpm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BPM</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="300"
                                placeholder="120"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                              />
                            </FormControl>
                            <FormDescription>Beats per minute</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key</FormLabel>
                            <FormControl>
                              <Input placeholder="C Major, Am..." {...field} />
                            </FormControl>
                            <FormDescription>Musical key</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recording Info Tab */}
              <TabsContent value="recording" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recording Information</CardTitle>
                    <CardDescription>
                      When and where the recording was made
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="recording_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recording Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="studio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Studio</FormLabel>
                            <FormControl>
                              <Input placeholder="Studio name or location..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internal Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any internal notes, session details, or technical information..."
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
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/catalog/recordings')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Recording
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
