/**
 * Custom hook for InvoiceDetailPage state and logic
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useInvoice,
  useMarkInvoicePaid,
  useCancelInvoice,
  useAcceptExtraction,
  useRetryExtraction,
  useSyncToGdrive,
  useUploadInvoiceFile,
} from '@/api/hooks/useInvoices'
import { useToast } from '@/hooks/use-toast'

export function useInvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const invoiceId = parseInt(id || '0')

  // UI State
  const [activeTab, setActiveTab] = useState('overview')
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')

  // Data fetching
  const { data: invoice, isLoading, error } = useInvoice(invoiceId)

  // Mutations
  const markPaidMutation = useMarkInvoicePaid()
  const cancelMutation = useCancelInvoice()
  const acceptExtractionMutation = useAcceptExtraction()
  const retryExtractionMutation = useRetryExtraction()
  const syncToGdriveMutation = useSyncToGdrive()
  const uploadFileMutation = useUploadInvoiceFile()

  // Permission checks
  const canMarkPaid = invoice?.status === 'uploaded' && invoice?.amount
  const canCancel = invoice?.status !== 'paid' && invoice?.status !== 'cancelled'
  const canUploadFile = !invoice?.has_file
  const canSyncToGdrive = invoice?.has_file && !invoice?.is_synced_to_gdrive

  // Handlers
  const handleMarkPaid = async () => {
    try {
      await markPaidMutation.mutateAsync({
        id: invoiceId,
        payload: paymentReference ? { payment_reference: paymentReference } : undefined,
      })
      toast({ title: 'Invoice marked as paid', description: 'The invoice status has been updated.' })
      setShowMarkPaidDialog(false)
      setPaymentReference('')
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to mark invoice as paid.', variant: 'destructive' })
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(invoiceId)
      toast({ title: 'Invoice cancelled', description: 'The invoice has been cancelled.' })
      setShowCancelDialog(false)
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel invoice.', variant: 'destructive' })
    }
  }

  const handleAcceptExtraction = async () => {
    try {
      await acceptExtractionMutation.mutateAsync(invoiceId)
      toast({ title: 'Extraction accepted', description: 'The extracted amount has been applied.' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to accept extraction.', variant: 'destructive' })
    }
  }

  const handleRetryExtraction = async () => {
    try {
      await retryExtractionMutation.mutateAsync(invoiceId)
      toast({ title: 'Extraction started', description: 'AI extraction has been restarted.' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to retry extraction.', variant: 'destructive' })
    }
  }

  const handleSyncToGdrive = async () => {
    try {
      await syncToGdriveMutation.mutateAsync(invoiceId)
      toast({ title: 'Sync started', description: 'File is being synced to Google Drive.' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to sync to Google Drive.', variant: 'destructive' })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadFileMutation.mutateAsync({ id: invoiceId, file })
      toast({ title: 'File uploaded', description: 'Invoice file has been uploaded and AI extraction started.' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload file.', variant: 'destructive' })
    }
  }

  return {
    // Data
    id,
    invoiceId,
    invoice,
    isLoading,
    error,

    // UI State
    activeTab,
    setActiveTab,
    showMarkPaidDialog,
    setShowMarkPaidDialog,
    showCancelDialog,
    setShowCancelDialog,
    paymentReference,
    setPaymentReference,

    // Permissions
    canMarkPaid,
    canCancel,
    canUploadFile,
    canSyncToGdrive,

    // Mutations
    markPaidMutation,
    cancelMutation,
    acceptExtractionMutation,
    retryExtractionMutation,
    syncToGdriveMutation,
    uploadFileMutation,

    // Handlers
    navigate,
    handleMarkPaid,
    handleCancel,
    handleAcceptExtraction,
    handleRetryExtraction,
    handleSyncToGdrive,
    handleFileUpload,
  }
}

// Currency formatting utility
const currencySymbols: Record<string, string> = {
  EUR: '\u20AC',
  USD: '$',
  GBP: '\u00A3',
  RON: 'RON',
}

export function formatAmount(amount: string | null, currency: string): string {
  if (!amount) return '-'
  const num = parseFloat(amount)
  const symbol = currencySymbols[currency] || currency
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
