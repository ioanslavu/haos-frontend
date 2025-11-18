import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Loader2, Plus, CheckCircle, Play } from 'lucide-react';
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
import { CompactSongCard } from '@/components/songs/CompactSongCard';
import { AddNoteForm } from '@/components/songs/AddNoteForm';
import { RecordingTab } from '@/components/songs/RecordingTab';
import { ReleaseTab } from '@/components/songs/ReleaseTab';
import { WorkflowProgressBar } from '@/components/songs/WorkflowProgressBar';
import { TransitionTimeline } from '@/components/songs/TransitionTimeline';
import { ArtistManagementSection } from '@/components/songs/ArtistManagementSection';
import { WorkTab } from '@/components/songs/WorkTab';
import { RelatedTasks } from '@/components/tasks/RelatedTasks';
import { SongTriggerButton } from '@/components/tasks/ManualTriggerButton';
import { TaskCompletionModal } from '@/components/tasks/TaskCompletionModal';
import { AddTemplateDialog } from '@/components/songs/AddTemplateDialog';
import {
  fetchSongDetail,
  fetchChecklist,
  toggleChecklistItem,
  updateChecklistAssetUrl,
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
  updateStageStatus,
  getOrCreateTaskForChecklistItem,
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
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);

  // Safety cleanup: Remove pointer-events: none from body when task modal is closed
  useEffect(() => {
    if (!taskModalOpen) {
      // Small delay to let animations finish
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [taskModalOpen]);

  const songId = parseInt(id || '0');

  // Define stage flow for navigation
  const stageFlow: SongStage[] = [
    'draft',
    'publishing',
    'label_recording',
    'marketing_assets',
    'label_review',
    'ready_for_digital',
    'digital_distribution',
    'released',
  ];

  const stageLabels: Record<SongStage, string> = {
    draft: 'Draft',
    publishing: 'Publishing',
    label_recording: 'Label - Recording',
    marketing_assets: 'Marketing - Assets',
    label_review: 'Label - Review',
    ready_for_digital: 'Ready for Digital',
    digital_distribution: 'Digital Distribution',
    released: 'Released',
    archived: 'Archived',
  };

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

  // Auto-select current stage when song loads
  useEffect(() => {
    if (song?.current_stage && !selectedStage) {
      setSelectedStage(song.current_stage);
    }
  }, [song?.current_stage, selectedStage]);

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

  const updateAssetUrlMutation = useMutation({
    mutationFn: ({ itemId, assetUrl }: { itemId: number; assetUrl: string }) =>
      updateChecklistAssetUrl(songId, itemId, assetUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song-checklist', songId] });
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Asset URL saved',
        description: 'Checklist item auto-completed!',
      });
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

  // Stage action mutation - handles start, finish, resume based on status
  const stageActionMutation = useMutation({
    mutationFn: async ({ stage, action }: { stage: SongStage; action: 'start' | 'finish' | 'resume' }) => {
      if (action === 'start') {
        // Start the stage
        await updateStageStatus(songId, stage, { status: 'in_progress' });
      } else if (action === 'finish') {
        // Complete the current stage
        await updateStageStatus(songId, stage, { status: 'completed' });

        // Then, start the next stage if it exists
        const currentIndex = stageFlow.indexOf(stage);
        const nextStage = currentIndex >= 0 && currentIndex < stageFlow.length - 1
          ? stageFlow[currentIndex + 1]
          : null;

        if (nextStage) {
          await updateStageStatus(songId, nextStage, { status: 'in_progress' });
        }
      } else if (action === 'resume') {
        // Resume a blocked stage
        await updateStageStatus(songId, stage, { status: 'in_progress' });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      const messages = {
        start: 'Stage has been started.',
        finish: 'Stage has been completed and next stage has been started.',
        resume: 'Stage has been resumed.',
      };
      toast({
        title: 'Success',
        description: messages[variables.action],
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update stage',
        variant: 'destructive',
      });
    },
  });

  // Handler to open task completion modal
  const handleOpenTaskModal = async (checklistItemId: number) => {
    setIsLoadingTask(true);
    try {
      const response = await getOrCreateTaskForChecklistItem(songId, checklistItemId);
      setSelectedTask(response.data);
      setTaskModalOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load task',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTask(false);
    }
  };

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

  // Helper to get selected stage status
  const getSelectedStageStatus = () => {
    if (!selectedStage || !song.stage_statuses) return null;
    return song.stage_statuses.find(s => s.stage === selectedStage);
  };

  const selectedStageStatus = getSelectedStageStatus();
  const selectedStageStatusValue = selectedStageStatus?.status || 'not_started';

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/songs')} className="hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Songs
        </Button>

      {/* Tabs with Compact Card and Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <CompactSongCard
          song={song}
          recentNotes={notes.slice(0, 3)}
        />

        <TabsContent value="overview" className="space-y-8 mt-8">
          {/* Workflow Progress Bar */}
          <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
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

          {/* Stage Detail - Shows when a stage is selected */}
          {selectedStage && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{stageLabels[selectedStage]} Checklist</h2>
                  <p className="text-sm text-muted-foreground">Complete tasks to progress this stage</p>
                </div>

                {/* Context-aware Stage Action Button */}
                <div className="flex items-center gap-2">
                  {/* Add Checklist Template Button */}
                  <Button
                    variant="outline"
                    onClick={() => setAddTemplateDialogOpen(true)}
                    className="rounded-xl"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Checklist
                  </Button>

                  {selectedStageStatusValue === 'not_started' && (
                    <Button
                      onClick={() => stageActionMutation.mutate({ stage: selectedStage, action: 'start' })}
                      disabled={stageActionMutation.isPending}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    >
                      {stageActionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Start Stage
                        </>
                      )}
                    </Button>
                  )}

                  {selectedStageStatusValue === 'in_progress' && (
                    <Button
                      onClick={() => stageActionMutation.mutate({ stage: selectedStage, action: 'finish' })}
                      disabled={stageActionMutation.isPending}
                      className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                    >
                      {stageActionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finishing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Finish Stage
                        </>
                      )}
                    </Button>
                  )}

                  {selectedStageStatusValue === 'blocked' && (
                    <Button
                      onClick={() => stageActionMutation.mutate({ stage: selectedStage, action: 'resume' })}
                      disabled={stageActionMutation.isPending}
                      className="rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                    >
                      {stageActionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resuming...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Resume Stage
                        </>
                      )}
                    </Button>
                  )}

                  {selectedStageStatusValue === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtered Checklist for selected stage */}
              {checklist.filter(item => item.stage === selectedStage).length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground mb-2">No checklist items for this stage yet</p>
                  <p className="text-sm text-muted-foreground">Checklist items will appear here once they're created for this stage</p>
                </div>
              ) : (
                <ChecklistSection
                  songId={songId}
                  items={checklist.filter(item => item.stage === selectedStage)}
                  currentStage={selectedStage}
                  onToggle={(itemId) => toggleChecklistMutation.mutate(itemId)}
                  onAssign={(itemId) => {
                    const item = checklist.find(i => i.id === itemId);
                    if (item) {
                      setSelectedChecklistItem(item);
                      setAssignDialogOpen(true);
                    }
                  }}
                  onUpdateAssetUrl={(itemId, assetUrl) =>
                    updateAssetUrlMutation.mutate({ itemId, assetUrl })
                  }
                  onOpenTaskModal={handleOpenTaskModal}
                  onValidateAll={() => validateAllMutation.mutate()}
                  isValidating={validateAllMutation.isPending}
                />
              )}
            </div>
          )}

        </TabsContent>

        <TabsContent value="artists" className="mt-8">
          <ArtistManagementSection song={song} />
        </TabsContent>

        <TabsContent value="work" className="mt-8">
          <WorkTab song={song} />
        </TabsContent>

        <TabsContent value="recording" className="mt-8">
          <RecordingTab songId={songId} songStage={song.current_stage} songTitle={song.title} workId={song.work?.id} />
        </TabsContent>

        <TabsContent value="assets" className="space-y-8 mt-8">
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

        <TabsContent value="release" className="space-y-8 mt-8">
          <ReleaseTab
            songId={songId}
            releaseId={song.release?.id}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-8 mt-8">
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

        <TabsContent value="activity" className="space-y-8 mt-8">
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

      {/* Task Completion Modal */}
      <TaskCompletionModal
        task={selectedTask}
        open={taskModalOpen}
        onOpenChange={(open) => {
          setTaskModalOpen(open);
          if (!open) {
            setSelectedTask(null);
          }
        }}
      />

      {/* Add Template Dialog */}
      {selectedStage && (
        <AddTemplateDialog
          open={addTemplateDialogOpen}
          onOpenChange={setAddTemplateDialogOpen}
          songId={songId}
          currentStage={selectedStage}
        />
      )}
    </div>
    </AppLayout>
  );
}
