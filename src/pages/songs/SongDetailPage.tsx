import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StageBadge } from '@/components/songs/StageBadge';
import { ProgressBar } from '@/components/songs/ProgressBar';
import { ChecklistSection } from '@/components/songs/ChecklistSection';
import { AssignChecklistDialog } from '@/components/songs/AssignChecklistDialog';
import { ActivityLogItem, ActivityType } from '@/components/songs/ActivityLogItem';
import { AssetCard } from '@/components/songs/AssetCard';
import { AssetUploader } from '@/components/songs/AssetUploader';
import { SongInfoCard } from '@/components/songs/SongInfoCard';
import { AddNoteForm } from '@/components/songs/AddNoteForm';
import { RecordingTab } from '@/components/songs/RecordingTab';
import { ReleaseTab } from '@/components/songs/ReleaseTab';
import { WorkflowProgressBar } from '@/components/songs/WorkflowProgressBar';
import { StageInfoCard } from '@/components/songs/StageInfoCard';
import { QuickActionButtons } from '@/components/songs/QuickActionButtons';
import { TransitionTimeline } from '@/components/songs/TransitionTimeline';
import { ArtistManagementSection } from '@/components/songs/ArtistManagementSection';
import { WorkTab } from '@/components/songs/WorkTab';
import { StageChecklistView } from '@/components/songs/StageChecklistView';
import { RelatedTasks } from '@/components/tasks/RelatedTasks';
import { SongTriggerButton } from '@/components/tasks/ManualTriggerButton';
import {
  fetchSongDetail,
  fetchChecklist,
  toggleChecklistItem,
  validateAllChecklist,
  transitionSong,
  sendToMarketing,
  sendToDigital,
  fetchNotes,
  fetchStageTransitions,
  fetchAssets,
  reviewAsset,
  createNote,
  fetchSongWork,
} from '@/api/songApi';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { SongStageTransition, SongNote, SongChecklistItem, SongAsset, SongStage } from '@/types/song';
import apiClient from '@/api/client';

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssetUploader, setShowAssetUploader] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityType>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<SongChecklistItem | null>(null);
  const [selectedStage, setSelectedStage] = useState<SongStage | undefined>(undefined);

  const songId = parseInt(id || '0');

  // Queries
  const { data: songData, isLoading: songLoading } = useQuery({
    queryKey: ['song', songId],
    queryFn: () => fetchSongDetail(songId),
    enabled: !!songId,
  });

  const { data: checklistData, isLoading: checklistLoading } = useQuery({
    queryKey: ['song-checklist', songId],
    queryFn: () => fetchChecklist(songId),
    enabled: !!songId,
  });

  const { data: notesData } = useQuery({
    queryKey: ['song-notes', songId],
    queryFn: () => fetchNotes(songId),
    enabled: !!songId,
  });

  const { data: transitionsData } = useQuery({
    queryKey: ['song-transitions', songId],
    queryFn: () => fetchStageTransitions(songId),
    enabled: !!songId,
  });

  const { data: assetsData } = useQuery({
    queryKey: ['song-assets', songId],
    queryFn: () => fetchAssets(songId),
    enabled: !!songId,
  });

  const song = songData?.data;

  // Fetch work from song context (consistent with recordings)
  // Backend returns 404 if no work exists - this is expected, not an error
  const { data: workData, isLoading: workLoading, error: workError } = useQuery({
    queryKey: ['song-work', songId],
    queryFn: () => fetchSongWork(songId),
    enabled: activeTab === 'work',
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (no work exists yet)
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
  const checklist = Array.isArray(checklistData?.data?.results) ? checklistData.data.results : (Array.isArray(checklistData?.data) ? checklistData.data : []);
  const notes = Array.isArray(notesData?.data?.results) ? notesData.data.results : (Array.isArray(notesData?.data) ? notesData.data : []);
  const transitions = Array.isArray(transitionsData?.data?.results) ? transitionsData.data.results : (Array.isArray(transitionsData?.data) ? transitionsData.data : []);
  const assets = Array.isArray(assetsData?.data?.results) ? assetsData.data.results : (Array.isArray(assetsData?.data) ? assetsData.data : []);
  const work = workData?.data;

  // Mutations
  const toggleChecklistMutation = useMutation({
    mutationFn: (itemId: number) => toggleChecklistItem(songId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-checklist', songId] });
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
    },
  });

  const validateAllMutation = useMutation({
    mutationFn: () => validateAllChecklist(songId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['song-checklist', songId] });
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Validation Complete',
        description: `${response.data.validated_count} items validated.`,
      });
    },
  });

  const sendToMarketingMutation = useMutation({
    mutationFn: () => sendToMarketing(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Success',
        description: 'Song sent to Marketing department.',
      });
    },
  });

  const sendToDigitalMutation = useMutation({
    mutationFn: () => sendToDigital(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Success',
        description: 'Song sent to Digital Distribution.',
      });
    },
  });

  const reviewAssetMutation = useMutation({
    mutationFn: ({ assetId, action, notes }: { assetId: number; action: 'approve' | 'reject' | 'revision_requested'; notes?: string }) =>
      reviewAsset(songId, assetId, { action, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
      toast({
        title: 'Asset Reviewed',
        description: 'Your review has been submitted.',
      });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: { content: string; is_important: boolean }) => createNote(songId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-notes', songId] });
      setShowAddNote(false);
      toast({
        title: 'Note Added',
        description: 'Your note has been added to the activity log.',
      });
    },
  });

  // Combine and sort all activities
  const allActivities = useMemo(() => {
    type ActivityItem = {
      id: string;
      type: ActivityType;
      data: SongStageTransition | SongNote | SongChecklistItem | SongAsset;
      timestamp: string;
    };

    const items: ActivityItem[] = [];

    // Add transitions
    transitions.forEach((transition) => {
      items.push({
        id: `transition-${transition.id}`,
        type: 'transition',
        data: transition,
        timestamp: transition.created_at,
      });
    });

    // Add notes
    notes.forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        type: 'note',
        data: note,
        timestamp: note.created_at,
      });
    });

    // Add completed checklist items
    checklist
      .filter((item) => item.is_complete && item.completed_at)
      .forEach((item) => {
        items.push({
          id: `checklist-${item.id}`,
          type: 'checklist',
          data: item,
          timestamp: item.completed_at!,
        });
      });

    // Add assets
    assets.forEach((asset) => {
      items.push({
        id: `asset-${asset.id}`,
        type: 'asset',
        data: asset,
        timestamp: asset.created_at,
      });
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transitions, notes, checklist, assets]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') {
      return allActivities;
    }
    return allActivities.filter((item) => item.type === activityFilter);
  }, [allActivities, activityFilter]);

  if (songLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">Song not found.</p>
        <Button onClick={() => navigate('/songs')} className="mt-4">
          Back to Songs
        </Button>
      </div>
    );
  }

  const canReviewAssets = user?.department === 'Label' && song.current_stage === 'label_review';
  const canUploadAssets = user?.department === 'Marketing' && song.current_stage === 'marketing_assets';
  const isComplete = song.checklist_progress === 100;
  const currentStage = song.current_stage || 'draft';

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/songs')} className="hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Songs
        </Button>

        {/* Modern Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-white/10 p-8 shadow-xl">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-orange-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text mb-2">
                  {song.title}
                </h1>
                <p className="text-muted-foreground text-lg">{song.artist?.display_name || 'No artist'}</p>
              </div>
              {song.current_stage && <StageBadge stage={song.current_stage} />}
            </div>
          </div>
        </div>

      {/* Glassmorphic Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl shadow-lg p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground mb-2">Progress</p>
            <ProgressBar progress={song.checklist_progress} showLabel={true} />
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl shadow-lg p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground mb-2">Time in Stage</p>
            <p className="text-2xl font-bold">
              {song.days_in_current_stage} {song.days_in_current_stage === 1 ? 'day' : 'days'}
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl shadow-lg p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground mb-2">Target Release</p>
            <p className="text-lg font-bold">
              {song.target_release_date
                ? new Date(song.target_release_date).toLocaleDateString()
                : 'Not set'}
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-xl shadow-lg p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-transparent" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground mb-2">Created</p>
            <p className="text-lg font-bold">
              {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
            </p>
          </div>
        </Card>
      </div>

      {/* Modern iOS-style Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-14 shadow-lg">
          <TabsTrigger
            value="overview"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="artists"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Artists
          </TabsTrigger>
          <TabsTrigger
            value="work"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Work
          </TabsTrigger>
          <TabsTrigger
            value="recording"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Recording
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Assets
          </TabsTrigger>
          <TabsTrigger
            value="release"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Release
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Workflow Progress Bar */}
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Workflow Progress</CardTitle>
              <CardDescription>Complete journey from draft to release</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowProgressBar
                songId={song.id}
                currentStage={currentStage}
                stageStatuses={song.stage_statuses}
                interactive={true}
                selectedStage={selectedStage}
                onStageClick={setSelectedStage}
              />
            </CardContent>
          </Card>

          {/* Stage Checklist View - Shows when a stage is selected */}
          {selectedStage && checklist && (
            <StageChecklistView
              stage={selectedStage}
              stageLabel={
                [
                  { key: 'draft', label: 'Draft' },
                  { key: 'publishing', label: 'Publishing' },
                  { key: 'label_recording', label: 'Label - Recording' },
                  { key: 'marketing_assets', label: 'Marketing - Assets' },
                  { key: 'label_review', label: 'Label - Review' },
                  { key: 'ready_for_digital', label: 'Ready for Digital' },
                  { key: 'digital_distribution', label: 'Digital Distribution' },
                  { key: 'released', label: 'Released' },
                ].find(s => s.key === selectedStage)?.label || ''
              }
              checklistItems={checklist}
              onToggleItem={(itemId) => {
                toggleChecklistMutation.mutate(itemId);
              }}
              isLoading={toggleChecklistMutation.isPending}
            />
          )}

          {/* Stage Transition and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StageInfoCard song={song} checklist={checklist} />
            <QuickActionButtons song={song} checklist={checklist} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checklist Section - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <ChecklistSection
                songId={songId}
                items={checklist}
                currentStage={currentStage}
                onToggle={(itemId) => toggleChecklistMutation.mutate(itemId)}
                onAssign={(itemId) => {
                  const item = checklist.find(i => i.id === itemId);
                  if (item) {
                    setSelectedChecklistItem(item);
                    setAssignDialogOpen(true);
                  }
                }}
                onValidateAll={() => validateAllMutation.mutate()}
                onSendToMarketing={
                  currentStage === 'label_recording'
                    ? () => sendToMarketingMutation.mutate()
                    : undefined
                }
                onSendToDigital={
                  currentStage === 'ready_for_digital'
                    ? () => sendToDigitalMutation.mutate()
                    : undefined
                }
                isValidating={validateAllMutation.isPending}
                isSendingToMarketing={sendToMarketingMutation.isPending}
                isSendingToDigital={sendToDigitalMutation.isPending}
              />
            </div>

            {/* Song Info Card - Takes up 1 column */}
            <div className="lg:col-span-1">
              <SongInfoCard song={song} />
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground mb-2">No activity yet</p>
                  <p className="text-sm text-muted-foreground">Activity will appear here as work progresses</p>
                </div>
              ) : (
                notes.slice(0, 5).map((note) => (
                  <ActivityLogItem key={note.id} activity={note} type="note" />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="mt-6">
          <ArtistManagementSection song={song} />
        </TabsContent>

        <TabsContent value="work" className="mt-6">
          <WorkTab song={song} />
        </TabsContent>

        <TabsContent value="recording" className="mt-6">
          <RecordingTab songId={songId} songStage={song.current_stage} songTitle={song.title} workId={song.work?.id} />
        </TabsContent>

        <TabsContent value="assets" className="space-y-6 mt-6">
          {canUploadAssets && (
            <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle>Upload Marketing Assets</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload cover art, promotional graphics, press photos, and other marketing materials for this song.
                </p>
              </CardHeader>
              <CardContent>
                {!showAssetUploader ? (
                  <Button
                    onClick={() => setShowAssetUploader(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    Upload New Asset
                  </Button>
                ) : (
                  <AssetUploader
                    songId={songId}
                    onUploadComplete={(asset) => {
                      queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
                      setShowAssetUploader(false);
                      toast({ title: 'Asset uploaded successfully' });
                    }}
                    onCancel={() => setShowAssetUploader(false)}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {canReviewAssets && assets.some(a => a.review_status === 'pending') && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <p className="text-sm font-medium text-yellow-800">
                  Assets Pending Review: {assets.filter(a => a.review_status === 'pending').length}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Please review all pending assets before sending this song to Digital Distribution.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle>Asset Gallery</CardTitle>
              <p className="text-sm text-muted-foreground">
                {assets.length === 0
                  ? 'No assets have been uploaded yet.'
                  : `${assets.length} ${assets.length === 1 ? 'asset' : 'assets'} uploaded`
                }
              </p>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No assets uploaded yet.</p>
                  {canUploadAssets && (
                    <p className="text-xs mt-2">Click "Upload New Asset" above to add marketing materials.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      canReview={canReviewAssets}
                      onReview={(action, notes) =>
                        reviewAssetMutation.mutate({ assetId: asset.id, action, notes })
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="release" className="space-y-6 mt-6">
          <ReleaseTab
            songId={songId}
            releaseId={song.release?.id}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6 mt-6">
          {/* Manual trigger buttons */}
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Create tasks for this song</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <SongTriggerButton songId={songId} />
              </div>
            </CardContent>
          </Card>

          {/* Related tasks */}
          <RelatedTasks
            entityType="song"
            entityId={songId}
            title="Song Tasks"
            description="Tasks automatically created and updated based on this song's progress"
            showEmpty={true}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          {/* Stage Transition Timeline */}
          {transitions.length > 0 && (
            <TransitionTimeline transitions={transitions} />
          )}

          {/* Activity Log Section */}
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Activity Log</CardTitle>
                  <CardDescription>All notes, changes, and updates</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as 'all' | ActivityType)}>
                    <SelectTrigger className="w-[180px] rounded-xl">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activities</SelectItem>
                      <SelectItem value="transition">Stage Transitions</SelectItem>
                      <SelectItem value="note">Notes</SelectItem>
                      <SelectItem value="checklist">Checklist</SelectItem>
                      <SelectItem value="asset">Assets</SelectItem>
                    </SelectContent>
                  </Select>
                  {!showAddNote && (
                    <Button
                      onClick={() => setShowAddNote(true)}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Add Note Form */}
              {showAddNote && (
                <AddNoteForm
                  onSubmit={async (content, isImportant) => {
                    await createNoteMutation.mutateAsync({ content, is_important: isImportant });
                  }}
                  onCancel={() => setShowAddNote(false)}
                />
              )}

              {/* Filter summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredActivities.length} {filteredActivities.length === 1 ? 'item' : 'items'}
                  {activityFilter !== 'all' && ` (${activityFilter} only)`}
                </span>
                {activityFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivityFilter('all')}
                    className="h-auto py-1 px-2 text-xs rounded-lg"
                  >
                    Clear filter
                  </Button>
                )}
              </div>

              {/* Activity List */}
              {filteredActivities.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground mb-2">
                    {activityFilter === 'all'
                      ? 'No activity yet'
                      : `No ${activityFilter} activities found`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activityFilter === 'all'
                      ? 'Activity will appear here as work progresses'
                      : 'Try selecting a different filter'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((item) => (
                    <ActivityLogItem
                      key={item.id}
                      activity={item.data}
                      type={item.type}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Checklist Dialog */}
      <AssignChecklistDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        songId={songId}
        checklistItem={selectedChecklistItem}
      />
    </div>
    </AppLayout>
  );
}
