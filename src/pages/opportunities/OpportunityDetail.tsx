/**
 * OpportunityDetail - Sales opportunity detail view with tabs
 *
 * Tabs:
 * - Overview: Deal info, dates, assignments
 * - Artists: Artists with fees
 * - Deliverables: Deliverable items
 * - Approvals: Approval workflow
 * - Contracts: Related contracts
 * - Invoices: Related invoices
 * - Tasks: Related tasks
 * - Activity: Activity timeline
 */

import { ArrowLeft, Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useOpportunityDetail } from './hooks/useOpportunityDetail'
import { OpportunityHeader } from './components/OpportunityHeader'
import { OpportunityTabs } from './components/OpportunityTabs'
import { OpportunityOverviewTab } from './components/OpportunityOverviewTab'
import { OpportunityArtistsTab } from './components/OpportunityArtistsTab'
import { OpportunityDeliverablesTab } from './components/OpportunityDeliverablesTab'
import { OpportunityActivityTab } from './components/OpportunityActivityTab'
import { OpportunityTasksTab } from './components/OpportunityTasksTab'
import { DeleteOpportunityDialog } from './components/DeleteOpportunityDialog'
import { OpportunityApprovalsTab } from './components/OpportunityApprovalsTab'
import { OpportunityContractsSection } from './components/OpportunityContractsSection'
import { OpportunityInvoicesSection } from './components/OpportunityInvoicesSection'

export default function OpportunityDetail() {
  const {
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
    expandedDeliverableIds,

    // Mutations
    deleteOpportunity,

    // Helpers
    canTransitionTo,
    toggleArtistExpanded,
    toggleDeliverableExpanded,

    // Handlers
    navigate,
    handleStageChange,
    handleSaveExpectedCloseDate,
    handleSaveCampaignStartDate,
    handleSaveCampaignEndDate,
    handleMarkWon,
    handleMarkLost,
    handleDelete,
    handleSaveNotes,
  } = useOpportunityDetail()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!opportunity) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <p className="text-muted-foreground">Opportunity not found</p>
          <Button onClick={() => navigate('/opportunities')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
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
          onClick={() => navigate('/opportunities')}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Opportunities
        </Button>

        {/* Header */}
        <OpportunityHeader
          opportunity={opportunity}
          isTerminalStage={isTerminalStage}
          currentStageIndex={currentStageIndex}
          expectedCloseDateOpen={expectedCloseDateOpen}
          setExpectedCloseDateOpen={setExpectedCloseDateOpen}
          isSavingDates={isSavingDates}
          canTransitionTo={canTransitionTo}
          onStageChange={handleStageChange}
          onSaveExpectedCloseDate={handleSaveExpectedCloseDate}
          onMarkWon={handleMarkWon}
          onMarkLost={handleMarkLost}
          onDelete={() => setShowDeleteConfirm(true)}
          navigate={navigate}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <OpportunityTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            opportunity={opportunity}
          />

          {/* Overview Tab */}
          <TabsContent value="overview">
            <OpportunityOverviewTab
              opportunity={opportunity}
              isLoading={isLoading}
              campaignStartDateOpen={campaignStartDateOpen}
              setCampaignStartDateOpen={setCampaignStartDateOpen}
              campaignEndDateOpen={campaignEndDateOpen}
              setCampaignEndDateOpen={setCampaignEndDateOpen}
              isSavingDates={isSavingDates}
              onSaveCampaignStartDate={handleSaveCampaignStartDate}
              onSaveCampaignEndDate={handleSaveCampaignEndDate}
              onSaveNotes={handleSaveNotes}
            />
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists">
            <OpportunityArtistsTab
              opportunityId={opportunity.id}
              artists={opportunity.artists || []}
              showAddArtist={showAddArtist}
              setShowAddArtist={setShowAddArtist}
              expandedArtistIds={expandedArtistIds}
              toggleArtistExpanded={toggleArtistExpanded}
            />
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables">
            <OpportunityDeliverablesTab
              opportunityId={opportunity.id}
              deliverables={opportunity.deliverables || []}
              showAddDeliverable={showAddDeliverable}
              setShowAddDeliverable={setShowAddDeliverable}
              expandedDeliverableIds={expandedDeliverableIds}
              toggleDeliverableExpanded={toggleDeliverableExpanded}
            />
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <OpportunityApprovalsTab opportunityId={opportunity.id} />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <OpportunityContractsSection opportunityId={opportunity.id} clientId={opportunity.client?.id} />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <OpportunityInvoicesSection opportunityId={opportunity.id} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <OpportunityTasksTab opportunityId={opportunity.id} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <OpportunityActivityTab activities={activities} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <DeleteOpportunityDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        isPending={deleteOpportunity.isPending}
      />
    </AppLayout>
  )
}
