import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { EntityFormDialog } from '@/components/entities/EntityFormDialog';
import { ContactPersonFormDialog } from '@/components/entities/ContactPersonFormDialog';
import { EntityRequestDialog } from '@/components/entities/EntityRequestDialog';
import { toast } from '@/components/ui/use-toast';

import { useEntityDetailState } from './hooks/useEntityDetailState';
import { EntityHeader } from './components/EntityHeader';
import { EntityTabs } from './components/EntityTabs';
import { DetailsTab } from './components/tabs/DetailsTab';
import { IdentifiersTab } from './components/tabs/IdentifiersTab';
import { ContractsTab } from './components/tabs/ContractsTab';
import { CampaignsTab } from './components/tabs/CampaignsTab';
import { FinancialTab } from './components/tabs/FinancialTab';
import { ActivityTab } from './components/tabs/ActivityTab';
import { SocialMediaTab } from './components/tabs/SocialMediaTab';
import { SensitiveTab } from './components/tabs/SensitiveTab';
import { ContractGenerationTab } from './components/tabs/ContractGenerationTab';
import { SocialMediaDialog } from './components/dialogs/SocialMediaDialog';

export default function EntityDetailPage() {
  const state = useEntityDetailState();

  if (state.isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (state.error || !state.entity) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Entity not found</p>
          <Button className="mt-4" onClick={() => state.navigate('/entities')}>
            Back to Entities
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      try {
        toast({
          title: 'Entity deleted',
          description: 'The entity has been successfully deleted.',
        });
        state.navigate('/entities');
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to delete entity.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <EntityHeader
          entity={state.entity}
          isAdmin={state.isAdmin}
          showContractGeneration={state.showContractGeneration}
          saving={state.saving}
          previewing={state.previewing}
          onNavigateBack={() => state.navigate('/entities')}
          onEditClick={() => state.setEditDialogOpen(true)}
          onDeleteClick={handleDelete}
          onGenerateContractClick={state.handleGenerateContract}
          onBackToDetails={state.handleBackToDetails}
          onSaveDraft={state.saveDraft}
          onPreview={state.previewContract}
          onRequestEdit={() => {
            state.setEntityRequestType('edit');
            state.setEntityRequestDialogOpen(true);
          }}
          onRequestDelete={() => {
            state.setEntityRequestType('delete');
            state.setEntityRequestDialogOpen(true);
          }}
        />

        <Tabs value={state.activeTab} onValueChange={state.setActiveTab} className="space-y-6">
          <EntityTabs
            isAdmin={state.isAdmin}
            hasCampaigns={state.hasCampaigns}
            hasCreativeRole={state.hasCreativeRole}
            showContractGeneration={state.showContractGeneration}
            entityKind={state.entity.kind}
          />

          <DetailsTab
            entity={state.entity}
            isClient={state.isClient}
            onAddContactPerson={state.handleAddContactPerson}
            onEditContactPerson={state.handleEditContactPerson}
          />

          <IdentifiersTab identifiers={state.entity.identifiers} />

          <ContractsTab contracts={state.contracts} contractsLoading={state.contractsLoading} />

          <CampaignsTab isArtist={state.isArtist} artistAnalytics={state.artistAnalytics} />

          <FinancialTab />

          <ActivityTab entityId={Number(state.id)} />

          <SocialMediaTab
            hasCreativeRole={state.hasCreativeRole}
            socialMediaAccounts={state.entity.social_media_accounts}
            onAddSocialMedia={state.handleAddSocialMedia}
            onEditSocialMedia={state.handleEditSocialMedia}
            onDeleteSocialMedia={state.handleDeleteSocialMedia}
          />

          <SensitiveTab
            entityKind={state.entity.kind}
            sensitiveIdentity={state.entity.sensitive_identity}
            revealedCNP={state.revealedCNP}
            revealedPassportNumber={state.revealedPassportNumber}
            revealing={state.revealing}
            onRevealCNP={state.handleRevealCNP}
            onRevealPassportNumber={state.handleRevealPassportNumber}
          />

          <ContractGenerationTab
            showContractGeneration={state.showContractGeneration}
            entityName={state.entity.display_name}
            contractTerms={state.contractTerms}
            commissionByYear={state.commissionByYear}
            enabledRights={state.enabledRights}
            previewData={state.previewData}
            missingPlaceholders={state.missingPlaceholders}
            loading={state.loading}
            onContractTermsChange={state.setContractTerms}
            onUpdateContractDuration={state.updateContractDuration}
            onCopyRateToAllYears={state.copyRateToAllYears}
            onUpdateCommissionRate={state.updateCommissionRate}
            onToggleRightsCategory={state.toggleRightsCategory}
            onGenerateContract={state.generateContract}
          />
        </Tabs>

        {/* Edit Dialog */}
        {state.editDialogOpen && (
          <EntityFormDialog
            open={state.editDialogOpen}
            onOpenChange={state.setEditDialogOpen}
            entity={state.entity}
            onSuccess={() => state.setEditDialogOpen(false)}
          />
        )}

        {/* Contact Person Dialog */}
        {state.entity && (
          <ContactPersonFormDialog
            open={state.contactPersonDialogOpen}
            onOpenChange={state.setContactPersonDialogOpen}
            entityId={state.entity.id}
            contactPerson={state.editingContactPerson}
            onSuccess={() => {
              state.setContactPersonDialogOpen(false);
              state.setEditingContactPerson(null);
              window.location.reload();
            }}
          />
        )}

        {/* Entity Request Dialog - for non-admins */}
        {state.entity && (
          <EntityRequestDialog
            open={state.entityRequestDialogOpen}
            onOpenChange={state.setEntityRequestDialogOpen}
            entity={{
              id: state.entity.id,
              display_name: state.entity.display_name,
            }}
            requestType={state.entityRequestType}
          />
        )}

        {/* Social Media Dialog */}
        <SocialMediaDialog
          open={state.socialMediaDialogOpen}
          onOpenChange={state.setSocialMediaDialogOpen}
          isEditing={!!state.editingSocialMedia}
          formState={state.socialMediaForm}
          onFormChange={state.setSocialMediaForm}
          onSave={state.handleSaveSocialMedia}
          saving={state.savingSocialMedia}
        />
      </div>
    </AppLayout>
  );
}
