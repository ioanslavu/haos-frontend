/**
 * Opportunity Detail View
 * Comprehensive view with tabbed interface
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOpportunity, useMarkWon, useMarkLost, useOpportunityActivities, useUsageTerm, useDeliverablePack, useApprovals, opportunityKeys, useUsageTerms, useUpdateOpportunity } from '@/api/hooks/useOpportunities';
import { opportunityDeliverablesApi } from '@/api/services/opportunities.service';
import { useQueryClient } from '@tanstack/react-query';
import { formatMoney, formatDate } from '@/lib/utils';
import { STAGE_CONFIG, PRIORITY_CONFIG, DELIVERABLE_TYPE_CONFIG, DeliverableType } from '@/types/opportunities';
import { OpportunityTaskModal } from './components/OpportunityTaskModal';
import { OpportunityDeliverableModal } from './components/OpportunityDeliverableModal';
import { OpportunityArtistModal } from './components/OpportunityArtistModal';
import { ProposalWizard } from './components/ProposalWizard';
import { OpportunityApprovalsTab } from './components/OpportunityApprovalsTab';
import { RelatedTasks } from '@/components/tasks/RelatedTasks';
import { DeliverableTriggerButton } from '@/components/tasks/ManualTriggerButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showProposalWizard, setShowProposalWizard] = useState(false);
  const [showUsageTermsModal, setShowUsageTermsModal] = useState(false);
  const [selectedUsageTermId, setSelectedUsageTermId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: opportunity, isLoading } = useOpportunity(Number(id));
  const { data: activities = [] } = useOpportunityActivities(Number(id));
  const { data: approvals } = useApprovals({ opportunity: Number(id) });
  const { data: usageTerms } = useUsageTerm(opportunity?.usage_terms || 0);
  const { data: deliverablePack } = useDeliverablePack(opportunity?.deliverable_pack || 0);
  const { data: usageTermsList } = useUsageTerms({ is_template: true });
  const markWonMutation = useMarkWon();
  const markLostMutation = useMarkLost();
  const updateMutation = useUpdateOpportunity();

  // Import deliverables from pack
  const handleImportFromPack = async () => {
    if (!deliverablePack || !deliverablePack.items) {
      toast.error('No deliverable pack selected');
      return;
    }

    try {
      toast.loading('Importing deliverables...');

      // Create a deliverable for each item in the pack
      for (const item of deliverablePack.items) {
        await opportunityDeliverablesApi.create({
          opportunity: opportunity.id,
          deliverable_type: item.deliverable_type,
          quantity: item.quantity,
          description: item.description || '',
          status: 'planned',
        });
      }

      // Refresh the opportunity data
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(opportunity.id) });

      toast.dismiss();
      toast.success(`Imported ${deliverablePack.items.length} deliverables from ${deliverablePack.name}`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || 'Failed to import deliverables');
    }
  };

  // Handle usage terms configuration
  const handleConfigureUsageTerms = async () => {
    if (!selectedUsageTermId) {
      toast.error('Please select a usage term template');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: opportunity.id,
        data: {
          usage_terms: selectedUsageTermId,
        },
      });
      setShowUsageTermsModal(false);
      toast.success('Usage terms configured successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to configure usage terms');
    }
  };


  if (isLoading || !opportunity) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const stageConfig = STAGE_CONFIG[opportunity.stage];
  const priorityConfig = PRIORITY_CONFIG[opportunity.priority];

  const handleMarkWon = async () => {
    if (confirm('Mark this opportunity as Won?')) {
      await markWonMutation.mutateAsync(opportunity.id);
    }
  };

  const handleMarkLost = async () => {
    const reason = prompt('Why was this opportunity lost?');
    if (reason) {
      await markLostMutation.mutateAsync({
        id: opportunity.id,
        data: { lost_reason: reason },
      });
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6 space-y-6">
        {/* Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-white/10 p-8 shadow-xl">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-orange-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')} className="mb-4 hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pipeline
            </Button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-5xl">{stageConfig.emoji}</span>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {opportunity.title}
                    </h1>
                    <p className="text-muted-foreground text-lg mt-1">{opportunity.opportunity_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge className={`${stageConfig.color} px-3 py-1 text-sm`}>{stageConfig.label}</Badge>
                  <Badge className={`${priorityConfig.color} px-3 py-1 text-sm`}>{priorityConfig.label}</Badge>
                  <Badge variant="outline" className="px-3 py-1 text-sm">{opportunity.probability}% probability</Badge>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                {['shortlist', 'proposal_draft', 'qualified'].includes(opportunity.stage) && (
                  <Button
                    size="sm"
                    onClick={() => setShowProposalWizard(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    Create Proposal
                  </Button>
                )}
                {opportunity.stage !== 'won' && opportunity.stage !== 'closed_lost' && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleMarkWon} className="rounded-xl border-white/10 hover:bg-white/10">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Won
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleMarkLost} className="rounded-xl border-white/10 hover:bg-white/10">
                      <XCircle className="mr-2 h-4 w-4" />
                      Mark Lost
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate(`/opportunities/${id}/edit`)} className="rounded-xl border-white/10 hover:bg-white/10">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphic Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl shadow-lg p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent" />
            <div className="relative">
              <div className="text-sm font-medium text-muted-foreground mb-2">Account</div>
              <div className="font-bold text-lg">{opportunity.account.display_name}</div>
              {opportunity.contact_person && (
                <div className="text-xs text-muted-foreground mt-2">
                  Contact: {opportunity.contact_person.first_name} {opportunity.contact_person.last_name}
                </div>
              )}
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl shadow-lg p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent" />
            <div className="relative">
              <div className="text-sm font-medium text-muted-foreground mb-2">Estimated Value</div>
              <div className="font-bold text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {opportunity.estimated_value
                  ? formatMoney(parseFloat(opportunity.estimated_value), opportunity.currency)
                  : 'Not set'}
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl shadow-lg p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent" />
            <div className="relative">
              <div className="text-sm font-medium text-muted-foreground mb-2">Expected Close</div>
              <div className="font-bold text-lg">
                {opportunity.expected_close_date ? formatDate(opportunity.expected_close_date) : 'Not set'}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {opportunity.probability}% probability
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-xl border-white/20 dark:border-white/10 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-xl shadow-lg p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-transparent" />
            <div className="relative">
              <div className="text-sm font-medium text-muted-foreground mb-2">Owner</div>
              <div className="font-bold text-lg">{opportunity.owner.full_name}</div>
              {opportunity.team && (
                <div className="text-xs text-muted-foreground mt-2">
                  Team: {opportunity.team.name}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Modern iOS-style Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-14 shadow-lg">
            <TabsTrigger
              value="overview"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="artists"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Artists {opportunity.artists?.length ? `(${opportunity.artists.length})` : ''}
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Tasks {opportunity.tasks?.length ? `(${opportunity.tasks.length})` : ''}
            </TabsTrigger>
            <TabsTrigger
              value="deliverables"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Deliverables
            </TabsTrigger>
            <TabsTrigger
              value="usage-terms"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Usage Terms
            </TabsTrigger>
            <TabsTrigger
              value="approvals"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Approvals {approvals?.results?.length ? `(${approvals.results.length})` : ''}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Campaign Details */}
            {(opportunity.campaign_objectives || opportunity.target_audience || opportunity.brand_category) && (
              <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
                <h3 className="font-semibold mb-4 text-base">Campaign Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4 col-span-2">
                    {opportunity.campaign_objectives && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Objectives</div>
                        <div className="text-sm">{opportunity.campaign_objectives}</div>
                      </div>
                    )}
                    {opportunity.target_audience && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Target Audience</div>
                        <div className="text-sm">{opportunity.target_audience}</div>
                      </div>
                    )}
                  </div>
                  {opportunity.brand_category && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Brand Category</div>
                      <div className="text-sm">{opportunity.brand_category}</div>
                    </div>
                  )}
                  {opportunity.channels && opportunity.channels.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Channels</div>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.channels.map((channel) => (
                          <Badge key={channel} variant="secondary" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(opportunity.campaign_start_date || opportunity.campaign_end_date) && (
                    <>
                      {opportunity.campaign_start_date && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-2">Campaign Start</div>
                          <div className="text-sm">{formatDate(opportunity.campaign_start_date)}</div>
                        </div>
                      )}
                      {opportunity.campaign_end_date && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-2">Campaign End</div>
                          <div className="text-sm">{formatDate(opportunity.campaign_end_date)}</div>
                        </div>
                      )}
                    </>
                  )}
                  {(opportunity.budget_range_min || opportunity.budget_range_max) && (
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Budget Range</div>
                      <div className="text-sm">
                        {opportunity.budget_range_min && formatMoney(parseFloat(opportunity.budget_range_min), opportunity.currency)}
                        {opportunity.budget_range_min && opportunity.budget_range_max && ' - '}
                        {opportunity.budget_range_max && formatMoney(parseFloat(opportunity.budget_range_max), opportunity.currency)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Proposal Details */}
            {(opportunity.proposal_sent_date || opportunity.proposal_version) && (
              <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
                <h3 className="font-semibold mb-4 text-base">Proposal Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  {opportunity.proposal_version && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Version</div>
                      <Badge variant="outline">v{opportunity.proposal_version}</Badge>
                    </div>
                  )}
                  {opportunity.proposal_sent_date && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Sent Date</div>
                      <div className="text-sm">{formatDate(opportunity.proposal_sent_date)}</div>
                    </div>
                  )}
                  {opportunity.proposal_valid_until && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Valid Until</div>
                      <div className="text-sm">{formatDate(opportunity.proposal_valid_until)}</div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Financial Details */}
            {opportunity.fee_gross && parseFloat(opportunity.fee_gross) > 0 && (
              <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
                <h3 className="font-semibold mb-4">Financial Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gross Fee</span>
                    <span className="font-semibold">
                      {formatMoney(parseFloat(opportunity.fee_gross), opportunity.currency)}
                    </span>
                  </div>
                  {opportunity.discounts && parseFloat(opportunity.discounts) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">Discounts</span>
                      <span>-{formatMoney(parseFloat(opportunity.discounts), opportunity.currency)}</span>
                    </div>
                  )}
                  {opportunity.agency_fee && parseFloat(opportunity.agency_fee) > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span className="text-sm">Agency Fee</span>
                      <span>-{formatMoney(parseFloat(opportunity.agency_fee), opportunity.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Net Fee</span>
                    <span className="font-semibold text-green-600">
                      {formatMoney(parseFloat(opportunity.fee_net || '0'), opportunity.currency)}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Contract Details */}
            {opportunity.contract_number && (
              <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
                <h3 className="font-semibold mb-4">Contract Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contract Number</span>
                    <span className="font-semibold">{opportunity.contract_number}</span>
                  </div>
                  {opportunity.po_number && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">PO Number</span>
                      <span className="font-semibold">{opportunity.po_number}</span>
                    </div>
                  )}
                  {opportunity.contract_signed_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Signed Date</span>
                      <span>{formatDate(opportunity.contract_signed_date)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Artists</h3>
                <Button
                  size="sm"
                  onClick={() => setShowArtistModal(true)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  Add Artist
                </Button>
              </div>
              {opportunity.artists && opportunity.artists.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.artists.map(artist => (
                    <div key={artist.id} className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-background/30 backdrop-blur-sm">
                      <div>
                        <div className="font-semibold">{artist.artist.display_name}</div>
                        <div className="text-sm text-muted-foreground">{artist.role}</div>
                      </div>
                      <div className="text-right">
                        {artist.confirmed_fee && (
                          <div className="font-semibold text-green-600">
                            {formatMoney(parseFloat(artist.confirmed_fee), opportunity.currency)}
                          </div>
                        )}
                        <Badge variant="outline">{artist.contract_status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No artists added yet</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6 mt-6">
            {/* Legacy manual tasks - keeping for backward compatibility */}
            {opportunity.tasks && opportunity.tasks.length > 0 && (
              <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Manual Tasks (Legacy)</h3>
                  <Button
                    size="sm"
                    onClick={() => setShowTaskModal(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    Add Task
                  </Button>
                </div>
                <div className="space-y-3">
                  {opportunity.tasks.map(task => (
                    <div key={task.id} className="flex items-start justify-between p-4 border border-white/10 rounded-xl bg-background/30 backdrop-blur-sm">
                      <div className="flex-1">
                        <div className="font-semibold">{task.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.assigned_to && `Assigned to ${task.assigned_to.full_name}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={task.status === 'completed' ? 'default' : 'secondary'}
                          className="mb-2"
                        >
                          {task.status}
                        </Badge>
                        {task.due_date && (
                          <div className="text-xs text-muted-foreground">
                            Due {formatDate(task.due_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* New universal task system tasks */}
            <RelatedTasks
              entityType="opportunity"
              entityId={opportunity.id}
              title="Opportunity Tasks"
              description="Tasks automatically created and updated based on this opportunity's progress"
              showEmpty={true}
            />
          </TabsContent>

          <TabsContent value="deliverables" className="mt-6">
            <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Deliverables</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/opportunities/${opportunity.id}/edit`)}
                    className="rounded-xl border-white/10 hover:bg-white/10"
                  >
                    Add Pack
                  </Button>
                  {deliverablePack && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleImportFromPack}
                      className="rounded-xl border-white/10 hover:bg-white/10"
                    >
                      Import from Pack
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setShowDeliverableModal(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  >
                    Add Deliverable
                  </Button>
                </div>
              </div>
              {opportunity.deliverables && opportunity.deliverables.length > 0 ? (
                <div className="space-y-3">
                  {opportunity.deliverables.map(deliverable => (
                    <div key={deliverable.id} className="border border-white/10 rounded-xl p-4 bg-background/30 backdrop-blur-sm hover:bg-background/50 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">
                              {DELIVERABLE_TYPE_CONFIG[deliverable.deliverable_type as DeliverableType]?.emoji || '📄'}{' '}
                              {DELIVERABLE_TYPE_CONFIG[deliverable.deliverable_type as DeliverableType]?.label || deliverable.deliverable_type}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Qty: {deliverable.quantity}
                            </Badge>
                            <Badge variant={
                              deliverable.status === 'completed' ? 'default' :
                              deliverable.status === 'approved' ? 'default' :
                              deliverable.status === 'in_progress' ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {deliverable.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {deliverable.description && (
                            <p className="text-xs text-muted-foreground">{deliverable.description}</p>
                          )}
                          {deliverable.due_date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {formatDate(deliverable.due_date)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <DeliverableTriggerButton
                            deliverableId={deliverable.id}
                            className="text-xs"
                            variant="outline"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">No deliverables added yet</p>
                  {deliverablePack && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleImportFromPack}
                      className="rounded-xl border-white/10 hover:bg-white/10"
                    >
                      Import {deliverablePack.items?.length || 0} items from {deliverablePack.name}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="usage-terms" className="mt-6">
            <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Usage Terms</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUsageTermsModal(true)}
                  className="rounded-xl border-white/10 hover:bg-white/10"
                >
                  {usageTerms ? 'Change' : 'Configure'}
                </Button>
              </div>
              {usageTerms ? (
                <div className="space-y-4">
                  <div className="border border-white/10 rounded-xl p-4 bg-background/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">TEMPLATE</div>
                        <div className="text-lg font-bold">{usageTerms.name}</div>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Usage Rights</h4>
                        {usageTerms.usage_scope && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">Scope</Badge>
                            <span className="text-sm">{usageTerms.usage_scope}</span>
                          </div>
                        )}
                        {usageTerms.territories && usageTerms.territories.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">Territories</Badge>
                            <span className="text-sm">{usageTerms.territories.join(', ')}</span>
                          </div>
                        )}
                        {usageTerms.usage_duration_days && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">Duration</Badge>
                            <span className="text-sm">{usageTerms.usage_duration_days} days</span>
                          </div>
                        )}
                        {usageTerms.media_types && usageTerms.media_types.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">Media</Badge>
                            <div className="flex flex-wrap gap-1">
                              {usageTerms.media_types.map((media: string) => (
                                <Badge key={media} variant="secondary" className="text-xs">
                                  {media}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Exclusivity & Options</h4>
                        {usageTerms.exclusivity_category && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">Category</Badge>
                            <span className="text-sm">{usageTerms.exclusivity_category}</span>
                          </div>
                        )}
                        {usageTerms.exclusivity_duration_days && (
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">Duration</Badge>
                            <span className="text-sm">{usageTerms.exclusivity_duration_days} days</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {usageTerms.buyout && (
                            <Badge className="bg-green-600 text-white">✓ Buyout</Badge>
                          )}
                          {usageTerms.extensions_allowed && (
                            <Badge variant="secondary">Extensions Allowed</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {usageTerms.description && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-xs font-medium text-muted-foreground mb-2">NOTES</div>
                        <p className="text-sm text-muted-foreground">{usageTerms.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <span className="text-3xl">📄</span>
                  </div>
                  <h3 className="font-semibold mb-2">No Usage Terms Configured</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Define usage rights, territories, duration, and exclusivity terms for this opportunity
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/artist-sales/admin/usage-terms')}
                      className="rounded-xl border-white/10 hover:bg-white/10"
                    >
                      Browse Templates
                    </Button>
                    <Button
                      onClick={() => setShowUsageTermsModal(true)}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                    >
                      Configure Now
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="approvals" className="mt-6">
            <OpportunityApprovalsTab opportunityId={opportunity.id} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
              <h3 className="font-semibold mb-4">Activity Timeline</h3>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex gap-4 border-l-2 pl-4 pb-4">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{activity.title}</div>
                        {activity.description && (
                          <div className="text-sm text-muted-foreground mt-1">{activity.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {activity.user?.full_name} • {formatDate(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Artist Modal */}
        <OpportunityArtistModal
          open={showArtistModal}
          onOpenChange={setShowArtistModal}
          opportunityId={opportunity.id}
        />

        {/* Task Modal */}
        <OpportunityTaskModal
          open={showTaskModal}
          onOpenChange={setShowTaskModal}
          opportunityId={opportunity.id}
        />

        {/* Deliverable Modal */}
        <OpportunityDeliverableModal
          open={showDeliverableModal}
          onOpenChange={setShowDeliverableModal}
          opportunityId={opportunity.id}
        />

        {/* Proposal Wizard */}
        <ProposalWizard
          open={showProposalWizard}
          onOpenChange={setShowProposalWizard}
          opportunityId={opportunity.id}
          currentData={opportunity}
          currency={opportunity.currency}
        />

        {/* Usage Terms Configuration Modal */}
        <Dialog open={showUsageTermsModal} onOpenChange={setShowUsageTermsModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Configure Usage Terms</DialogTitle>
              <DialogDescription>
                Select a usage terms template for this opportunity
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Usage Terms Template</label>
                <Select
                  value={selectedUsageTermId?.toString() || opportunity.usage_terms?.toString() || ''}
                  onValueChange={(val) => setSelectedUsageTermId(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {usageTermsList?.results?.map((term) => (
                      <SelectItem key={term.id} value={term.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{term.name}</span>
                          {term.description && (
                            <span className="text-xs text-muted-foreground">{term.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose from pre-defined usage rights templates
                </p>
              </div>

              {usageTermsList?.results?.length === 0 && (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">No templates available</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowUsageTermsModal(false);
                      navigate('/artist-sales/admin/usage-terms');
                    }}
                  >
                    Create Template
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowUsageTermsModal(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfigureUsageTerms}
                disabled={updateMutation.isPending || !selectedUsageTermId}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
