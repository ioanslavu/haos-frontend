import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StageBadge } from '@/components/songs/StageBadge';
import { ProgressBar } from '@/components/songs/ProgressBar';
import { fetchSongs } from '@/api/songApi';
import { SongStage, SongFilters } from '@/types/song';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import { AppLayout } from '@/components/layout/AppLayout';

const stageOptions: { value: SongStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'draft', label: 'Draft' },
  { value: 'publishing', label: 'Publishing' },
  { value: 'label_recording', label: 'Recording' },
  { value: 'marketing_assets', label: 'Marketing' },
  { value: 'label_review', label: 'Label Review' },
  { value: 'ready_for_digital', label: 'Ready for Digital' },
  { value: 'digital_distribution', label: 'Digital Distribution' },
  { value: 'released', label: 'Released' },
  { value: 'archived', label: 'Archived' },
];

export default function SongListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<SongStage | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const filters: SongFilters = {
    search: debouncedSearch || undefined,
    stage: selectedStage === 'all' ? undefined : selectedStage,
    page: currentPage,
    page_size: 20,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['songs', filters],
    queryFn: () => fetchSongs(filters),
  });

  const songs = Array.isArray(data?.data.results) ? data.data.results : [];
  const totalCount = data?.data.count || 0;

  const canCreateSong = user?.department === 'Publishing' || user?.role === 'administrator';

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Songs
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                  Manage song workflow across departments
                </p>
              </div>
              {canCreateSong && (
                <Button onClick={() => navigate('/songs/create')} size="lg" className="shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Song
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Modern Glassmorphic Filters */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or artist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-background/50 border-white/10"
                />
              </div>
            </div>
            <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as SongStage | '')}>
              <SelectTrigger className="w-64 h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                {stageOptions.map((option) => (
                  <SelectItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Modern Card for Songs List */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">All Songs</CardTitle>
              <span className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'song' : 'songs'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Failed to load songs. Please try again.
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {debouncedSearch || selectedStage
                  ? 'No songs found matching your filters.'
                  : 'No songs yet. Create your first song to get started.'}
              </p>
              {canCreateSong && !debouncedSearch && !selectedStage && (
                <Button onClick={() => navigate('/songs/create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Song
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/10">
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {songs.map((song) => (
                    <TableRow
                      key={song.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-white/10"
                      onClick={() => navigate(`/songs/${song.id}`)}
                    >
                      <TableCell className="font-medium">{song.title}</TableCell>
                      <TableCell>{song.artist?.display_name || '-'}</TableCell>
                      <TableCell>
                        {song.current_stage ? (
                          <StageBadge stage={song.current_stage} />
                        ) : (
                          <span className="text-muted-foreground text-sm">No stage</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ProgressBar progress={song.checklist_progress} showLabel={true} />
                      </TableCell>
                      <TableCell>
                        {song.target_release_date ? (
                          <span className={song.is_overdue ? 'text-red-600 font-medium' : ''}>
                            {new Date(song.target_release_date).toLocaleDateString()}
                            {song.is_overdue && ' (Overdue)'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No deadline</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => navigate(`/songs/${song.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalCount > 20 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(totalCount / 20)}
              </span>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={currentPage >= Math.ceil(totalCount / 20)}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
