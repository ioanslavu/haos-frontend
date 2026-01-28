/**
 * Custom hook for DistributionDetailPage state and logic
 */

import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  useDistribution,
  useDeleteDistribution,
  useRemoveCatalogItem,
  useRemoveSong,
  useUpdateDistributionStatus,
  useUpdateDistribution,
} from '@/api/hooks/useDistributions'
import { useEntity, useCreateContactPerson } from '@/api/hooks/useEntities'
import type { DealStatus, DealType, Platform } from '@/types/distribution'

export function useDistributionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // UI State
  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddSongInline, setShowAddSongInline] = useState(false)
  const [showAddRevenueDialog, setShowAddRevenueDialog] = useState(false)
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<number | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [expandedSongIds, setExpandedSongIds] = useState<Set<number>>(new Set())
  const [songsViewMode, setSongsViewMode] = useState<'cards' | 'table'>('cards')

  // Inline editing states
  const [signingDateOpen, setSigningDateOpen] = useState(false)
  const [isSavingField, setIsSavingField] = useState<string | null>(null)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  // Data fetching
  const { data: distribution, isLoading, error } = useDistribution(Number(id))
  const deleteDistribution = useDeleteDistribution()
  const removeCatalogItem = useRemoveCatalogItem()
  const removeSong = useRemoveSong()
  const updateStatus = useUpdateDistributionStatus()
  const updateDistribution = useUpdateDistribution()

  // Fetch entity for contact persons
  const { data: clientEntity } = useEntity(distribution?.entity?.id || 0, !!distribution?.entity?.id)
  const createContactPerson = useCreateContactPerson()
  const contactPersons = clientEntity?.contact_persons || []

  // Handlers
  const handleDelete = async () => {
    if (!id) return
    await deleteDistribution.mutateAsync(Number(id))
    navigate('/distributions')
  }

  const handleRemoveCatalogItem = async (catalogItemId: number) => {
    if (!id) return
    await removeCatalogItem.mutateAsync({
      distributionId: Number(id),
      catalogItemId,
    })
  }

  const handleRemoveSong = async (songId: number) => {
    if (!id) return
    await removeSong.mutateAsync({
      distributionId: Number(id),
      songId,
    })
  }

  const handleStatusChange = async (newStatus: DealStatus) => {
    if (!id) return
    await updateStatus.mutateAsync({ id: Number(id), status: newStatus })
  }

  // Inline field update handlers
  const handleSaveSigningDate = async (date: Date | undefined) => {
    if (!id || !date) return
    setIsSavingField('signing_date')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { signing_date: format(date, 'yyyy-MM-dd') },
      })
      setSigningDateOpen(false)
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveDealType = async (dealType: DealType) => {
    if (!id) return
    setIsSavingField('deal_type')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { deal_type: dealType },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveIncludesDsps = async (checked: boolean) => {
    if (!id) return
    setIsSavingField('includes_dsps')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { includes_dsps: checked },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveIncludesYoutube = async (checked: boolean) => {
    if (!id) return
    setIsSavingField('includes_youtube')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { includes_youtube: checked },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveRevenueShare = async (value: string) => {
    if (!id) return
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return
    setIsSavingField('revenue_share')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { global_revenue_share_percentage: value },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleChangeContactPerson = async (contactPersonId: string) => {
    if (!id) return
    setIsSavingField('contact_person')
    try {
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { contact_person: contactPersonId === 'none' ? null : parseInt(contactPersonId) },
      })
    } finally {
      setIsSavingField(null)
    }
  }

  const handleCreateContactPerson = async () => {
    if (!distribution?.entity?.id || !newContactName.trim()) return
    setIsSavingField('contact_person')
    try {
      const newContact = await createContactPerson.mutateAsync({
        entityId: distribution.entity.id,
        data: {
          name: newContactName.trim(),
          email: newContactEmail.trim() || undefined,
          phone: newContactPhone.trim() || undefined,
        },
      })
      // Auto-select the new contact
      await updateDistribution.mutateAsync({
        id: Number(id),
        data: { contact_person: newContact.id },
      })
      setShowCreateContact(false)
      setNewContactName('')
      setNewContactEmail('')
      setNewContactPhone('')
    } finally {
      setIsSavingField(null)
    }
  }

  const handleSaveNotes = async (notes: string) => {
    if (!id) return
    await updateDistribution.mutateAsync({
      id: Number(id),
      data: { notes },
    })
  }

  const handleSaveSpecialTerms = async (specialTerms: string) => {
    if (!id) return
    await updateDistribution.mutateAsync({
      id: Number(id),
      data: { special_terms: specialTerms },
    })
  }

  const toggleItemExpanded = (itemId: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const toggleSongExpanded = (songId: number) => {
    setExpandedSongIds(prev => {
      const next = new Set(prev)
      if (next.has(songId)) {
        next.delete(songId)
      } else {
        next.add(songId)
      }
      return next
    })
  }

  const openRevenueDialog = (catalogItemId: number) => {
    setSelectedCatalogItemId(catalogItemId)
    setShowAddRevenueDialog(true)
  }

  // Calculate totals
  const totals = useMemo(() => {
    if (!distribution) return { revenue: 0, tracks: 0, reports: 0 }

    let revenue = 0
    let reports = 0

    // Count from catalog_items (legacy)
    distribution.catalog_items?.forEach(item => {
      revenue += parseFloat(item.total_revenue || '0')
      reports += item.revenue_reports?.length || 0
    })

    return {
      revenue,
      tracks: distribution.songs?.length || distribution.track_count || 0,
      reports,
    }
  }, [distribution])

  // Group revenue by platform
  const revenueByPlatform = useMemo(() => {
    if (!distribution?.catalog_items) return []

    const grouped = new Map<Platform, { platform: Platform; revenue: number; streams: number; downloads: number; count: number }>()

    distribution.catalog_items.forEach(item => {
      item.revenue_reports?.forEach(report => {
        if (!grouped.has(report.platform)) {
          grouped.set(report.platform, { platform: report.platform, revenue: 0, streams: 0, downloads: 0, count: 0 })
        }
        const group = grouped.get(report.platform)!
        group.revenue += parseFloat(report.revenue_amount || '0')
        group.streams += report.streams || 0
        group.downloads += report.downloads || 0
        group.count += 1
      })
    })

    return Array.from(grouped.values()).sort((a, b) => b.revenue - a.revenue)
  }, [distribution])

  return {
    // Data
    id,
    distribution,
    isLoading,
    error,
    contactPersons,
    totals,
    revenueByPlatform,

    // UI State
    activeTab,
    setActiveTab,
    showDeleteDialog,
    setShowDeleteDialog,
    showAddSongInline,
    setShowAddSongInline,
    showAddRevenueDialog,
    setShowAddRevenueDialog,
    selectedCatalogItemId,
    setSelectedCatalogItemId,
    expandedItems,
    expandedSongIds,
    songsViewMode,
    setSongsViewMode,

    // Inline editing
    signingDateOpen,
    setSigningDateOpen,
    isSavingField,
    showCreateContact,
    setShowCreateContact,
    newContactName,
    setNewContactName,
    newContactEmail,
    setNewContactEmail,
    newContactPhone,
    setNewContactPhone,

    // Mutations
    updateStatus,
    createContactPerson,

    // Handlers
    navigate,
    handleDelete,
    handleRemoveCatalogItem,
    handleRemoveSong,
    handleStatusChange,
    handleSaveSigningDate,
    handleSaveDealType,
    handleSaveIncludesDsps,
    handleSaveIncludesYoutube,
    handleSaveRevenueShare,
    handleChangeContactPerson,
    handleCreateContactPerson,
    handleSaveNotes,
    handleSaveSpecialTerms,
    toggleItemExpanded,
    toggleSongExpanded,
    openRevenueDialog,
  }
}
