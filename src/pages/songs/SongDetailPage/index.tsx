import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CompactSongCard,
  AssignChecklistDialog,
  RecordingTab,
  ReleaseTab,
  ArtistManagementSection,
  WorkTab,
  AddTemplateDialog,
} from '@/components/songs';
import { TaskCompletionModal } from '@/components/tasks/TaskCompletionModal';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { SongStage, SongChecklistItem } from '@/types/song';

import { useSongDetail } from './hooks/useSongDetail';
import { useSongActivities } from './hooks/useSongActivities';
import { SongOverviewTab } from './tabs/SongOverviewTab';
import { SongAssetsTab } from './tabs/SongAssetsTab';
import { SongTasksTab } from './tabs/SongTasksTab';
import { SongActivityTab } from './tabs/SongActivityTab';
import { ActivityType } from './types';

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Local state
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

  const songId = parseInt(id || '0');

  // Data and mutations
  const {
    song,
    checklist,
    notes,
    transitions,
    assets,
    songLoading,
    toggleChecklistMutation,
    updateAssetUrlMutation,
    validateAllMutation,
    reviewAssetMutation,
    createNoteMutation,
    stageActionMutation,
    handleOpenTaskModal,
    queryClient,
  } = useSongDetail(songId, activeTab);

  // Activity filtering
  const { filteredActivities } = useSongActivities(
    transitions,
    notes,
    checklist,
    assets,
    activityFilter
  );

  // Auto-select current stage when song loads
  useEffect(() => {
    if (song?.current_stage && !selectedStage) {
      setSelectedStage(song.current_stage);
    }
  }, [song?.current_stage, selectedStage]);

  // Cleanup pointer-events when task modal closes
  useEffect(() => {
    if (!taskModalOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [taskModalOpen]);

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

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/songs')} className="hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Songs
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CompactSongCard song={song} recentNotes={notes.slice(0, 3)} />

          <TabsContent value="overview" className="space-y-8 mt-8">
            <SongOverviewTab
              song={song}
              songId={songId}
              checklist={checklist}
              selectedStage={selectedStage}
              onStageClick={setSelectedStage}
              onToggleChecklist={(itemId) => toggleChecklistMutation.mutate(itemId)}
              onAssignChecklist={(itemId) => {
                const item = checklist.find(i => i.id === itemId);
                if (item) {
                  setSelectedChecklistItem(item);
                  setAssignDialogOpen(true);
                }
              }}
              onUpdateAssetUrl={(itemId, assetUrl) =>
                updateAssetUrlMutation.mutate({ itemId, assetUrl })
              }
              onOpenTaskModal={(checklistItemId) =>
                handleOpenTaskModal(checklistItemId, setSelectedTask, setTaskModalOpen, setIsLoadingTask)
              }
              onValidateAll={() => validateAllMutation.mutate()}
              isValidating={validateAllMutation.isPending}
              stageActionMutation={stageActionMutation}
              onAddTemplate={() => setAddTemplateDialogOpen(true)}
            />
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
            <SongAssetsTab
              songId={songId}
              assets={assets}
              canUploadAssets={canUploadAssets}
              canReviewAssets={canReviewAssets}
              showAssetUploader={showAssetUploader}
              onShowUploader={() => setShowAssetUploader(true)}
              onHideUploader={() => setShowAssetUploader(false)}
              onUploadComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['song-assets', songId] });
                setShowAssetUploader(false);
                toast({ title: 'Asset uploaded successfully' });
              }}
              onReviewAsset={(assetId, action, notes) =>
                reviewAssetMutation.mutate({ assetId, action, notes })
              }
            />
          </TabsContent>

          <TabsContent value="release" className="space-y-8 mt-8">
            <ReleaseTab songId={songId} releaseId={song.release?.id} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-8 mt-8">
            <SongTasksTab songId={songId} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-8 mt-8">
            <SongActivityTab
              transitions={transitions}
              filteredActivities={filteredActivities}
              activityFilter={activityFilter}
              onFilterChange={setActivityFilter}
              showAddNote={showAddNote}
              onShowAddNote={() => setShowAddNote(true)}
              onHideAddNote={() => setShowAddNote(false)}
              onCreateNote={async (content, isImportant) => {
                await createNoteMutation.mutateAsync({ content, is_important: isImportant });
                setShowAddNote(false);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AssignChecklistDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          songId={songId}
          checklistItem={selectedChecklistItem}
        />

        <TaskCompletionModal
          task={selectedTask}
          open={taskModalOpen}
          onOpenChange={(open) => {
            setTaskModalOpen(open);
            if (!open) setSelectedTask(null);
          }}
        />

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
