/**
 * InvoiceDetailPage - Invoice detail view with tabs
 *
 * Tabs:
 * - Overview: Financial details, dates, relationships
 * - File & Extraction: File preview and AI extraction
 * - Origins: Linked campaigns, distributions
 */

import { ArrowLeft } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInvoiceDetail } from './hooks/useInvoiceDetail'
import { InvoiceHeader } from './components/InvoiceHeader'
import { InvoiceOverviewTab, InvoiceNotesSection } from './components/InvoiceOverviewTab'
import { InvoiceFileTab } from './components/InvoiceFileTab'
import { InvoiceOriginsTab } from './components/InvoiceOriginsTab'
import { MarkPaidDialog, CancelInvoiceDialog } from './components/InvoiceDialogs'

export default function InvoiceDetailPage() {
  const {
    // Data
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

    // Handlers
    navigate,
    handleMarkPaid,
    handleCancel,
    handleAcceptExtraction,
    handleRetryExtraction,
    handleSyncToGdrive,
    handleFileUpload,
  } = useInvoiceDetail()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </AppLayout>
    )
  }

  if (error || !invoice) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load invoice details.</p>
          <Button onClick={() => navigate('/invoices')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <InvoiceHeader
          invoice={invoice}
          canMarkPaid={!!canMarkPaid}
          canCancel={!!canCancel}
          canUploadFile={!!canUploadFile}
          canSyncToGdrive={!!canSyncToGdrive}
          syncToGdrivePending={syncToGdriveMutation.isPending}
          onMarkPaid={() => setShowMarkPaidDialog(true)}
          onCancel={() => setShowCancelDialog(true)}
          onSyncToGdrive={handleSyncToGdrive}
          onFileUpload={handleFileUpload}
          onBack={() => navigate('/invoices')}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-xl bg-background/50 border border-white/10 p-1">
            <TabsTrigger value="overview" className="rounded-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="file" className="rounded-lg">
              File & Extraction
            </TabsTrigger>
            <TabsTrigger value="origins" className="rounded-lg">
              Origins
              {invoice.has_origins && (
                <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                  {invoice.origin_count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <InvoiceOverviewTab invoice={invoice} />
            <InvoiceNotesSection notes={invoice.notes} />
          </TabsContent>

          {/* File & Extraction Tab */}
          <TabsContent value="file" className="mt-6">
            <InvoiceFileTab
              invoice={invoice}
              acceptExtractionPending={acceptExtractionMutation.isPending}
              retryExtractionPending={retryExtractionMutation.isPending}
              onAcceptExtraction={handleAcceptExtraction}
              onRetryExtraction={handleRetryExtraction}
              onFileUpload={handleFileUpload}
            />
          </TabsContent>

          {/* Origins Tab */}
          <TabsContent value="origins" className="mt-6">
            <InvoiceOriginsTab invoice={invoice} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mark Paid Dialog */}
      <MarkPaidDialog
        open={showMarkPaidDialog}
        onOpenChange={setShowMarkPaidDialog}
        paymentReference={paymentReference}
        setPaymentReference={setPaymentReference}
        onConfirm={handleMarkPaid}
        isPending={markPaidMutation.isPending}
      />

      {/* Cancel Dialog */}
      <CancelInvoiceDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
        isPending={cancelMutation.isPending}
      />
    </AppLayout>
  )
}
