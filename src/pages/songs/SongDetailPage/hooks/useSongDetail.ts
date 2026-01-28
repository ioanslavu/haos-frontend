import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchSongDetail,
  fetchChecklist,
  toggleChecklistItem,
  updateChecklistAssetUrl,
  validateAllChecklist,
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
import { SongStage } from '@/types/song';
import { STAGE_FLOW } from '../constants';

export function useSongDetail(songId: number, activeTab: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const { data: workData, isLoading: workLoading, error: workError } = useQuery({
    queryKey: ['song-work', songId],
    queryFn: () => fetchSongWork(songId),
    enabled: activeTab === 'work',
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  // Normalize data arrays
  const song = songData?.data;
  const checklist = Array.isArray(checklistData?.data?.results)
    ? checklistData.data.results
    : (Array.isArray(checklistData?.data) ? checklistData.data : []);
  const notes = Array.isArray(notesData?.data?.results)
    ? notesData.data.results
    : (Array.isArray(notesData?.data) ? notesData.data : []);
  const transitions = Array.isArray(transitionsData?.data?.results)
    ? transitionsData.data.results
    : (Array.isArray(transitionsData?.data) ? transitionsData.data : []);
  const assets = Array.isArray(assetsData?.data?.results)
    ? assetsData.data.results
    : (Array.isArray(assetsData?.data) ? assetsData.data : []);
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
      toast({
        title: 'Note Added',
        description: 'Your note has been added to the activity log.',
      });
    },
  });

  const stageActionMutation = useMutation({
    mutationFn: async ({ stage, action }: { stage: SongStage; action: 'start' | 'finish' | 'resume' }) => {
      if (action === 'start') {
        await updateStageStatus(songId, stage, { status: 'in_progress' });
      } else if (action === 'finish') {
        await updateStageStatus(songId, stage, { status: 'completed' });
        const currentIndex = STAGE_FLOW.indexOf(stage);
        const nextStage = currentIndex >= 0 && currentIndex < STAGE_FLOW.length - 1
          ? STAGE_FLOW[currentIndex + 1]
          : null;
        if (nextStage) {
          await updateStageStatus(songId, nextStage, { status: 'in_progress' });
        }
      } else if (action === 'resume') {
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

  const handleOpenTaskModal = async (
    checklistItemId: number,
    setSelectedTask: (task: any) => void,
    setTaskModalOpen: (open: boolean) => void,
    setIsLoadingTask: (loading: boolean) => void
  ) => {
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

  return {
    // Data
    song,
    checklist,
    notes,
    transitions,
    assets,
    work,
    // Loading states
    songLoading,
    checklistLoading,
    workLoading,
    workError,
    // Mutations
    toggleChecklistMutation,
    updateAssetUrlMutation,
    validateAllMutation,
    sendToMarketingMutation,
    sendToDigitalMutation,
    reviewAssetMutation,
    createNoteMutation,
    stageActionMutation,
    // Handlers
    handleOpenTaskModal,
    // Query client for external invalidations
    queryClient,
  };
}
