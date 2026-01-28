/**
 * Hook for SubCampaignsList state and handlers
 */

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  useUpdateSubCampaign,
} from '@/api/hooks/useCampaigns'
import type { SubCampaign, EditableField, PaymentMethod } from '../types'

interface UseSubCampaignCardParams {
  subcampaign: SubCampaign
  campaignId: number
}

export function useSubCampaignCard({ subcampaign, campaignId }: UseSubCampaignCardParams) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showTaskPanel, setShowTaskPanel] = useState(false)
  const [editingField, setEditingField] = useState<EditableField>(null)

  // Service Fee fields
  const [clientValueInput, setClientValueInput] = useState(subcampaign.client_value || '0')
  const [budgetInput, setBudgetInput] = useState(subcampaign.budget || '0')
  const [spentInput, setSpentInput] = useState(subcampaign.spent || '0')
  const [internalCostInput, setInternalCostInput] = useState(subcampaign.internal_cost || '0')

  // Revenue Share fields
  const [revenueGeneratedInput, setRevenueGeneratedInput] = useState(subcampaign.revenue_generated || '0')
  const [partnerShareInput, setPartnerShareInput] = useState(subcampaign.revenue_share_percentage || '0')

  // Sync input values when subcampaign data changes (after save)
  useEffect(() => {
    if (editingField === null) {
      setClientValueInput(subcampaign.client_value || '0')
      setBudgetInput(subcampaign.budget || '0')
      setSpentInput(subcampaign.spent || '0')
      setInternalCostInput(subcampaign.internal_cost || '0')
      setRevenueGeneratedInput(subcampaign.revenue_generated || '0')
      setPartnerShareInput(subcampaign.revenue_share_percentage || '0')
    }
  }, [subcampaign, editingField])

  const updateSubCampaign = useUpdateSubCampaign()
  const isRevenueShare = subcampaign.payment_method === 'revenue_share'

  // Generic save handler for financial fields
  const handleSaveField = useCallback(async (field: NonNullable<EditableField>) => {
    const inputMap: Record<string, string> = {
      client_value: clientValueInput,
      budget: budgetInput,
      spent: spentInput,
      internal_cost: internalCostInput,
      revenue_generated: revenueGeneratedInput,
      revenue_share_percentage: partnerShareInput,
    }
    const originalMap: Record<string, string> = {
      client_value: subcampaign.client_value || '0',
      budget: subcampaign.budget || '0',
      spent: subcampaign.spent || '0',
      internal_cost: subcampaign.internal_cost || '0',
      revenue_generated: subcampaign.revenue_generated || '0',
      revenue_share_percentage: subcampaign.revenue_share_percentage || '0',
    }
    const setterMap: Record<string, (v: string) => void> = {
      client_value: setClientValueInput,
      budget: setBudgetInput,
      spent: setSpentInput,
      internal_cost: setInternalCostInput,
      revenue_generated: setRevenueGeneratedInput,
      revenue_share_percentage: setPartnerShareInput,
    }

    if (inputMap[field] === originalMap[field]) {
      setEditingField(null)
      return
    }

    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { [field]: inputMap[field] },
      })
      setEditingField(null)
    } catch {
      setterMap[field](originalMap[field])
      setEditingField(null)
    }
  }, [
    campaignId, subcampaign.id, updateSubCampaign,
    clientValueInput, budgetInput, spentInput, internalCostInput,
    revenueGeneratedInput, partnerShareInput, subcampaign
  ])

  // Handle payment method change
  const handlePaymentMethodChange = useCallback(async (value: string) => {
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { payment_method: value as PaymentMethod },
      })
    } catch {
      // Error handled by mutation
    }
  }, [campaignId, subcampaign.id, updateSubCampaign])

  // Handle currency change
  const handleCurrencyChange = useCallback(async (value: string) => {
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { currency: value },
      })
    } catch {
      // Error handled by mutation
    }
  }, [campaignId, subcampaign.id, updateSubCampaign])

  const handleSaveStartDate = useCallback(async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { start_date: format(date, 'yyyy-MM-dd') },
      })
      setStartDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }, [campaignId, subcampaign.id, updateSubCampaign])

  const handleSaveEndDate = useCallback(async (date: Date | undefined) => {
    if (!date) return
    setIsSavingDates(true)
    try {
      await updateSubCampaign.mutateAsync({
        campaignId,
        subCampaignId: subcampaign.id,
        data: { end_date: format(date, 'yyyy-MM-dd') },
      })
      setEndDateOpen(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSavingDates(false)
    }
  }, [campaignId, subcampaign.id, updateSubCampaign])

  return {
    // Dialog states
    showDeleteConfirm,
    setShowDeleteConfirm,
    showInvoiceDialog,
    setShowInvoiceDialog,
    showTaskPanel,
    setShowTaskPanel,

    // Date picker states
    startDateOpen,
    setStartDateOpen,
    endDateOpen,
    setEndDateOpen,
    isSavingDates,

    // Field editing
    editingField,
    setEditingField,

    // Input values
    inputs: {
      clientValue: clientValueInput,
      setClientValue: setClientValueInput,
      budget: budgetInput,
      setBudget: setBudgetInput,
      spent: spentInput,
      setSpent: setSpentInput,
      internalCost: internalCostInput,
      setInternalCost: setInternalCostInput,
      revenueGenerated: revenueGeneratedInput,
      setRevenueGenerated: setRevenueGeneratedInput,
      partnerShare: partnerShareInput,
      setPartnerShare: setPartnerShareInput,
    },

    // Computed values
    isRevenueShare,

    // Handlers
    handleSaveField,
    handlePaymentMethodChange,
    handleCurrencyChange,
    handleSaveStartDate,
    handleSaveEndDate,
  }
}
