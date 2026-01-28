/**
 * DistributionDetailPage - Enhanced distribution detail view with tabs
 *
 * Tabs:
 * - Overview: Basic deal info, status, revenue share, dates (with inline editing)
 * - Catalog: Catalog items with add/remove
 * - Revenue: Revenue reports by platform
 * - Tasks: Distribution-related tasks
 */

import { ArrowLeft, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useDistributionDetail } from './hooks/useDistributionDetail'
import { DistributionHeader } from './components/DistributionHeader'
import { DistributionTabs } from './components/DistributionTabs'
import { OverviewTab } from './components/OverviewTab'
import { SongsTab } from './components/SongsTab'
import { RevenueTab } from './components/RevenueTab'
import { AuditTab } from './components/AuditTab'
import { DeleteDistributionDialog } from './components/DeleteDistributionDialog'
import { AddRevenueReportDialog } from './components/AddRevenueReportDialog'
import { DistributionTasksTab } from './components/DistributionTasksTab'
import { DistributionInvoicesTab } from './components/DistributionInvoicesTab'
import { DistributionContractsTab } from './components/DistributionContractsTab'

export default function DistributionDetailPage() {
  const {
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
    toggleSongExpanded,
  } = useDistributionDetail()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !distribution) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <p className="text-muted-foreground">Distribution not found</p>
          <Button onClick={() => navigate('/distributions')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Distributions
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/distributions')}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Distributions
        </Button>

        {/* Header */}
        <DistributionHeader
          distribution={distribution}
          totals={totals}
          signingDateOpen={signingDateOpen}
          setSigningDateOpen={setSigningDateOpen}
          isSavingField={isSavingField}
          showCreateContact={showCreateContact}
          setShowCreateContact={setShowCreateContact}
          newContactName={newContactName}
          setNewContactName={setNewContactName}
          newContactEmail={newContactEmail}
          setNewContactEmail={setNewContactEmail}
          newContactPhone={newContactPhone}
          setNewContactPhone={setNewContactPhone}
          contactPersons={contactPersons}
          createContactPersonPending={createContactPerson.isPending}
          updateStatusPending={updateStatus.isPending}
          onStatusChange={handleStatusChange}
          onSaveSigningDate={handleSaveSigningDate}
          onChangeContactPerson={handleChangeContactPerson}
          onCreateContactPerson={handleCreateContactPerson}
          onDelete={() => setShowDeleteDialog(true)}
          navigate={navigate}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <DistributionTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            songCount={distribution.songs?.length || 0}
          />

          {/* Overview Tab */}
          <TabsContent value="overview">
            <OverviewTab
              distribution={distribution}
              isLoading={isLoading}
              isSavingField={isSavingField}
              onSaveDealType={handleSaveDealType}
              onSaveRevenueShare={handleSaveRevenueShare}
              onSaveIncludesDsps={handleSaveIncludesDsps}
              onSaveIncludesYoutube={handleSaveIncludesYoutube}
              onSaveSpecialTerms={handleSaveSpecialTerms}
              onSaveNotes={handleSaveNotes}
            />
          </TabsContent>

          {/* Songs Tab */}
          <TabsContent value="catalog">
            <SongsTab
              distributionId={Number(id)}
              songs={distribution.songs || []}
              showAddSongInline={showAddSongInline}
              setShowAddSongInline={setShowAddSongInline}
              songsViewMode={songsViewMode}
              setSongsViewMode={setSongsViewMode}
              expandedSongIds={expandedSongIds}
              toggleSongExpanded={toggleSongExpanded}
              onRemoveSong={handleRemoveSong}
            />
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <RevenueTab revenueByPlatform={revenueByPlatform} />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <DistributionInvoicesTab distributionId={Number(id)} />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <DistributionContractsTab distribution={distribution} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <DistributionTasksTab distributionId={Number(id)} />
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <DeleteDistributionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
      />

      {/* Add Revenue Report Dialog */}
      {selectedCatalogItemId && (
        <AddRevenueReportDialog
          open={showAddRevenueDialog}
          onOpenChange={(open) => {
            setShowAddRevenueDialog(open)
            if (!open) setSelectedCatalogItemId(null)
          }}
          distributionId={Number(id)}
          catalogItemId={selectedCatalogItemId}
        />
      )}
    </AppLayout>
  )
}
