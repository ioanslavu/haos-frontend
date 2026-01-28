/**
 * SubCampaignCard - Individual subcampaign card component
 */

import { Card } from '@/components/ui/card'
import { Collapsible } from '@/components/ui/collapsible'
import { useAuthStore } from '@/stores/authStore'
import { useSubCampaignInvoices } from '@/api/hooks/useCampaigns'
import { SubCampaignInvoiceDialog } from '../SubCampaignInvoiceDialog'
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel/index'
import { PLATFORM_CONFIG } from '@/types/campaign'
import { useSubCampaignCard } from './hooks/useSubCampaignsList'
import { SubCampaignCardHeader } from './SubCampaignCardHeader'
import { SubCampaignCardExpanded } from './SubCampaignCardExpanded'
import { DeleteSubCampaignDialog } from './DeleteSubCampaignDialog'
import type { SubCampaignCardProps } from './types'

export function SubCampaignCard({
  subcampaign,
  campaignId,
  campaignName,
  isExpanded,
  onToggleExpand,
}: SubCampaignCardProps) {
  const isAdminOrManager = useAuthStore((state) => state.isAdminOrManager)
  const canViewSensitiveData = isAdminOrManager()

  // Prefetch invoice count for header display
  const { data: invoices } = useSubCampaignInvoices(campaignId, subcampaign.id, isExpanded)

  const {
    showDeleteConfirm,
    setShowDeleteConfirm,
    showInvoiceDialog,
    setShowInvoiceDialog,
    showTaskPanel,
    setShowTaskPanel,
    startDateOpen,
    setStartDateOpen,
    endDateOpen,
    setEndDateOpen,
    isSavingDates,
    editingField,
    setEditingField,
    inputs,
    isRevenueShare,
    handleSaveField,
    handlePaymentMethodChange,
    handleCurrencyChange,
    handleSaveStartDate,
    handleSaveEndDate,
  } = useSubCampaignCard({ subcampaign, campaignId })

  const platformConfig = PLATFORM_CONFIG[subcampaign.platform]

  return (
    <>
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          <SubCampaignCardHeader
            subcampaign={subcampaign}
            isExpanded={isExpanded}
            invoiceCount={invoices?.length || 0}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            onCreateTaskClick={() => setShowTaskPanel(true)}
          />

          <SubCampaignCardExpanded
            subcampaign={subcampaign}
            campaignId={campaignId}
            canViewSensitiveData={canViewSensitiveData}
            startDateOpen={startDateOpen}
            setStartDateOpen={setStartDateOpen}
            endDateOpen={endDateOpen}
            setEndDateOpen={setEndDateOpen}
            isSavingDates={isSavingDates}
            handleSaveStartDate={handleSaveStartDate}
            handleSaveEndDate={handleSaveEndDate}
            handlePaymentMethodChange={handlePaymentMethodChange}
            handleCurrencyChange={handleCurrencyChange}
            editingField={editingField}
            setEditingField={setEditingField}
            isRevenueShare={isRevenueShare}
            inputs={inputs}
            handleSaveField={handleSaveField}
            onAddInvoice={() => setShowInvoiceDialog(true)}
          />
        </Collapsible>
      </Card>

      {/* Delete Confirmation */}
      <DeleteSubCampaignDialog
        campaignId={campaignId}
        subcampaignId={subcampaign.id}
        platformLabel={platformConfig.label}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />

      {/* Invoice Upload Dialog */}
      <SubCampaignInvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        campaignId={campaignId}
        campaignName={campaignName}
        subcampaign={subcampaign}
        onSuccess={() => setShowInvoiceDialog(false)}
      />

      {/* Task Create Panel - Pre-linked to campaign and platform */}
      <TaskDetailPanel
        task={null}
        open={showTaskPanel}
        onOpenChange={setShowTaskPanel}
        createMode={true}
        defaultCampaignId={campaignId}
        defaultSubcampaignId={subcampaign.id}
      />
    </>
  )
}
