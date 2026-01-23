import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Task, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_TAG_LABELS, TASK_TYPE_LABELS, TASK_STATUS_COLORS, TASK_TAG_COLORS } from '@/api/types/tasks';
import { useDeleteTask, useUpdateTask, useCreateTask, useLinkTaskToDomain, useUnlinkTaskFromDomain } from '@/api/hooks/useTasks';
import {
  Calendar,
  Clock,
  Flag,
  Tag,
  User,
  Trash2,
  CheckCircle2,
  Link as LinkIcon,
  Bell,
  BellOff,
  TrendingUp,
  X,
  FileText,
  ChevronRight,
  Plus,
  Users,
  Music,
  Briefcase,
  Building2,
  ClipboardCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-handler';
import { InlineStatusBadge } from './InlineStatusBadge';
import { InlineDatePicker } from './InlineDatePicker';
import { InlineAssigneeSelect } from './InlineAssigneeSelect';
import { InlineTeamSelect } from './InlineTeamSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import { InlineDepartmentSelect } from './InlineDepartmentSelect';
import { InlineDurationSelect } from './InlineDurationSelect';
import { TaskRichTextEditor } from './TaskRichTextEditor';
import { InlineCustomFieldsManager, InlineCustomFieldsManagerHandle } from './InlineCustomFieldsManager';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { AddEntityModal } from '@/components/entities/AddEntityModal';
import { SongSearchCombobox } from '@/components/songs/SongSearchCombobox';
import { QuickCreateSongDialog } from '@/components/songs/QuickCreateSongDialog';
import { CampaignSearchCombobox } from '@/components/campaigns/CampaignSearchCombobox';
import { QuickCreateCampaignDialog } from '@/components/campaigns/QuickCreateCampaignDialog';
import { DistributionSearchCombobox } from '@/components/distributions/DistributionSearchCombobox';
import { useEntity } from '@/api/hooks/useEntities';
import { useCampaign, useSubCampaigns } from '@/api/hooks/useCampaigns';
import { useDistribution } from '@/api/hooks/useDistributions';
import { useSong } from '@/api/hooks/useSongs';
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons';
import { PLATFORM_CONFIG } from '@/types/campaign';

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createMode?: boolean; // New prop to indicate create mode
  projectId?: number; // Project ID for creating tasks in a specific project
  defaultCampaignId?: number; // Pre-link task to this campaign when creating
  defaultSubcampaignId?: number; // Pre-link task to this subcampaign (platform) when creating
  defaultSongId?: number; // Pre-link task to this song when creating
  defaultEntityId?: number; // Pre-link task to this entity when creating
  defaultDistributionId?: number; // Pre-link task to this distribution when creating
}

