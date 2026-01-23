import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { createSong, transitionSong, addFeaturedArtist } from '@/api/songApi';
import { useToast } from '@/hooks/use-toast';
import { SongCreate } from '@/types/song';
import { AppLayout } from '@/components/layout/AppLayout';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  artist: z.number().positive('Artist is required').optional(),
  genre: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  target_release_date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FeaturedArtist {
  artist_id: number;
  artist_name: string;
  role: 'featured' | 'remixer' | 'producer' | 'composer' | 'featuring';
}

export default function SongCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([]);
  const [newArtistId, setNewArtistId] = useState<number | null>(null);
  const [newArtistName, setNewArtistName] = useState<string>('');
  const [newArtistRole, setNewArtistRole] = useState<'featured' | 'remixer' | 'producer' | 'composer' | 'featuring'>('featured');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      artist: undefined,
      genre: '',
      language: 'English',
      target_release_date: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SongCreate) => {
      // Create song in DRAFT stage
      const songResponse = await createSong(data);
      const song = songResponse.data;

      // Add featured artists if any
      if (featuredArtists.length > 0) {
        for (let i = 0; i < featuredArtists.length; i++) {
          const artist = featuredArtists[i];
          await addFeaturedArtist(song.id, {
            artist_id: artist.artist_id,
            role: artist.role,
            order: i,
          });
        }
      }

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
    // Convert empty strings to null for optional date fields
    const cleanedData = {
      ...data,
      target_release_date: data.target_release_date || null,
    };
    createMutation.mutate(cleanedData as SongCreate);
  };

  const handleAddFeaturedArtist = () => {
    if (!newArtistId || !newArtistName) {
      toast({
        title: 'Error',
        description: 'Please select an artist',
        variant: 'destructive',
      });
      return;
    }

    // Check if artist already added
    if (featuredArtists.some(a => a.artist_id === newArtistId)) {
      toast({
        title: 'Error',
        description: 'This artist has already been added',
        variant: 'destructive',
      });
      return;
    }

    // Check if same as primary artist
    const primaryArtistId = form.getValues('artist');
    if (primaryArtistId === newArtistId) {
      toast({
        title: 'Error',
        description: 'This artist is already set as the primary artist',
        variant: 'destructive',
      });
      return;
    }

    setFeaturedArtists([...featuredArtists, {
      artist_id: newArtistId,
      artist_name: newArtistName,
      role: newArtistRole,
    }]);

    // Reset
    setNewArtistId(null);
    setNewArtistName('');
    setNewArtistRole('featured');
  };

  const handleRemoveFeaturedArtist = (artistId: number) => {
    setFeaturedArtists(featuredArtists.filter(a => a.artist_id !== artistId));
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
                    <FormLabel>Primary Artist</FormLabel>
                    <FormControl>
                      <EntitySearchCombobox
                        value={field.value || null}
                        onValueChange={field.onChange}
                        placeholder="Search for artist..."
                        filter={{ classification: 'CREATIVE', entity_type: 'artist' }}
                      />
                    </FormControl>
                    <FormDescription>
                      The main artist for this song
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Featured Artists Section */}
              <div className="space-y-4">
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Featured Artists (Optional)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add additional artists who collaborate on this song
                  </p>

                  {/* Add Featured Artist Form */}
                  <Card className="bg-accent/50 border-dashed">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-6">
                          <Label className="text-xs mb-2 block">Artist</Label>
                          <EntitySearchCombobox
                            value={newArtistId}
                            onValueChange={(id) => setNewArtistId(id)}
                            onEntitySelect={(entity) => setNewArtistName(entity?.display_name || '')}
                            placeholder="Search for artist..."
                            filter={{ classification: 'CREATIVE', entity_type: 'artist' }}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs mb-2 block">Role</Label>
                          <Select value={newArtistRole} onValueChange={(value: any) => setNewArtistRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="featured">Featured</SelectItem>
                              <SelectItem value="featuring">Featuring</SelectItem>
                              <SelectItem value="remixer">Remixer</SelectItem>
                              <SelectItem value="producer">Producer</SelectItem>
                              <SelectItem value="composer">Composer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2 flex items-end">
                          <Button
                            type="button"
                            onClick={handleAddFeaturedArtist}
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Featured Artists List */}
                  {featuredArtists.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {featuredArtists.map((artist, index) => (
                        <Card key={artist.artist_id} className="bg-background border-primary/20">
                          <CardContent className="py-3 px-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">#{index + 1}</span>
                              <div>
                                <p className="font-medium text-sm">{artist.artist_name}</p>
                                <Badge variant="outline" className="mt-1 text-xs capitalize">
                                  {artist.role}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFeaturedArtist(artist.artist_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />
              </div>

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
