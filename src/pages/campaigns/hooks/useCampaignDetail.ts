/**
 * useCampaignDetail - Custom hook for campaign detail page data management
 *
 * Consolidates all data fetching, mutations, and shared state for the campaign detail page.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  useCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useUpdateCampaignStatus,
  useReopenCampaign,
  useCampaignHistory,
  useCampaignFinancials,
  useCampaignContracts,
  useSendContractForSignature,
  useContractValidation,
  useRefreshSignatureStatus,
  useAllCampaignInvoices,
} from '@/api/hooks/useCampaigns'
import { useEntity, useCreateContactPerson } from '@/api/hooks/useEntities'
import { useClientProfileByEntity } from '@/api/hooks/useClientProfiles'
import { useRefreshContractGeneration } from '@/api/hooks/useContracts'
import type { CampaignStatus } from '@/types/campaign'
import { STATUS_FLOW } from '@/types/campaign'
import type { ContactPerson, CampaignContract, Signer } from '../types'

export function useCampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const campaignId = parseInt(id || '0')

  // UI State
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddSubCampaign, setShowAddSubCampaign] = useState(false)
  const [showGenerateContract, setShowGenerateContract] = useState(false)
  const [showGenerateReport, setShowGenerateReport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState<CampaignStatus | null>(null)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)
  const [isSavingContactPerson, setIsSavingContactPerson] = useState(false)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [editingContactPerson, setEditingContactPerson] = useState<ContactPerson | null>(null)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  // Signature dialog state
  const [sendSignatureContract, setSendSignatureContract] = useState<CampaignContract | null>(null)
  const [signers, setSigners] = useState<Signer[]>([])
  const [testMode, setTestMode] = useState(true)

  // Contract detail sheet state
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  // Expanded platform invoices state
  const [expandedPlatformId, setExpandedPlatformId] = useState<number | null>(null)

  // Safety cleanup: Remove pointer-events: none from body when dialogs close
  useEffect(() => {
    const allDialogsClosed = !showDeleteConfirm && !showStatusConfirm && !sendSignatureContract && !showGenerateContract && !showGenerateReport
    if (allDialogsClosed) {
      document.body.style.pointerEvents = ''
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = ''
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showDeleteConfirm, showStatusConfirm, sendSignatureContract, showGenerateContract, showGenerateReport])

  // Data fetching
  const { data: campaign, isLoading, error } = useCampaign(campaignId)
  const { data: history } = useCampaignHistory(campaignId)
  const { data: financials } = useCampaignFinancials(campaignId)
  const { data: contracts } = useCampaignContracts(campaignId)

  // Fetch validation data for signers when dialog opens
  const { data: validation, isLoading: validationLoading, refetch: refetchValidation } = useContractValidation(
    campaignId,
    !!sendSignatureContract
  )

  // Auto-populate signers when validation data loads
  useEffect(() => {
    if (validation?.signers && sendSignatureContract) {
      const initialSigners: Signer[] = []

      if (validation.signers.hahaha_rep?.email && validation.signers.hahaha_rep?.name) {
        initialSigners.push({
          email: validation.signers.hahaha_rep.email,
          name: validation.signers.hahaha_rep.name,
          role: validation.signers.hahaha_rep.role || 'HaHaHa Production',
        })
      }

      if (validation.signers.client) {
        initialSigners.push({
          email: validation.signers.client.email || '',
          name: validation.signers.client.name || '',
          role: validation.signers.client.role || 'Client',
        })
      }

      if (initialSigners.length > 0) {
        setSigners(initialSigners)
      }
    }
  }, [validation?.signers, sendSignatureContract])

  // Invoice data
  const subcampaignIds = campaign?.subcampaigns?.map(sc => sc.id) || []
  const invoiceData = useAllCampaignInvoices(campaignId, subcampaignIds, !!campaign)

  // Client data
  const { data: clientEntity } = useEntity(campaign?.client?.id || 0, !!campaign?.client?.id)
  const contactPersons = clientEntity?.contact_persons || []
  const { data: clientProfile } = useClientProfileByEntity(campaign?.client?.id)

  // Mutations
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()
  const updateStatus = useUpdateCampaignStatus()
  const reopenCampaign = useReopenCampaign()
  const sendForSignature = useSendContractForSignature()
  const refreshSignatureStatus = useRefreshSignatureStatus()
  const refreshContractGeneration = useRefreshContractGeneration()
  const createContactPerson = useCreateContactPerson()

  // Computed values
  const totalBudget = parseFloat(campaign?.total_budget || '0')
  const totalSpent = parseFloat(campaign?.total_spent || '0')
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const currentStatusIndex = STATUS_FLOW.indexOf(campaign?.status || 'lead')
  const isTerminalStatus = campaign?.status === 'completed' || campaign?.status === 'lost' || campaign?.status === 'cancelled'

  const canTransitionTo = useCallback((status: CampaignStatus) => {
    if (!campaign || isTerminalStatus) return false
    const targetIndex = STATUS_FLOW.indexOf(status)
    return targetIndex <= currentStatusIndex + 1 && targetIndex >= 0
  }, [campaign, isTerminalStatus, currentStatusIndex])

  // Handlers
  const handleStatusChange = async (newStatus: CampaignStatus) => {
    try {
      await updateStatus.mutateAsync({
        id: campaignId,
        status: newStatus,
      })
    } catch {
      // Error handled by mutation
    } finally {
      setShowStatusConfirm(null)
    }
  }

  const handleSaveStartDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { start_date: format(date, 'yyyy-MM-dd') },
      })
      setStartDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleSaveEndDate = async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { end_date: format(date, 'yyyy-MM-dd') },
      })
      setEndDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleClearEndDate = async () => {
    setIsSavingDates(true)
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { end_date: null },
      })
      setEndDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }

  const handleChangeContactPerson = async (contactPersonId: string) => {
    setIsSavingContactPerson(true)
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { contact_person: contactPersonId === 'none' ? null : parseInt(contactPersonId) },
      })
      await queryClient.refetchQueries({ queryKey: ['campaigns', 'detail', campaignId] })
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingContactPerson(false)
    }
  }

  const handleCreateContactPerson = async () => {
    if (!newContactName.trim() || !campaign?.client?.id) return

    try {
      const newContact = await createContactPerson.mutateAsync({
        entity: campaign.client.id,
        name: newContactName.trim(),
        emails: newContactEmail.trim() ? [{ email: newContactEmail.trim(), is_primary: true }] : [],
        phones: newContactPhone.trim() ? [{ phone: newContactPhone.trim(), is_primary: true }] : [],
      })
      await updateCampaign.mutateAsync({
        id: campaignId,
        data: { contact_person: newContact.id },
      })
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['campaigns', 'detail', campaignId] }),
        queryClient.refetchQueries({ queryKey: ['entities', 'detail', campaign.client.id] }),
      ])
      setShowCreateContact(false)
      setNewContactName('')
      setNewContactEmail('')
      setNewContactPhone('')
    } catch {
      // Error handled by mutation
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(campaignId)
      setShowDeleteConfirm(false)
      navigate('/campaigns')
    } catch {
      setShowDeleteConfirm(false)
    }
  }

  const handleSendForSignature = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sendSignatureContract) return

    const invalidSigners = signers.filter(s => !s.email || !s.name)
    if (invalidSigners.length > 0) {
      alert('Please fill in email and name for all signers.')
      return
    }

    try {
      await sendForSignature.mutateAsync({
        campaignId,
        linkId: sendSignatureContract.id,
        data: {
          signers,
          test_mode: testMode,
        },
      })
      setSendSignatureContract(null)
    } catch {
      // Error handled by mutation
    }
  }

  const handleRefreshSignatureStatus = (contractId: number) => {
    refreshSignatureStatus.mutate({
      campaignId,
      contractId,
    })
  }

  const handleRefreshContractGeneration = (contractId: number) => {
    refreshContractGeneration.mutate(contractId)
  }

  const handleReopenCampaign = () => {
    reopenCampaign.mutate(campaignId)
  }

  const handleUpdateNotes = async (notes: string) => {
    await updateCampaign.mutateAsync({
      id: campaignId,
      data: { notes },
    })
  }

  const resetContactForm = () => {
    setShowCreateContact(false)
    setNewContactName('')
    setNewContactEmail('')
    setNewContactPhone('')
  }

  return {
    // IDs
    campaignId,

    // Navigation
    navigate,
    queryClient,

    // Data
    campaign,
    history,
    financials,
    contracts,
    invoiceData,
    clientEntity,
    contactPersons,
    clientProfile,
    validation,
    validationLoading,

    // Loading states
    isLoading,
    error,

    // Computed
    totalBudget,
    totalSpent,
    utilization,
    currentStatusIndex,
    isTerminalStatus,
    canTransitionTo,

    // UI State
    activeTab,
    setActiveTab,
    showAddSubCampaign,
    setShowAddSubCampaign,
    showGenerateContract,
    setShowGenerateContract,
    showGenerateReport,
    setShowGenerateReport,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showStatusConfirm,
    setShowStatusConfirm,
    startDateOpen,
    setStartDateOpen,
    endDateOpen,
    setEndDateOpen,
    isSavingDates,
    isSavingContactPerson,
    showCreateContact,
    setShowCreateContact,
    editingContactPerson,
    setEditingContactPerson,
    newContactName,
    setNewContactName,
    newContactEmail,
    setNewContactEmail,
    newContactPhone,
    setNewContactPhone,
    sendSignatureContract,
    setSendSignatureContract,
    signers,
    setSigners,
    testMode,
    setTestMode,
    selectedContractId,
    setSelectedContractId,
    expandedPlatformId,
    setExpandedPlatformId,

    // Mutations / Loading states
    updateCampaign,
    deleteCampaign,
    updateStatus,
    reopenCampaign,
    sendForSignature,
    refreshSignatureStatus,
    refreshContractGeneration,
    createContactPerson,

    // Handlers
    handleStatusChange,
    handleSaveStartDate,
    handleSaveEndDate,
    handleClearEndDate,
    handleChangeContactPerson,
    handleCreateContactPerson,
    handleDelete,
    handleSendForSignature,
    handleRefreshSignatureStatus,
    handleRefreshContractGeneration,
    handleReopenCampaign,
    handleUpdateNotes,
    resetContactForm,
  }
}

export type UseCampaignDetailReturn = ReturnType<typeof useCampaignDetail>
