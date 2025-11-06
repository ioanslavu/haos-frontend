import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { createSong, transitionSong } from '@/api/songApi';
import { useToast } from '@/hooks/use-toast';
import { SongCreate } from '@/types/song';
import { AppLayout } from '@/components/layout/AppLayout';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  artist: z.number().positive('Artist is required').optional(),
  genre: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  target_release_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SongCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      artist: undefined,
      genre: '',
      language: 'English',
      target_release_date: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SongCreate) => {
      // Create song in DRAFT stage
      const songResponse = await createSong(data);
      const song = songResponse.data;

      // Immediately transition to PUBLISHING stage
      await transitionSong(song.id, {
        target_stage: 'publishing',
        notes: 'Initial creation - moving to Publishing stage',
      });

      return song;
    },
    onSuccess: (song) => {
      toast({
        title: 'Song Created',
        description: `${song.title} has been created and moved to Publishing stage.`,
      });
      navigate(`/songs/${song.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create song.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data as SongCreate);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/songs')} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Create New Song
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                  Enter basic song information to start the workflow
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Card for Form */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle>Song Information</CardTitle>
          </CardHeader>
          <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Song title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist</FormLabel>
                    <FormControl>
                      <EntitySearchCombobox
                        value={field.value || null}
                        onValueChange={field.onChange}
                        placeholder="Search for artist..."
                        filter={{ has_role: 'artist' }}
                      />
                    </FormControl>
                    <FormDescription>
                      Search and select an artist from the entity database
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pop, Rock, Hip-Hop" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., English, Spanish" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="target_release_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Release Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: Set a target release date for tracking purposes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-xl"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Song
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/songs')}
                  disabled={createMutation.isPending}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

        {/* Info Card with modern styling */}
        <Card className="rounded-2xl border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 backdrop-blur-xl shadow-lg">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-lg">What happens next?</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>Song is created in Draft stage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>Song is automatically moved to Publishing stage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>Publishing team can create the Work and set writer/publisher splits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">4.</span>
                <span>Once Publishing is complete, the song can move to Recording</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
