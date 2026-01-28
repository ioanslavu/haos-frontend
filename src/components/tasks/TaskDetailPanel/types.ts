import type { Task } from '@/api/types/tasks'

export interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  createMode?: boolean
  projectId?: number
  defaultCampaignId?: number
  defaultSubcampaignId?: number
  defaultSongId?: number
  defaultEntityId?: number
  defaultDistributionId?: number
}

export interface TaskLocalState {
  localTitle: string
  localDescription: string
  localNotes: any
  localPriority: number
  localDueDate: string | null
  localAssignees: number[]
  localTeam: number | null
  localDepartment: number | null
  localEstimatedHours: number | null
  localNeedsReview: boolean
  localEntity: number | null
  localArtist: number | null
  localClient: number | null
  localSong: number | null
  localCampaign: number | null
  localSubcampaign: number | null
  localDistribution: number | null
  localProject: number | null
}

export interface TaskUIState {
  showDeleteDialog: boolean
  showEntitySearch: boolean
  showArtistSearch: boolean
  showClientSearch: boolean
  showAddEntityModal: boolean
  showAddArtistModal: boolean
  showAddClientModal: boolean
  showSongSearch: boolean
  showCreateSongDialog: boolean
  showCampaignSearch: boolean
  showCreateCampaignDialog: boolean
  showDistributionSearch: boolean
  showAddRelatedItemMenu: boolean
  visibleRelatedFields: Set<string>
  saveState: 'idle' | 'dirty' | 'saving' | 'creating'
  showSavedIndicator: boolean
  createdTaskId: number | null
}

export interface TaskPropertiesProps {
  localPriority: number
  setLocalPriority: (value: number) => void
  localAssignees: number[]
  setLocalAssignees: (value: number[]) => void
  localTeam: number | null
  setLocalTeam: (value: number | null) => void
  localDepartment: number | null
  setLocalDepartment: (value: number | null) => void
  localDueDate: string | null
  setLocalDueDate: (value: string | null) => void
  localEstimatedHours: number | null
  setLocalEstimatedHours: (value: number | null) => void
  localNeedsReview: boolean
  setLocalNeedsReview: (value: boolean) => void
  isCreateMode: boolean
  task: Task | null
  createdTaskId: number | null
  isAdmin: boolean
  departments: { id: number; name: string }[]
  isDepartmentsLoading: boolean
  onUpdateField: (field: string, value: any) => Promise<void>
}

export interface TaskRelatedItemsProps {
  task: Task | null
  createdTaskId: number | null
  isCreateMode: boolean
  localArtist: number | null
  setLocalArtist: (value: number | null) => void
  localClient: number | null
  setLocalClient: (value: number | null) => void
  localEntity: number | null
  setLocalEntity: (value: number | null) => void
  localSong: number | null
  setLocalSong: (value: number | null) => void
  localCampaign: number | null
  setLocalCampaign: (value: number | null) => void
  localSubcampaign: number | null
  setLocalSubcampaign: (value: number | null) => void
  localDistribution: number | null
  setLocalDistribution: (value: number | null) => void
  showArtistSearch: boolean
  setShowArtistSearch: (value: boolean) => void
  showClientSearch: boolean
  setShowClientSearch: (value: boolean) => void
  showSongSearch: boolean
  setShowSongSearch: (value: boolean) => void
  showCampaignSearch: boolean
  setShowCampaignSearch: (value: boolean) => void
  showDistributionSearch: boolean
  setShowDistributionSearch: (value: boolean) => void
  showAddRelatedItemMenu: boolean
  setShowAddRelatedItemMenu: (value: boolean) => void
  visibleRelatedFields: Set<string>
  setVisibleRelatedFields: (value: Set<string>) => void
  setShowAddArtistModal: (value: boolean) => void
  setShowAddClientModal: (value: boolean) => void
  setShowCreateSongDialog: (value: boolean) => void
  setShowCreateCampaignDialog: (value: boolean) => void
  onUpdateField: (field: string, value: any) => Promise<void>
  onOpenChange: (open: boolean) => void
}

export interface TaskTimelineProps {
  task: Task
}

export interface TaskDialogsProps {
  task: Task | null
  localTitle: string
  showDeleteDialog: boolean
  setShowDeleteDialog: (value: boolean) => void
  showAddArtistModal: boolean
  setShowAddArtistModal: (value: boolean) => void
  showAddClientModal: boolean
  setShowAddClientModal: (value: boolean) => void
  showCreateSongDialog: boolean
  setShowCreateSongDialog: (value: boolean) => void
  showCreateCampaignDialog: boolean
  setShowCreateCampaignDialog: (value: boolean) => void
  isCreateMode: boolean
  createdTaskId: number | null
  onDelete: () => Promise<void>
  onArtistAdded: (entityId: number) => Promise<void>
  onClientAdded: (entityId: number) => Promise<void>
  onSongCreated: (song: any) => Promise<void>
  onCampaignCreated: (campaign: any) => Promise<void>
}
