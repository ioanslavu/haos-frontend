/**
 * Custom hook for OpportunityDetail state and logic
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  useOpportunity,
  useUpdateOpportunity,
  useMarkWon,
  useMarkLost,
  useOpportunityActivities,
  useDeleteOpportunity,
} from '@/api/hooks/useOpportunities'
import {
  STAGE_CONFIG,
  TERMINAL_STAGES,
  type OpportunityStage,
} from '@/types/opportunities'

// Stage flow for opportunity pipeline
export const STAGE_FLOW: OpportunityStage[] = [
  'brief',
  'qualified',
  'shortlist',
  'proposal_draft',
  'proposal_sent',
  'negotiation',
  'contract_prep',
  'contract_sent',
  'won',
  'executing',
]

export function useOpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const opportunityId = parseInt(id || '0')

  // UI State
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStageConfirm, setShowStageConfirm] = useState<OpportunityStage | null>(null)

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Date picker state
  const [expectedCloseDateOpen, setExpectedCloseDateOpen] = useState(false)
  const [campaignStartDateOpen, setCampaignStartDateOpen] = useState(false)
  const [campaignEndDateOpen, setCampaignEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)

  // Inline add form state
  const [showAddArtist, setShowAddArtist] = useState(false)
  const [showAddDeliverable, setShowAddDeliverable] = useState(false)

  // Expanded card state
  const [expandedArtistIds, setExpandedArtistIds] = useState<Set<number>>(new Set())
  const [expandedDeliverableIds, setExpandedDeliverableIds] = useState<Set<number>>(new Set())

  // Fetch data
  const { data: opportunity, isLoading } = useOpportunity(opportunityId)
  const { data: activities = [] } = useOpportunityActivities(opportunityId)

  // Mutations
  const updateOpportunity = useUpdateOpportunity()
  const markWonMutation = useMarkWon()
  const markLostMutation = useMarkLost()
  const deleteOpportunity = useDeleteOpportunity()

  // Derived state
  const isTerminalStage = opportunity ? TERMINAL_STAGES.includes(opportunity.stage) : false
  const currentStageIndex = opportunity ? STAGE_FLOW.indexOf(opportunity.stage) : -1

  // Check if can transition to a stage
  const canTransitionTo = (stage: OpportunityStage) => {
    if (isTerminalStage) return false
    const targetIndex = STAGE_FLOW.indexOf(stage)
    return targetIndex <= currentStageIndex + 1 && targetIndex >= 0
  }

  // Toggle expand handlers
  const toggleArtistExpanded = (artistId: number) => {
    setExpandedArtistIds((prev) => {
      const next = new Set(prev)
      if (next.has(artistId)) {
        next.delete(artistId)
      } else {
        next.add(artistId)
      }
      return next
    })
  }

  const toggleDeliverableExpanded = (deliverableId: number) => {
    setExpandedDeliverableIds((prev) => {
      const next = new Set(prev)
      if (next.has(deliverableId)) {
        next.delete(deliverableId)
      } else {
        next.add(deliverableId)
      }
      return next
    })
  }

  // Handlers
  const handleStageChange = async (newStage: OpportunityStage) => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { stage: newStage },
      })
      setShowStageConfirm(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleFieldSave = async (field: string, value: string | number) => {
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { [field]: value },
      })
      setEditingField(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleSaveExpectedCloseDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { expected_close_date: format(date, 'yyyy-MM-dd') },
      })
      setExpectedCloseDateOpen(false)
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleSaveCampaignStartDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { campaign_start_date: format(date, 'yyyy-MM-dd') },
      })
      setCampaignStartDateOpen(false)
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleSaveCampaignEndDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        data: { campaign_end_date: format(date, 'yyyy-MM-dd') },
      })
      setCampaignEndDateOpen(false)
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleMarkWon = async () => {
    if (confirm('Mark this opportunity as Won?')) {
      await markWonMutation.mutateAsync(opportunityId)
    }
  }

  const handleMarkLost = async () => {
    const reason = prompt('Why was this opportunity lost?')
    if (reason) {
      await markLostMutation.mutateAsync({
        id: opportunityId,
        data: { lost_reason: reason },
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOpportunity.mutateAsync(opportunityId)
      setShowDeleteConfirm(false)
      navigate('/opportunities')
    } catch {
      setShowDeleteConfirm(false)
    }
  }

  const handleSaveNotes = async (notes: string) => {
    await updateOpportunity.mutateAsync({
      id: opportunityId,
      data: { notes },
    })
  }

  return {
    // IDs
    id,
    opportunityId,

    // Data
    opportunity,
    isLoading,
    activities,
    isTerminalStage,
    currentStageIndex,

    // UI State
    activeTab,
    setActiveTab,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showStageConfirm,
    setShowStageConfirm,

    // Inline editing
    editingField,
    setEditingField,
    editValue,
    setEditValue,

    // Date pickers
    expectedCloseDateOpen,
    setExpectedCloseDateOpen,
    campaignStartDateOpen,
    setCampaignStartDateOpen,
    campaignEndDateOpen,
    setCampaignEndDateOpen,
    isSavingDates,

    // Add forms
    showAddArtist,
    setShowAddArtist,
    showAddDeliverable,
    setShowAddDeliverable,

    // Expanded cards
    expandedArtistIds,
    setExpandedArtistIds,
    expandedDeliverableIds,
    setExpandedDeliverableIds,

    // Mutations
    updateOpportunity,
    deleteOpportunity,

    // Helpers
    canTransitionTo,
    toggleArtistExpanded,
    toggleDeliverableExpanded,

    // Handlers
    navigate,
    handleStageChange,
    handleFieldSave,
    handleSaveExpectedCloseDate,
    handleSaveCampaignStartDate,
    handleSaveCampaignEndDate,
    handleMarkWon,
    handleMarkLost,
    handleDelete,
    handleSaveNotes,
  }
}