export function TaskDetailPanel({ task, open, onOpenChange, createMode = false, projectId, defaultCampaignId, defaultSubcampaignId, defaultSongId, defaultEntityId, defaultDistributionId }: TaskDetailPanelProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localNotes, setLocalNotes] = useState<any>(null);
  const [localPriority, setLocalPriority] = useState<number>(2);
  const [localDueDate, setLocalDueDate] = useState<string | null>(null);
  const [localAssignees, setLocalAssignees] = useState<number[]>([]);
  const [localTeam, setLocalTeam] = useState<number | null>(null);
  const [localDepartment, setLocalDepartment] = useState<number | null>(null);
  const [localEstimatedHours, setLocalEstimatedHours] = useState<number | null>(null);
  const [localNeedsReview, setLocalNeedsReview] = useState<boolean>(false);
  const [localEntity, setLocalEntity] = useState<number | null>(null);
  const [localArtist, setLocalArtist] = useState<number | null>(null);
  const [localClient, setLocalClient] = useState<number | null>(null);
  const [showEntitySearch, setShowEntitySearch] = useState(false);
  const [showArtistSearch, setShowArtistSearch] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);
  const [showAddArtistModal, setShowAddArtistModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [localSong, setLocalSong] = useState<number | null>(null);
  const [showSongSearch, setShowSongSearch] = useState(false);
  const [showCreateSongDialog, setShowCreateSongDialog] = useState(false);
  const [localCampaign, setLocalCampaign] = useState<number | null>(null);
  const [localSubcampaign, setLocalSubcampaign] = useState<number | null>(null);
  const [localDistribution, setLocalDistribution] = useState<number | null>(null);
  const [showCampaignSearch, setShowCampaignSearch] = useState(false);
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false);
  const [showDistributionSearch, setShowDistributionSearch] = useState(false);
  const [localProject, setLocalProject] = useState<number | null>(projectId || null);
  const [showAddRelatedItemMenu, setShowAddRelatedItemMenu] = useState(false);
  const [visibleRelatedFields, setVisibleRelatedFields] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'creating'>('idle');
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<number | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const customFieldsRef = useRef<InlineCustomFieldsManagerHandle>(null);
  const isCreateMode = createMode && !task && !createdTaskId;

  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const linkToDomain = useLinkTaskToDomain();
  const unlinkFromDomain = useUnlinkTaskFromDomain();

  // Get current user for admin check
  const { user, isAdmin: isAdminFn } = useAuthStore();
  const isAdmin = isAdminFn();

  // Fetch entity details when we have localEntity set (for create mode)
  const { data: selectedEntityData } = useEntity(
    localEntity || 0,
    !!localEntity && !task?.entity_detail
  );
  const { data: selectedArtistData } = useEntity(
    localArtist || 0,
    !!localArtist && !task?.entity_detail
  );
  const { data: selectedClientData } = useEntity(
    localClient || 0,
    !!localClient && !task?.entity_detail
  );
  // Compute effective campaign ID from task or local state
  const effectiveCampaignId = localCampaign
    || (task?.domain_info?.domain_type === 'campaign' ? task.domain_info.entity_id : null)
    || task?.campaign
    || null;

  // Always fetch campaign data when we have a campaign ID
  const { data: selectedCampaignData } = useCampaign(
    effectiveCampaignId || 0,
    !!effectiveCampaignId
  );

  // Fetch subcampaigns (platforms) for the selected campaign
  const { data: subcampaignsData } = useSubCampaigns(
    effectiveCampaignId || 0,
    undefined,
    !!effectiveCampaignId
  );
  const subcampaigns = subcampaignsData?.results || [];

  // Get effective subcampaign ID from task's domain_info or local state
  const effectiveSubcampaignId = localSubcampaign
    || (task?.domain_info?.domain_type === 'campaign' ? task.domain_info.extra?.subcampaign?.id : null)
    || null;

  const { data: selectedSongData } = useSong(
    localSong || 0,
    !!localSong && !task?.song_detail
  );

  // Compute effective distribution ID from task or local state
  const effectiveDistributionId = localDistribution
    || (task?.domain_info?.domain_type === 'distribution' ? task.domain_info.entity_id : null)
    || null;

  // Fetch distribution data when we have a distribution ID
  const { data: selectedDistributionData } = useDistribution(
    effectiveDistributionId || 0,
    !!effectiveDistributionId
  );

  // Fetch departments from accounts API (for admin users)
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/departments/');
      return response.data;
    },
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Map departments to {id, name} format
  const departments = departmentsData
    ? (Array.isArray(departmentsData) ? departmentsData : departmentsData.results || [])
        .map((d: any) => ({ id: d.id, name: d.name }))
    : [];

  // Focus title input in create mode
  useEffect(() => {
    if (open && isCreateMode && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [open, isCreateMode]);

  // Initialize local state when task changes or when opening in create mode
  useEffect(() => {
    if (open) {
      if (task) {
        setLocalTitle(task.title || '');
        setLocalDescription(task.description || '');
        setLocalNotes(task.notes || null);
        setLocalPriority(task.priority || 2);
        setLocalDueDate(task.due_date || null);
        setLocalAssignees(task.assigned_to_users_detail?.map(u => u.id) || []);
        setLocalTeam(task.assigned_team || null);
        setLocalDepartment(task.department || null);
        setLocalEstimatedHours(task.estimated_hours || null);
        setLocalNeedsReview(task.needs_review || false);
        setLocalEntity(task.entity || null);
        // Determine if entity is artist or client based on classification
        if (task.entity && task.entity_detail) {
          const isArtist = task.entity_detail.classification === 'CREATIVE';
          const isClient = task.entity_detail.classification === 'CLIENT';
          if (isArtist) {
            setLocalArtist(task.entity);
            setLocalClient(null);
          } else if (isClient) {
            setLocalClient(task.entity);
            setLocalArtist(null);
          }
        } else {
          setLocalArtist(null);
          setLocalClient(null);
        }
        setShowEntitySearch(false);
        setShowArtistSearch(false);
        setShowClientSearch(false);
        setLocalSong(task.song || null);
        setShowSongSearch(false);
        // Get campaign from domain_info if it's a campaign-linked task
        const campaignId = task.domain_info?.domain_type === 'campaign'
          ? task.domain_info.entity_id
          : (task.campaign || null);
        setLocalCampaign(campaignId);
        setShowCampaignSearch(false);
        // Get distribution from domain_info if it's a distribution-linked task
        const distributionId = task.domain_info?.domain_type === 'distribution'
          ? task.domain_info.entity_id
          : null;
        setLocalDistribution(distributionId);
        setShowDistributionSearch(false);
        // Show fields that have values
        const fieldsToShow = new Set<string>();
        if (task.entity) {
          const isArtist = task.entity_detail?.classification === 'CREATIVE';
          const isClient = task.entity_detail?.classification === 'CLIENT';
          if (isArtist) fieldsToShow.add('artist');
          if (isClient) fieldsToShow.add('client');
        }
        if (task.song) fieldsToShow.add('song');
        if (task.domain_info?.domain_type === 'campaign' || task.campaign) fieldsToShow.add('campaign');
        if (task.domain_info?.domain_type === 'distribution') fieldsToShow.add('distribution');
        setVisibleRelatedFields(fieldsToShow);
        setSaveState('idle');
        setCreatedTaskId(null);
      } else if (createMode) {
        // Reset for create mode and auto-assign current user
        setLocalTitle('');
        setLocalDescription('');
        setLocalNotes('');
        setLocalPriority(2);
        setLocalDueDate(null);
        setLocalAssignees(user?.id ? [Number(user.id)] : []); // Auto-assign current user
        setLocalTeam(null);
        setLocalDepartment(null); // Admin users need to select department manually
        setLocalEstimatedHours(null);
        setLocalNeedsReview(false);
        setLocalEntity(defaultEntityId || null);
        setLocalArtist(null);
        setLocalClient(null);
        setShowEntitySearch(false);
        setShowArtistSearch(false);
        setShowClientSearch(false);
        setLocalSong(defaultSongId || null);
        setShowSongSearch(false);
        setLocalCampaign(defaultCampaignId || null);
        setLocalSubcampaign(defaultSubcampaignId || null);
        setLocalDistribution(defaultDistributionId || null);
        setShowCampaignSearch(false);
        setShowDistributionSearch(false);
        // Pre-show related fields that have default values
        const defaultFields = new Set<string>();
        if (defaultCampaignId) defaultFields.add('campaign');
        if (defaultSongId) defaultFields.add('song');
        if (defaultEntityId) defaultFields.add('entity');
        if (defaultDistributionId) defaultFields.add('distribution');
        setVisibleRelatedFields(defaultFields);
        setSaveState('idle');
        setCreatedTaskId(null);
      }
    }
  }, [task, open, createMode, user, defaultCampaignId, defaultSubcampaignId, defaultSongId, defaultEntityId]);

  // Auto-save with debounce (handles both create and update)
  useEffect(() => {
    if (!open) return;
    if (!localTitle.trim()) return; // Don't save/create without title

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Determine if we need to save
    const needsCreate = isCreateMode && !createdTaskId;
    const needsUpdate = (task || createdTaskId) && (
      localTitle !== (task?.title || '') ||
      localDescription !== (task?.description || '') ||
      localNotes !== (task?.notes || '') ||
      localPriority !== (task?.priority || 2) ||
      localDueDate !== (task?.due_date || null) ||
      localDepartment !== (task?.department || null) ||
      JSON.stringify(localAssignees) !== JSON.stringify(task?.assigned_to_users_detail?.map(u => u.id) || [])
    );

    if (needsCreate || needsUpdate) {
      setSaveState(needsCreate ? 'creating' : 'dirty');

      // Set new timer for auto-save
      debounceTimerRef.current = setTimeout(async () => {
        try {
          if (needsCreate) {
            // Create new task
            setSaveState('creating');
            const newTask = await createTask.mutateAsync({
              title: localTitle,
              description: localDescription || undefined,
              notes: localNotes || undefined,
              status: 'todo',
              priority: localPriority,
              due_date: localDueDate || undefined,
              assigned_user_ids: localAssignees.length > 0 ? localAssignees : undefined,
              department: localDepartment || undefined,
              project: localProject || projectId || undefined,
              needs_review: localNeedsReview,
            });
            setCreatedTaskId(newTask.id);

            // Link to campaign (and optionally subcampaign) if set
            if (localCampaign) {
              try {
                await linkToDomain.mutateAsync({
                  taskId: newTask.id,
                  domainType: 'campaign',
                  entityId: localCampaign,
                  extra: localSubcampaign ? { subcampaign_id: localSubcampaign } : undefined,
                });
              } catch {
                // Don't fail the create if linking fails
                console.error('Failed to link task to campaign');
              }
            }

            // Link to distribution if set
            if (localDistribution) {
              try {
                await linkToDomain.mutateAsync({
                  taskId: newTask.id,
                  domainType: 'distribution',
                  entityId: localDistribution,
                });
              } catch {
                // Don't fail the create if linking fails
                console.error('Failed to link task to distribution');
              }
            }

            setSaveState('idle');
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
            toast.success('Task created');
          } else {
            // Update existing task
            setSaveState('saving');
            const taskId = task?.id || createdTaskId!;
            await updateTask.mutateAsync({
              id: taskId,
              data: {
                title: localTitle,
                description: localDescription || undefined,
                notes: localNotes || undefined,
                priority: localPriority,
                due_date: localDueDate || undefined,
                assigned_user_ids: localAssignees.length > 0 ? localAssignees : undefined,
                department: localDepartment || undefined,
              },
            });
            setSaveState('idle');
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
          }
        } catch (error) {
          setSaveState('idle');
          toast.error(needsCreate ? 'Failed to create task' : 'Failed to save changes');
        }
      }, 1000);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localTitle, localDescription, localNotes, localPriority, localDueDate, localDepartment, localAssignees, task, createdTaskId, open, isCreateMode, projectId, localProject, localCampaign, localDistribution]);

  // Handle modal close with autosave
  const handleClose = async (newOpen?: boolean) => {
    // If opening, just pass through
    if (newOpen === true) {
      onOpenChange(true);
      return;
    }

    // Blur any active element to trigger save handlers (like onBlur in custom fields)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Small delay to let blur handlers complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Flush any pending custom field changes
    if (customFieldsRef.current?.hasPendingChanges()) {
      await customFieldsRef.current.flushPendingChanges();
    }

    // If there's a pending save, trigger it immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);

      // Create mode - create new task
      if (isCreateMode && localTitle.trim() && !createdTaskId) {
        const payload = {
          title: localTitle,
          description: localDescription || undefined,
          notes: localNotes || undefined,
          priority: localPriority,
          due_date: localDueDate || undefined,
          assigned_to_users: localAssignees.length > 0 ? localAssignees : undefined,
          department: localDepartment || undefined,
          estimated_hours: localEstimatedHours || undefined,
          entity: localEntity || undefined,
          song: localSong || undefined,
          project: localProject || projectId || undefined,
          needs_review: localNeedsReview,
        };

        createTask.mutate(payload, {
          onSuccess: async (response) => {
            setCreatedTaskId(response.id);
            // Link to campaign if localCampaign is set
            if (localCampaign) {
              try {
                await linkToDomain.mutateAsync({
                  taskId: response.id,
                  domainType: 'campaign',
                  entityId: localCampaign,
                });
              } catch {
                console.error('Failed to link task to campaign');
              }
            }
          },
          onSettled: () => {
            // Close on both success and error
            onOpenChange(false);
          },
        });
        return; // Don't close yet, wait for mutation
      }

      // Edit mode - update existing task
      const taskId = task?.id || createdTaskId;
      if (taskId && localTitle.trim()) {
        const payload: any = {
          title: localTitle,
          description: localDescription || '',
          notes: localNotes || null,
          priority: localPriority,
          due_date: localDueDate || null,
          assigned_user_ids: localAssignees,
          department: localDepartment || null,
          estimated_hours: localEstimatedHours || null,
        };

        updateTask.mutate(
          { id: taskId, data: payload },
          {
            onSettled: () => {
              onOpenChange(false);
            },
          }
        );
        return; // Don't close yet, wait for mutation
      }
    }

    onOpenChange(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close (only if task exists or was created)
      if (e.key === 'Escape' && !showDeleteDialog && (task || createdTaskId)) {
        handleClose();
      }
      // Cmd/Ctrl + Backspace to delete (only if task exists)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && (task || createdTaskId)) {
        e.preventDefault();
        setShowDeleteDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, showDeleteDialog, task, createdTaskId, isCreateMode, localTitle, localDescription, localNotes, localPriority, localDueDate, localAssignees, localDepartment, localEstimatedHours, localEntity, localSong, localCampaign, localDistribution]);

  // Don't render if not open or (not in create mode and no task)
  if (!open || (!createMode && !task)) return null;

  const handleUpdateField = async (field: string, value: any) => {
    // Can't update fields before task is created
    if (!task && !createdTaskId) {
      toast.error('Please enter a title first');
      return;
    }

    try {
      const taskId = task?.id || createdTaskId!;
      await updateTask.mutateAsync({
        id: taskId,
        data: { [field]: value },
      });
      toast.success('Updated successfully');
    } catch (error) {
      handleApiError(error, {
        context: 'updating task',
        showToast: true,
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    const taskId = task?.id || createdTaskId;
    if (!taskId) return;

    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted');
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tasks/${task.id}`);
    toast.success('Link copied to clipboard');
  };

  const handleDuplicate = async () => {
    toast.info('Duplicate feature coming soon');
  };

  const assignedUsers = task?.assigned_to_users_detail || [];
  const hasFollowUpReminder = !!task?.reminder_date;

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          className={cn(
            'w-full sm:max-w-2xl overflow-y-auto p-0',
            'animate-in slide-in-from-right duration-300 ease-out'
          )}
        >
          {/* Main Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Title - Large and Prominent (Notion style) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                Title {isCreateMode && '*'}
              </label>
              <input
                ref={titleInputRef}
                type="text"
                placeholder={isCreateMode ? "Task title..." : "Task title"}
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="w-full text-3xl font-bold bg-transparent px-1 py-2 placeholder:text-muted-foreground/30"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                onFocus={(e) => e.target.style.outline = 'none'}
              />
              {isCreateMode && !localTitle && (
                <p className="text-xs text-muted-foreground/70 pl-1">
                  Start typing to create the task...
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                Description
              </label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full text-sm bg-transparent px-1 py-2 placeholder:text-muted-foreground/30 resize-none"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                onFocus={(e) => e.target.style.outline = 'none'}
              />
            </div>

            <Separator />

            {/* Properties Grid */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Properties
              </h4>

              <div className="space-y-3">
                {/* Priority */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Flag className="h-4 w-4" />
                    <span>Priority</span>
                  </div>
                  <div className="flex-1">
                    <InlinePrioritySelect
                      value={localPriority}
                      onSave={async (value) => {
                        setLocalPriority(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('priority', value);
                        }
                      }}
                      className="w-full justify-start"
                    />
                  </div>
                </div>

                {/* Assignees */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Assigned to</span>
                  </div>
                  <div className="flex-1">
                    <InlineAssigneeSelect
                      value={localAssignees}
                      onSave={async (value) => {
                        setLocalAssignees(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('assigned_user_ids', value);
                        }
                      }}
                      placeholder="Add assignees..."
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Team */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Team</span>
                  </div>
                  <div className="flex-1">
                    <InlineTeamSelect
                      value={localTeam}
                      teamDetail={task?.assigned_team_detail}
                      onSave={async (value) => {
                        setLocalTeam(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('assigned_team_id', value);
                        }
                      }}
                      placeholder="Add team..."
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Department (for admin users) */}
                {isAdmin && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Department</span>
                    </div>
                    <div className="flex-1">
                      <InlineDepartmentSelect
                        value={localDepartment}
                        departments={departments}
                        onSave={async (value) => {
                          setLocalDepartment(value);
                          if (!isCreateMode && (task || createdTaskId) && value !== null) {
                            await handleUpdateField('department', value);
                          }
                        }}
                        placeholder="Select department..."
                        className="w-full"
                        isLoading={!departmentsData && isAdmin}
                      />
                      {!localDepartment && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                          ⚠️ Department is required to save tasks
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Due Date */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due date</span>
                  </div>
                  <div className="flex-1">
                    <InlineDatePicker
                      value={localDueDate}
                      onSave={async (value) => {
                        setLocalDueDate(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('due_date', value);
                        }
                      }}
                      placeholder="Add due date..."
                      className="w-full"
                    />
                    {localDueDate && new Date(localDueDate) < new Date(new Date().toDateString()) && task?.status !== 'done' && (
                      <Badge variant="destructive" className="text-xs mt-2">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Estimated Duration */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Estimated</span>
                  </div>
                  <div className="flex-1">
                    <InlineDurationSelect
                      value={localEstimatedHours}
                      onSave={async (value) => {
                        setLocalEstimatedHours(value);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('estimated_hours', value);
                        }
                      }}
                      placeholder="Set estimated time"
                      className="w-full justify-start"
                    />
                  </div>
                </div>

                {/* Needs Review */}
                <div className="flex items-start gap-3 group">
                  <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Needs review</span>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={async () => {
                        const newValue = !localNeedsReview;
                        setLocalNeedsReview(newValue);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('needs_review', newValue);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        localNeedsReview
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {localNeedsReview ? "Yes" : "No"}
                    </button>
                    {localNeedsReview && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Requires manager approval before completion
                      </p>
                    )}
                  </div>
                </div>

                {/* Actual Duration (Read-only, auto-calculated) */}
                {task?.actual_hours && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Actual</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {task.actual_hours < 1
                            ? `${Math.round(task.actual_hours * 60)} min`
                            : task.actual_hours === 1
                            ? '1 hour'
                            : task.actual_hours % 1 === 0
                            ? `${task.actual_hours} hours`
                            : `${Math.floor(task.actual_hours)}h ${Math.round((task.actual_hours % 1) * 60)}m`
                          }
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Auto-calculated
                        </Badge>
                      </div>
                      {task.estimated_hours && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.actual_hours > task.estimated_hours
                            ? `${((task.actual_hours - task.estimated_hours) * 60).toFixed(0)} min over estimate`
                            : task.actual_hours < task.estimated_hours
                            ? `${((task.estimated_hours - task.actual_hours) * 60).toFixed(0)} min under estimate`
                            : 'Exactly as estimated'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Fields - Inline with properties */}
                {(task?.id || createdTaskId) && (task?.project || localProject) && (
                  <InlineCustomFieldsManager
                    ref={customFieldsRef}
                    taskId={task?.id || createdTaskId!}
                    projectId={task?.project || localProject!}
                  />
                )}

                {/* Follow-up Reminder */}
                {hasFollowUpReminder && task && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      {task.follow_up_reminder_sent ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4 text-orange-500" />
                      )}
                      <span>Follow-up</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm">{format(new Date(task.reminder_date!), 'PPP')}</span>
                      {!task.follow_up_reminder_sent && (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress */}
                {task && task.completion_percentage > 0 && (
                  <div className="flex items-start gap-3 group">
                    <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Progress</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Progress value={task.completion_percentage} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-12 text-right">
                          {task.completion_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Items */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Related Items
                </h4>
                <DropdownMenu open={showAddRelatedItemMenu} onOpenChange={setShowAddRelatedItemMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {!visibleRelatedFields.has('artist') && !localArtist && !localClient && (
                      <DropdownMenuItem
                        onClick={() => {
                          setVisibleRelatedFields(new Set([...visibleRelatedFields, 'artist']));
                          setShowArtistSearch(true);
                          setShowAddRelatedItemMenu(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        Artist
                      </DropdownMenuItem>
                    )}
                    {!visibleRelatedFields.has('client') && !localClient && !localArtist && (
                      <DropdownMenuItem
                        onClick={() => {
                          setVisibleRelatedFields(new Set([...visibleRelatedFields, 'client']));
                          setShowClientSearch(true);
                          setShowAddRelatedItemMenu(false);
                        }}
                      >
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        Client
                      </DropdownMenuItem>
                    )}
                    {!visibleRelatedFields.has('song') && !localSong && (
                      <DropdownMenuItem
                        onClick={() => {
                          setVisibleRelatedFields(new Set([...visibleRelatedFields, 'song']));
                          setShowSongSearch(true);
                          setShowAddRelatedItemMenu(false);
                        }}
                      >
                        <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                        Song
                      </DropdownMenuItem>
                    )}
                    {/* Hide Campaign for marketing department users */}
                    {!visibleRelatedFields.has('campaign') && !effectiveCampaignId &&
                     !(user?.department?.name?.toLowerCase() === 'marketing' ||
                       (user?.department as any)?.toLowerCase?.() === 'marketing') && (
                      <DropdownMenuItem
                        onClick={() => {
                          setVisibleRelatedFields(new Set([...visibleRelatedFields, 'campaign']));
                          setShowCampaignSearch(true);
                          setShowAddRelatedItemMenu(false);
                        }}
                      >
                        <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                        Campaign
                      </DropdownMenuItem>
                    )}
                    {!visibleRelatedFields.has('distribution') && !effectiveDistributionId && (
                      <DropdownMenuItem
                        onClick={() => {
                          setVisibleRelatedFields(new Set([...visibleRelatedFields, 'distribution']));
                          setShowDistributionSearch(true);
                          setShowAddRelatedItemMenu(false);
                        }}
                      >
                        <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                        Distribution
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Artist */}
              {(visibleRelatedFields.has('artist') || localArtist) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Artist</span>
                </div>

                {showArtistSearch && !localArtist && !localClient && (
                  <div className="space-y-2">
                    <EntitySearchCombobox
                      value={localArtist}
                      onValueChange={async (entityId) => {
                        if (entityId) {
                          setLocalArtist(entityId);
                          setLocalEntity(entityId);
                          setLocalClient(null);
                          setShowArtistSearch(false);
                          if (!isCreateMode && (task || createdTaskId)) {
                            await handleUpdateField('entity', entityId);
                          }
                        }
                      }}
                      filter={{ classification: 'CREATIVE', entity_type: 'artist' }}
                      allowAddEntity={true}
                      onCreateNew={() => {
                        setShowAddArtistModal(true);
                      }}
                      placeholder="Search artists..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowArtistSearch(false);
                        const newFields = new Set(visibleRelatedFields);
                        newFields.delete('artist');
                        setVisibleRelatedFields(newFields);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {localArtist && task?.entity_detail && (
                  <button
                    onClick={() => {
                      navigate(`/entities/${task.entity}`);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left group relative"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{task.entity_detail.display_name}</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLocalArtist(null);
                        setLocalEntity(null);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('entity', null);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {localArtist && !task?.entity_detail && selectedArtistData && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{selectedArtistData.display_name}</span>
                    <button
                      onClick={async () => {
                        setLocalArtist(null);
                        setLocalEntity(null);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('entity', null);
                        }
                      }}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Client */}
              {(visibleRelatedFields.has('client') || localClient) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Client</span>
                </div>

                {showClientSearch && !localClient && !localArtist && (
                  <div className="space-y-2">
                    <EntitySearchCombobox
                      value={localClient}
                      onValueChange={async (entityId) => {
                        if (entityId) {
                          setLocalClient(entityId);
                          setLocalEntity(entityId);
                          setLocalArtist(null);
                          setShowClientSearch(false);
                          if (!isCreateMode && (task || createdTaskId)) {
                            await handleUpdateField('entity', entityId);
                          }
                        }
                      }}
                      filter={{ classification: 'CLIENT' }}
                      allowAddEntity={true}
                      onCreateNew={() => {
                        setShowAddClientModal(true);
                      }}
                      placeholder="Search clients..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowClientSearch(false);
                        const newFields = new Set(visibleRelatedFields);
                        newFields.delete('client');
                        setVisibleRelatedFields(newFields);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {localClient && task?.entity_detail && (
                  <button
                    onClick={() => {
                      navigate(`/entities/${task.entity}`);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left group relative"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{task.entity_detail.display_name}</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLocalClient(null);
                        setLocalEntity(null);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('entity', null);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {localClient && !task?.entity_detail && selectedClientData && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{selectedClientData.display_name}</span>
                    <button
                      onClick={async () => {
                        setLocalClient(null);
                        setLocalEntity(null);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('entity', null);
                        }
                      }}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Song */}
              {(visibleRelatedFields.has('song') || localSong) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Song</span>
                </div>

                {showSongSearch && !localSong && (
                  <div className="space-y-2">
                    <SongSearchCombobox
                      value={localSong}
                      onValueChange={async (songId) => {
                        if (songId) {
                          setLocalSong(songId);
                          setShowSongSearch(false);
                          if (!isCreateMode && (task || createdTaskId)) {
                            await handleUpdateField('song', songId);
                          }
                        }
                      }}
                      onCreateNew={() => {
                        setShowCreateSongDialog(true);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSongSearch(false);
                        const newFields = new Set(visibleRelatedFields);
                        newFields.delete('song');
                        setVisibleRelatedFields(newFields);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {task?.song_detail && (
                  <button
                    onClick={() => {
                      navigate(`/songs/${task.song}`);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left group relative"
                  >
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.song_detail.title}</p>
                      {task.song_detail.artist?.display_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.song_detail.artist.display_name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLocalSong(null);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('song', null);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {!task?.song_detail && localSong && selectedSongData && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedSongData.title}</p>
                      {selectedSongData.artist?.display_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedSongData.artist.display_name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        setLocalSong(null);
                        if (!isCreateMode && (task || createdTaskId)) {
                          await handleUpdateField('song', null);
                        }
                      }}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Campaign */}
              {(visibleRelatedFields.has('campaign') || effectiveCampaignId) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Campaign</span>
                </div>

                {showCampaignSearch && !effectiveCampaignId && (
                  <div className="space-y-2">
                    <CampaignSearchCombobox
                      value={localCampaign}
                      onValueChange={async (campaignId) => {
                        if (campaignId) {
                          setLocalCampaign(campaignId);
                          setShowCampaignSearch(false);
                          const taskId = task?.id || createdTaskId;
                          if (!isCreateMode && taskId) {
                            // Use the agnostic link-domain endpoint
                            await linkToDomain.mutateAsync({
                              taskId,
                              domainType: 'campaign',
                              entityId: campaignId,
                            });
                          }
                        }
                      }}
                      onCreateNew={() => {
                        setShowCreateCampaignDialog(true);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCampaignSearch(false);
                        const newFields = new Set(visibleRelatedFields);
                        newFields.delete('campaign');
                        setVisibleRelatedFields(newFields);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Display campaign - use selectedCampaignData with domain_info extras if available */}
                {effectiveCampaignId && selectedCampaignData && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate(`/campaigns/${effectiveCampaignId}`);
                        onOpenChange(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left group relative"
                    >
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedCampaignData.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {selectedCampaignData.status_display || selectedCampaignData.status}
                          </Badge>
                          {/* Show subcampaign/platform badge */}
                          {effectiveSubcampaignId && (() => {
                            const sc = subcampaigns.find(s => s.id === effectiveSubcampaignId);
                            if (!sc) return null;
                            const PlatformIcon = PLATFORM_ICONS[sc.platform];
                            const colorClass = PLATFORM_TEXT_COLORS[sc.platform];
                            return (
                              <Badge variant="secondary" className="text-xs gap-1">
                                {PlatformIcon && <PlatformIcon className={cn("h-3 w-3", colorClass)} />}
                                {PLATFORM_CONFIG[sc.platform]?.label || sc.platform}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setLocalCampaign(null);
                          setLocalSubcampaign(null);
                          const taskId = task?.id || createdTaskId;
                          if (!isCreateMode && taskId) {
                            await unlinkFromDomain.mutateAsync({
                              taskId,
                              domainType: 'campaign',
                            });
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {/* Platform selector - show when campaign has platforms */}
                    {subcampaigns.length > 0 && (
                      <div className="pl-6">
                        <p className="text-xs text-muted-foreground mb-1.5">Platform (optional)</p>
                        <div className="flex flex-wrap gap-1">
                          {/* None option */}
                          <button
                            onClick={async () => {
                              const prevSubcampaign = localSubcampaign || effectiveSubcampaignId;
                              setLocalSubcampaign(null);
                              const taskId = task?.id || createdTaskId;
                              if (!isCreateMode && taskId && prevSubcampaign) {
                                // Re-link without subcampaign
                                await linkToDomain.mutateAsync({
                                  taskId,
                                  domainType: 'campaign',
                                  entityId: effectiveCampaignId,
                                });
                              }
                            }}
                            className={cn(
                              "px-2 py-1 rounded-md text-xs transition-colors",
                              !effectiveSubcampaignId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            None
                          </button>
                          {subcampaigns.map((sc) => {
                            const PlatformIcon = PLATFORM_ICONS[sc.platform];
                            const colorClass = PLATFORM_TEXT_COLORS[sc.platform];
                            const isSelected = effectiveSubcampaignId === sc.id;
                            return (
                              <button
                                key={sc.id}
                                onClick={async () => {
                                  setLocalSubcampaign(sc.id);
                                  const taskId = task?.id || createdTaskId;
                                  if (!isCreateMode && taskId) {
                                    await linkToDomain.mutateAsync({
                                      taskId,
                                      domainType: 'campaign',
                                      entityId: effectiveCampaignId,
                                      extra: { subcampaign_id: sc.id },
                                    });
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {PlatformIcon && <PlatformIcon className={cn("h-3 w-3", isSelected ? "" : colorClass)} />}
                                {PLATFORM_CONFIG[sc.platform]?.label || sc.platform}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Distribution */}
              {(visibleRelatedFields.has('distribution') || effectiveDistributionId) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Distribution</span>
                </div>

                {showDistributionSearch && !effectiveDistributionId && (
                  <div className="space-y-2">
                    <DistributionSearchCombobox
                      value={localDistribution}
                      onValueChange={async (distributionId) => {
                        if (distributionId) {
                          setLocalDistribution(distributionId);
                          setShowDistributionSearch(false);
                          const taskId = task?.id || createdTaskId;
                          if (!isCreateMode && taskId) {
                            // Use the agnostic link-domain endpoint
                            await linkToDomain.mutateAsync({
                              taskId,
                              domainType: 'distribution',
                              entityId: distributionId,
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDistributionSearch(false);
                        const newFields = new Set(visibleRelatedFields);
                        newFields.delete('distribution');
                        setVisibleRelatedFields(newFields);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Display distribution */}
                {effectiveDistributionId && selectedDistributionData && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        navigate(`/distributions/${effectiveDistributionId}`);
                        onOpenChange(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left group relative"
                    >
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {selectedDistributionData.entity?.display_name || `Distribution #${selectedDistributionData.id}`}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {selectedDistributionData.deal_status_display || selectedDistributionData.deal_status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {selectedDistributionData.deal_type_display || selectedDistributionData.deal_type}
                          </Badge>
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setLocalDistribution(null);
                          const taskId = task?.id || createdTaskId;
                          if (!isCreateMode && taskId) {
                            await unlinkFromDomain.mutateAsync({
                              taskId,
                              domainType: 'distribution',
                            });
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Existing Read-only Items */}
              {task && (task.opportunity_detail || task.contract_detail) && (
                <div className="space-y-2">
                  {task.opportunity_detail && (
                      <button
                        onClick={() => {
                          navigate(`/sales/opportunities/${task.opportunity}`);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left"
                      >
                        <span className="text-sm font-medium">Opportunity:</span>
                        <span className="text-sm">{task.opportunity_detail.title}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    )}
                    {task.contract_detail && (
                      <button
                        onClick={() => {
                          navigate(`/contracts/${task.contract}`);
                          onOpenChange(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left"
                      >
                        <span className="text-sm font-medium">Contract:</span>
                        <span className="text-sm">{task.contract_detail.title}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
            </div>

            {/* Timeline */}
            {task && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    {task.started_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Started:</span>
                        <span>{new Date(task.started_at).toLocaleString('ro-RO', {
                          timeZone: 'Europe/Bucharest',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short'
                        })}</span>
                      </div>
                    )}
                    {task.submitted_for_review_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ClipboardCheck className="h-4 w-4" />
                        <span>In Review:</span>
                        <span>{new Date(task.submitted_for_review_at).toLocaleString('ro-RO', {
                          timeZone: 'Europe/Bucharest',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short'
                        })}</span>
                      </div>
                    )}
                    {task.completed_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed:</span>
                        <span>{new Date(task.completed_at).toLocaleString('ro-RO', {
                          timeZone: 'Europe/Bucharest',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short'
                        })}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created:</span>
                      <span>{new Date(task.created_at).toLocaleString('ro-RO', {
                        timeZone: 'Europe/Bucharest',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short'
                      })}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notes - Always visible */}
            <Separator />
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Notes
              </label>
              <TaskRichTextEditor
                content={localNotes}
                onChange={setLocalNotes}
                placeholder="Add notes, meeting minutes, or additional context..."
              />
            </div>

            {/* Delete Task - Subtle link at bottom */}
            {(task || createdTaskId) && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors underline underline-offset-2"
                >
                  Delete task
                </button>
              </div>
            )}

            {/* Footer - Created By */}
            {task?.created_by_detail && (
              <div className="pt-4 text-xs text-muted-foreground border-t">
                Created by {task.created_by_detail.full_name} on{' '}
                {format(new Date(task.created_at), 'PPP')}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Artist Modal (Global Search + Quick Create) */}
      <AddEntityModal
        open={showAddArtistModal}
        onOpenChange={setShowAddArtistModal}
        onEntityAdded={async (entityId) => {
          setLocalArtist(entityId);
          setLocalEntity(entityId);
          setLocalClient(null);
          setShowArtistSearch(false);
          setShowAddArtistModal(false);
          if (!isCreateMode && (task || createdTaskId)) {
            await handleUpdateField('entity', entityId);
          }
        }}
      />

      {/* Add Client Modal (Global Search + Quick Create) */}
      <AddEntityModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onEntityAdded={async (entityId) => {
          setLocalClient(entityId);
          setLocalEntity(entityId);
          setLocalArtist(null);
          setShowClientSearch(false);
          setShowAddClientModal(false);
          if (!isCreateMode && (task || createdTaskId)) {
            await handleUpdateField('entity', entityId);
          }
        }}
      />

      {/* Quick Create Song Dialog */}
      <QuickCreateSongDialog
        open={showCreateSongDialog}
        onOpenChange={setShowCreateSongDialog}
        onSongCreated={async (song) => {
          setLocalSong(song.id);
          setShowSongSearch(false);
          setShowCreateSongDialog(false);
          if (!isCreateMode && (task || createdTaskId)) {
            await handleUpdateField('song', song.id);
          }
        }}
      />

      {/* Quick Create Campaign Dialog */}
      <QuickCreateCampaignDialog
        open={showCreateCampaignDialog}
        onOpenChange={setShowCreateCampaignDialog}
        onCampaignCreated={async (campaign) => {
          setLocalCampaign(campaign.id);
          setShowCampaignSearch(false);
          setShowCreateCampaignDialog(false);
          const taskId = task?.id || createdTaskId;
          if (!isCreateMode && taskId) {
            await linkToDomain.mutateAsync({
              taskId,
              domainType: 'campaign',
              entityId: campaign.id,
            });
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task?.title || localTitle || 'this task'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
