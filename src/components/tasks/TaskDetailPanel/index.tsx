import { useEffect, useState, useRef } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { FileText } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDeleteTask, useUpdateTask, useCreateTask, useLinkTaskToDomain } from '@/api/hooks/useTasks'
import { useDepartments } from '@/api/hooks/useDepartments'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { handleApiError } from '@/lib/error-handler'
import { TaskRichTextEditor } from '@/components/tasks/TaskRichTextEditor'
import { InlineCustomFieldsManager, InlineCustomFieldsManagerHandle } from '@/components/tasks/InlineCustomFieldsManager'
import { TaskHeader } from './TaskHeader'
import { TaskProperties } from './TaskProperties'
import { TaskRelatedItems } from './TaskRelatedItems'
import { TaskTimeline } from './TaskTimeline'
import { TaskDialogs } from './TaskDialogs'
import type { TaskDetailPanelProps } from './types'

export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
  createMode = false,
  projectId,
  defaultCampaignId,
  defaultSubcampaignId,
  defaultSongId,
  defaultEntityId,
  defaultDistributionId,
}: TaskDetailPanelProps) {
  // UI State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showArtistSearch, setShowArtistSearch] = useState(false)
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [showAddArtistModal, setShowAddArtistModal] = useState(false)
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [showSongSearch, setShowSongSearch] = useState(false)
  const [showCreateSongDialog, setShowCreateSongDialog] = useState(false)
  const [showCampaignSearch, setShowCampaignSearch] = useState(false)
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false)
  const [showDistributionSearch, setShowDistributionSearch] = useState(false)
  const [showAddRelatedItemMenu, setShowAddRelatedItemMenu] = useState(false)
  const [visibleRelatedFields, setVisibleRelatedFields] = useState<Set<string>>(new Set())
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'creating'>('idle')
  const [createdTaskId, setCreatedTaskId] = useState<number | null>(null)

  // Local state
  const [localTitle, setLocalTitle] = useState('')
  const [localDescription, setLocalDescription] = useState('')
  const [localNotes, setLocalNotes] = useState<any>(null)
  const [localPriority, setLocalPriority] = useState<number>(2)
  const [localDueDate, setLocalDueDate] = useState<string | null>(null)
  const [localAssignees, setLocalAssignees] = useState<number[]>([])
  const [localTeam, setLocalTeam] = useState<number | null>(null)
  const [localDepartment, setLocalDepartment] = useState<number | null>(null)
  const [localEstimatedHours, setLocalEstimatedHours] = useState<number | null>(null)
  const [localNeedsReview, setLocalNeedsReview] = useState<boolean>(false)
  const [localEntity, setLocalEntity] = useState<number | null>(null)
  const [localArtist, setLocalArtist] = useState<number | null>(null)
  const [localClient, setLocalClient] = useState<number | null>(null)
  const [localSong, setLocalSong] = useState<number | null>(null)
  const [localCampaign, setLocalCampaign] = useState<number | null>(null)
  const [localSubcampaign, setLocalSubcampaign] = useState<number | null>(null)
  const [localDistribution, setLocalDistribution] = useState<number | null>(null)
  const [localProject, setLocalProject] = useState<number | null>(projectId || null)

  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const customFieldsRef = useRef<InlineCustomFieldsManagerHandle>(null)
  const isCreateMode = createMode && !task && !createdTaskId

  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()
  const linkToDomain = useLinkTaskToDomain()

  const { user, isAdmin: isAdminFn } = useAuthStore()
  const isAdmin = isAdminFn()

  const { data: departmentsData, isLoading: isDepartmentsLoading } = useDepartments(isAdmin ? {} : undefined)

  const departments = departmentsData
    ? (Array.isArray(departmentsData) ? departmentsData : departmentsData.results || []).map((d: any) => ({ id: d.id, name: d.name }))
    : []

  // Focus title input in create mode
  useEffect(() => {
    if (open && isCreateMode && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100)
    }
  }, [open, isCreateMode])

  // Initialize local state
  useEffect(() => {
    if (!open) return
    if (task) {
      setLocalTitle(task.title || '')
      setLocalDescription(task.description || '')
      setLocalNotes(task.notes || null)
      setLocalPriority(task.priority || 2)
      setLocalDueDate(task.due_date || null)
      setLocalAssignees(task.assigned_to_users_detail?.map(u => u.id) || [])
      setLocalTeam(task.assigned_team || null)
      setLocalDepartment(task.department || null)
      setLocalEstimatedHours(task.estimated_hours || null)
      setLocalNeedsReview(task.needs_review || false)
      setLocalEntity(task.entity || null)
      if (task.entity && task.entity_detail) {
        if (task.entity_detail.classification === 'CREATIVE') { setLocalArtist(task.entity); setLocalClient(null) }
        else if (task.entity_detail.classification === 'CLIENT') { setLocalClient(task.entity); setLocalArtist(null) }
      } else { setLocalArtist(null); setLocalClient(null) }
      setShowArtistSearch(false); setShowClientSearch(false)
      setLocalSong(task.song || null); setShowSongSearch(false)
      const campaignId = task.domain_info?.domain_type === 'campaign' ? task.domain_info.entity_id : (task.campaign || null)
      setLocalCampaign(campaignId); setShowCampaignSearch(false)
      const distributionId = task.domain_info?.domain_type === 'distribution' ? task.domain_info.entity_id : null
      setLocalDistribution(distributionId); setShowDistributionSearch(false)
      const fieldsToShow = new Set<string>()
      if (task.entity) {
        if (task.entity_detail?.classification === 'CREATIVE') fieldsToShow.add('artist')
        if (task.entity_detail?.classification === 'CLIENT') fieldsToShow.add('client')
      }
      if (task.song) fieldsToShow.add('song')
      if (task.domain_info?.domain_type === 'campaign' || task.campaign) fieldsToShow.add('campaign')
      if (task.domain_info?.domain_type === 'distribution') fieldsToShow.add('distribution')
      setVisibleRelatedFields(fieldsToShow)
      setSaveState('idle'); setCreatedTaskId(null)
    } else if (createMode) {
      setLocalTitle(''); setLocalDescription(''); setLocalNotes('')
      setLocalPriority(2); setLocalDueDate(null)
      setLocalAssignees(user?.id ? [Number(user.id)] : [])
      setLocalTeam(null); setLocalDepartment(null); setLocalEstimatedHours(null); setLocalNeedsReview(false)
      setLocalEntity(defaultEntityId || null); setLocalArtist(null); setLocalClient(null)
      setShowArtistSearch(false); setShowClientSearch(false)
      setLocalSong(defaultSongId || null); setShowSongSearch(false)
      setLocalCampaign(defaultCampaignId || null); setLocalSubcampaign(defaultSubcampaignId || null)
      setLocalDistribution(defaultDistributionId || null)
      setShowCampaignSearch(false); setShowDistributionSearch(false)
      const defaultFields = new Set<string>()
      if (defaultCampaignId) defaultFields.add('campaign')
      if (defaultSongId) defaultFields.add('song')
      if (defaultEntityId) defaultFields.add('entity')
      if (defaultDistributionId) defaultFields.add('distribution')
      setVisibleRelatedFields(defaultFields)
      setSaveState('idle'); setCreatedTaskId(null)
    }
  }, [task, open, createMode, user, defaultCampaignId, defaultSubcampaignId, defaultSongId, defaultEntityId, defaultDistributionId])

  // Auto-save with debounce
  useEffect(() => {
    if (!open || !localTitle.trim()) return
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    const needsCreate = isCreateMode && !createdTaskId
    const needsUpdate = (task || createdTaskId) && (localTitle !== (task?.title || '') || localDescription !== (task?.description || '') || localNotes !== (task?.notes || '') || localPriority !== (task?.priority || 2) || localDueDate !== (task?.due_date || null) || localDepartment !== (task?.department || null) || JSON.stringify(localAssignees) !== JSON.stringify(task?.assigned_to_users_detail?.map(u => u.id) || []))
    if (needsCreate || needsUpdate) {
      setSaveState(needsCreate ? 'creating' : 'dirty')
      debounceTimerRef.current = setTimeout(async () => {
        try {
          if (needsCreate) {
            setSaveState('creating')
            const newTask = await createTask.mutateAsync({ title: localTitle, description: localDescription || undefined, notes: localNotes || undefined, status: 'todo', priority: localPriority, due_date: localDueDate || undefined, assigned_user_ids: localAssignees.length > 0 ? localAssignees : undefined, department: localDepartment || undefined, project: localProject || projectId || undefined, needs_review: localNeedsReview })
            setCreatedTaskId(newTask.id)
            if (localCampaign) { try { await linkToDomain.mutateAsync({ taskId: newTask.id, domainType: 'campaign', entityId: localCampaign, extra: localSubcampaign ? { subcampaign_id: localSubcampaign } : undefined }) } catch { console.error('Failed to link task to campaign') } }
            if (localDistribution) { try { await linkToDomain.mutateAsync({ taskId: newTask.id, domainType: 'distribution', entityId: localDistribution }) } catch { console.error('Failed to link task to distribution') } }
            setSaveState('idle'); toast.success('Task created')
          } else {
            setSaveState('saving')
            const taskId = task?.id || createdTaskId!
            await updateTask.mutateAsync({ id: taskId, data: { title: localTitle, description: localDescription || undefined, notes: localNotes || undefined, priority: localPriority, due_date: localDueDate || undefined, assigned_user_ids: localAssignees.length > 0 ? localAssignees : undefined, department: localDepartment || undefined } })
            setSaveState('idle')
          }
        } catch { setSaveState('idle'); toast.error(needsCreate ? 'Failed to create task' : 'Failed to save changes') }
      }, 1000)
    }
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [localTitle, localDescription, localNotes, localPriority, localDueDate, localDepartment, localAssignees, task, createdTaskId, open, isCreateMode, projectId, localProject, localCampaign, localDistribution, localSubcampaign, localNeedsReview])

  const handleClose = async (newOpen?: boolean) => {
    if (newOpen === true) { onOpenChange(true); return }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await new Promise(resolve => setTimeout(resolve, 50))
    if (customFieldsRef.current?.hasPendingChanges()) await customFieldsRef.current.flushPendingChanges()
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      if (isCreateMode && localTitle.trim() && !createdTaskId) {
        createTask.mutate({ title: localTitle, description: localDescription || undefined, notes: localNotes || undefined, priority: localPriority, due_date: localDueDate || undefined, assigned_to_users: localAssignees.length > 0 ? localAssignees : undefined, department: localDepartment || undefined, estimated_hours: localEstimatedHours || undefined, entity: localEntity || undefined, song: localSong || undefined, project: localProject || projectId || undefined, needs_review: localNeedsReview }, { onSuccess: async (response) => { setCreatedTaskId(response.id); if (localCampaign) { try { await linkToDomain.mutateAsync({ taskId: response.id, domainType: 'campaign', entityId: localCampaign }) } catch { console.error('Failed to link task to campaign') } } }, onSettled: () => onOpenChange(false) })
        return
      }
      const taskId = task?.id || createdTaskId
      if (taskId && localTitle.trim()) {
        updateTask.mutate({ id: taskId, data: { title: localTitle, description: localDescription || '', notes: localNotes || null, priority: localPriority, due_date: localDueDate || null, assigned_user_ids: localAssignees, department: localDepartment || null, estimated_hours: localEstimatedHours || null } }, { onSettled: () => onOpenChange(false) })
        return
      }
    }
    onOpenChange(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showDeleteDialog && (task || createdTaskId)) handleClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && (task || createdTaskId)) { e.preventDefault(); setShowDeleteDialog(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, showDeleteDialog, task, createdTaskId])

  if (!open || (!createMode && !task)) return null

  const handleUpdateField = async (field: string, value: any) => {
    if (!task && !createdTaskId) { toast.error('Please enter a title first'); return }
    try {
      const taskId = task?.id || createdTaskId!
      await updateTask.mutateAsync({ id: taskId, data: { [field]: value } })
      toast.success('Updated successfully')
    } catch (error) {
      handleApiError(error, { context: 'updating task', showToast: true })
      throw error
    }
  }

  const handleDelete = async () => {
    const taskId = task?.id || createdTaskId
    if (!taskId) return
    try {
      await deleteTask.mutateAsync(taskId)
      toast.success('Task deleted')
      setShowDeleteDialog(false)
      onOpenChange(false)
    } catch { toast.error('Failed to delete task') }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className={cn('w-full sm:max-w-2xl overflow-y-auto p-0', 'animate-in slide-in-from-right duration-300 ease-out')}>
          <div className="px-6 py-6 space-y-6">
            <TaskHeader ref={titleInputRef} localTitle={localTitle} setLocalTitle={setLocalTitle} localDescription={localDescription} setLocalDescription={setLocalDescription} isCreateMode={isCreateMode} />
            <Separator />
            <TaskProperties localPriority={localPriority} setLocalPriority={setLocalPriority} localAssignees={localAssignees} setLocalAssignees={setLocalAssignees} localTeam={localTeam} setLocalTeam={setLocalTeam} localDepartment={localDepartment} setLocalDepartment={setLocalDepartment} localDueDate={localDueDate} setLocalDueDate={setLocalDueDate} localEstimatedHours={localEstimatedHours} setLocalEstimatedHours={setLocalEstimatedHours} localNeedsReview={localNeedsReview} setLocalNeedsReview={setLocalNeedsReview} isCreateMode={isCreateMode} task={task} createdTaskId={createdTaskId} isAdmin={isAdmin} departments={departments} isDepartmentsLoading={isDepartmentsLoading} onUpdateField={handleUpdateField} />
            {(task?.id || createdTaskId) && (task?.project || localProject) && (<InlineCustomFieldsManager ref={customFieldsRef} taskId={task?.id || createdTaskId!} projectId={task?.project || localProject!} />)}
            <Separator />
            <TaskRelatedItems task={task} createdTaskId={createdTaskId} isCreateMode={isCreateMode} localArtist={localArtist} setLocalArtist={setLocalArtist} localClient={localClient} setLocalClient={setLocalClient} localEntity={localEntity} setLocalEntity={setLocalEntity} localSong={localSong} setLocalSong={setLocalSong} localCampaign={localCampaign} setLocalCampaign={setLocalCampaign} localSubcampaign={localSubcampaign} setLocalSubcampaign={setLocalSubcampaign} localDistribution={localDistribution} setLocalDistribution={setLocalDistribution} showArtistSearch={showArtistSearch} setShowArtistSearch={setShowArtistSearch} showClientSearch={showClientSearch} setShowClientSearch={setShowClientSearch} showSongSearch={showSongSearch} setShowSongSearch={setShowSongSearch} showCampaignSearch={showCampaignSearch} setShowCampaignSearch={setShowCampaignSearch} showDistributionSearch={showDistributionSearch} setShowDistributionSearch={setShowDistributionSearch} showAddRelatedItemMenu={showAddRelatedItemMenu} setShowAddRelatedItemMenu={setShowAddRelatedItemMenu} visibleRelatedFields={visibleRelatedFields} setVisibleRelatedFields={setVisibleRelatedFields} setShowAddArtistModal={setShowAddArtistModal} setShowAddClientModal={setShowAddClientModal} setShowCreateSongDialog={setShowCreateSongDialog} setShowCreateCampaignDialog={setShowCreateCampaignDialog} onUpdateField={handleUpdateField} onOpenChange={onOpenChange} />
            {task && (<><Separator /><TaskTimeline task={task} /></>)}
            <Separator />
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2"><FileText className="h-3 w-3" />Notes</label>
              <TaskRichTextEditor content={localNotes} onChange={setLocalNotes} placeholder="Add notes, meeting minutes, or additional context..." />
            </div>
            {(task || createdTaskId) && (<div className="flex justify-center pt-2"><button onClick={() => setShowDeleteDialog(true)} className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors underline underline-offset-2">Delete task</button></div>)}
            {task?.created_by_detail && (<div className="pt-4 text-xs text-muted-foreground border-t">Created by {task.created_by_detail.full_name} on {format(new Date(task.created_at), 'PPP')}</div>)}
          </div>
        </SheetContent>
      </Sheet>
      <TaskDialogs task={task} localTitle={localTitle} showDeleteDialog={showDeleteDialog} setShowDeleteDialog={setShowDeleteDialog} showAddArtistModal={showAddArtistModal} setShowAddArtistModal={setShowAddArtistModal} showAddClientModal={showAddClientModal} setShowAddClientModal={setShowAddClientModal} showCreateSongDialog={showCreateSongDialog} setShowCreateSongDialog={setShowCreateSongDialog} showCreateCampaignDialog={showCreateCampaignDialog} setShowCreateCampaignDialog={setShowCreateCampaignDialog} isCreateMode={isCreateMode} createdTaskId={createdTaskId} onDelete={handleDelete} onArtistAdded={async (entityId) => { setLocalArtist(entityId); setLocalEntity(entityId); setLocalClient(null); setShowArtistSearch(false); setShowAddArtistModal(false); if (!isCreateMode && (task || createdTaskId)) await handleUpdateField('entity', entityId) }} onClientAdded={async (entityId) => { setLocalClient(entityId); setLocalEntity(entityId); setLocalArtist(null); setShowClientSearch(false); setShowAddClientModal(false); if (!isCreateMode && (task || createdTaskId)) await handleUpdateField('entity', entityId) }} onSongCreated={async (song) => { setLocalSong(song.id); setShowSongSearch(false); setShowCreateSongDialog(false); if (!isCreateMode && (task || createdTaskId)) await handleUpdateField('song', song.id) }} onCampaignCreated={async (campaign) => { setLocalCampaign(campaign.id); setShowCampaignSearch(false); setShowCreateCampaignDialog(false); const taskId = task?.id || createdTaskId; if (!isCreateMode && taskId) await linkToDomain.mutateAsync({ taskId, domainType: 'campaign', entityId: campaign.id }) }} />
    </>
  )
}

export default TaskDetailPanel
