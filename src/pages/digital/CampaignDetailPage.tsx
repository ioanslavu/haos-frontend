import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Building2,
  Music,
  User,
  Calendar,
  DollarSign,
  Target,
  Users,
  FileText,
  TrendingUp,
  Briefcase,
  Mail,
  Phone,
  ListTodo,
  Package,
  Activity
} from 'lucide-react';
import { useCampaign } from '@/api/hooks/useCampaigns';
import { useTasks } from '@/api/hooks/useTasks';
import { useClientProfileByEntity } from '@/api/hooks/useClientProfiles';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ClientHealthScore } from '@/components/crm/ClientHealthScore';
import { ServiceMetricsUpdateDialog } from '@/components/digital/ServiceMetricsUpdateDialog';
import { KPIProgressUpdateDialog } from '@/components/digital/KPIProgressUpdateDialog';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { useAuthStore } from '@/stores/authStore';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const campaignId = Number(id);
  const { data: campaign, isLoading } = useCampaign(campaignId, !!id);
  const { data: tasks } = useTasks({ campaign: campaignId });
  const campaignTasks = tasks?.results || [];

  // Parallel fetch: Start fetching health score immediately
  const { data: healthScoreProfile, isLoading: healthScoreLoading } = useClientProfileByEntity(
    campaign?.client?.id,
    !!campaign?.client?.id
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading campaign...</div>
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-muted-foreground">Campaign not found</div>
          <Button onClick={() => navigate('/digital/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-gray-500',
      negotiation: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      active: 'bg-green-500',
      completed: 'bg-purple-500',
      lost: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getInvoiceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_issued: 'bg-gray-500',
      issued: 'bg-blue-500',
      collected: 'bg-green-500',
      delayed: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPricingModelLabel = (model: string) => {
    const labels: Record<string, string> = {
      service_fee: 'Service Fee',
      revenue_share: 'Revenue Share',
    };
    return labels[model] || model;
  };

  const calculateKPIProgress = (target: number, actual: number) => {
    if (!target || target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return '0.00';
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Modern Glassmorphic Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 space-y-4">
            {/* Back button and actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/digital/campaigns')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Campaigns
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => navigate(`/digital/campaigns/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {campaign && (
                  <ServiceMetricsUpdateDialog
                    campaign={campaign}
                    variant="outline"
                    size="sm"
                  />
                )}
                <Button variant="outline" size="sm" className="rounded-xl">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Campaign title and status */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {campaign.campaign_name}
                </h1>
                <Badge className={cn("text-white", getStatusColor(campaign.status))}>
                  {campaign.status_display || campaign.status}
                </Badge>
                {campaign.service_types && campaign.service_types.length > 0 && (
                  campaign.service_types.map((st: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="capitalize">
                      {campaign.service_types_display?.[idx] || st.replace('_', ' ')}
                    </Badge>
                  ))
                )}
              </div>
              <p className="text-muted-foreground text-lg">
                {campaign.brand.display_name} • {campaign.client.display_name}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Campaign Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Client
                  </div>
                  <div className="font-medium">{campaign.client.display_name}</div>
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Brand
                  </div>
                  <div className="font-medium">{campaign.brand.display_name}</div>
                </div>

                {/* Artist */}
                {campaign.artist ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Artist
                    </div>
                    <div className="font-medium">{campaign.artist.display_name}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Artist
                    </div>
                    <div className="text-sm text-muted-foreground">No artist assigned</div>
                  </div>
                )}

                {/* Song */}
                {campaign.song ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Song
                    </div>
                    <div className="font-medium">{campaign.song.title || 'Unknown'}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Song
                    </div>
                    <div className="text-sm text-muted-foreground">No song assigned</div>
                  </div>
                )}

                {/* Department */}
                {campaign.department_display ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Department</div>
                    <Badge variant="outline">{campaign.department_display}</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Department</div>
                    <div className="text-sm text-muted-foreground">No department</div>
                  </div>
                )}

                {/* Platforms */}
                {campaign.platforms && campaign.platforms.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Platforms</div>
                    <div className="flex flex-wrap gap-2">
                      {campaign.platforms.map((platform: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="capitalize">
                          {campaign.platforms_display?.[idx] || platform.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Platforms</div>
                    <div className="text-sm text-muted-foreground">No platforms specified</div>
                  </div>
                )}

                {/* Value - Hidden for digital_employee */}
                {currentUser?.role !== 'digital_employee' && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Campaign Value
                    </div>
                    <div className="font-medium text-lg">
                      {formatCurrency(campaign.value)} {campaign.currency}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaign.start_date ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </div>
                    <div className="font-medium">{format(new Date(campaign.start_date), 'PPP')}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </div>
                    <div className="text-sm text-muted-foreground">Not set</div>
                  </div>
                )}

                {campaign.end_date ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </div>
                    <div className="font-medium">{format(new Date(campaign.end_date), 'PPP')}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date
                    </div>
                    <div className="text-sm text-muted-foreground">Not set</div>
                  </div>
                )}

                {campaign.confirmed_at ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Confirmed At
                    </div>
                    <div className="font-medium">{format(new Date(campaign.confirmed_at), 'PPP')}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Confirmed At
                    </div>
                    <div className="text-sm text-muted-foreground">Not confirmed yet</div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created At
                  </div>
                  <div className="font-medium">{format(new Date(campaign.created_at), 'PPP')}</div>
                </div>
              </div>
            </div>

            {/* Contact Person Card */}
            {campaign.contact_person ? (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Person
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {campaign.contact_person.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'CP'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-lg">{campaign.contact_person.name}</div>
                      {campaign.contact_person.role && (
                        <div className="text-sm text-muted-foreground">{campaign.contact_person.role}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaign.contact_person.email ? (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                        <a href={`mailto:${campaign.contact_person.email}`} className="text-sm hover:underline">
                          {campaign.contact_person.email}
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                        <div className="text-sm text-muted-foreground">No email</div>
                      </div>
                    )}

                    {campaign.contact_person.phone ? (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone
                        </div>
                        <a href={`tel:${campaign.contact_person.phone}`} className="text-sm hover:underline">
                          {campaign.contact_person.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone
                        </div>
                        <div className="text-sm text-muted-foreground">No phone</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Person
                </h2>
                <div className="text-sm text-muted-foreground">No contact person assigned</div>
              </div>
            )}

            {/* Financial Card */}
            <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Financial Overview
                </h2>
                <Badge className={campaign.pricing_model === 'revenue_share' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}>
                  {getPricingModelLabel(campaign.pricing_model || 'service_fee')}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget Allocated */}
                {campaign.budget_allocated ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Budget Allocated</div>
                    <div className="font-medium text-lg">
                      {formatCurrency(campaign.budget_allocated)} {campaign.currency}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Budget Allocated</div>
                    <div className="text-sm text-muted-foreground">Not set</div>
                  </div>
                )}

                {/* Budget Spent */}
                {campaign.budget_spent ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Budget Spent</div>
                    <div className="font-medium text-lg">
                      {formatCurrency(campaign.budget_spent)} {campaign.currency}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Budget Spent</div>
                    <div className="text-sm text-muted-foreground">0.00 {campaign.currency}</div>
                  </div>
                )}

                {/* Profit - Hidden for digital_employee */}
                {currentUser?.role !== 'digital_employee' && (
                  <>
                    {campaign.profit !== null && campaign.profit !== undefined ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className={cn(
                          "font-medium text-lg",
                          Number(campaign.profit) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(campaign.profit)} {campaign.currency}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className="text-sm text-muted-foreground">Not calculated</div>
                      </div>
                    )}
                  </>
                )}

                {/* Internal Cost Estimate - Hidden for digital_employee */}
                {currentUser?.role !== 'digital_employee' && (
                  <>
                    {campaign.internal_cost_estimate ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Internal Cost Estimate</div>
                        <div className="font-medium text-lg">
                          {formatCurrency(campaign.internal_cost_estimate)} {campaign.currency}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Internal Cost Estimate</div>
                        <div className="text-sm text-muted-foreground">Not set</div>
                      </div>
                    )}
                  </>
                )}

                {/* Revenue Share Fields - Hidden for digital_employee */}
                {currentUser?.role !== 'digital_employee' && campaign.pricing_model === 'revenue_share' && (
                  <>
                    {campaign.revenue_generated && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Revenue Generated</div>
                        <div className="font-medium text-lg">
                          {formatCurrency(campaign.revenue_generated)} {campaign.currency}
                        </div>
                      </div>
                    )}
                    {campaign.partner_share_percentage && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Partner Share</div>
                        <div className="font-medium text-lg">
                          {campaign.partner_share_percentage}%
                        </div>
                      </div>
                    )}
                    {campaign.partner_payout && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Partner Payout</div>
                        <div className="font-medium text-lg">
                          {formatCurrency(campaign.partner_payout)} {campaign.currency}
                        </div>
                      </div>
                    )}
                    {campaign.our_revenue && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Our Revenue</div>
                        <div className="font-medium text-lg">
                          {formatCurrency(campaign.our_revenue)} {campaign.currency}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Invoice Status - Hidden for digital_employee */}
                {currentUser?.role !== 'digital_employee' && (
                  <>
                    {campaign.invoice_status ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Invoice Status</div>
                        <Badge className={cn("text-white", getInvoiceStatusColor(campaign.invoice_status))}>
                          {campaign.invoice_status_display || campaign.invoice_status}
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Invoice Status</div>
                        <div className="text-sm text-muted-foreground">No invoice</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* KPI Tracking Card */}
            {campaign.kpi_targets && Object.keys(campaign.kpi_targets).length > 0 ? (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    KPI Tracking
                  </h2>
                  <KPIProgressUpdateDialog
                    campaign={campaign}
                    variant="outline"
                    size="sm"
                  />
                </div>
                <div className="space-y-4">
                  {Object.entries(campaign.kpi_targets || {}).map(([kpiName, targetData]: [string, any]) => {
                    const actualData = campaign.kpi_actuals?.[kpiName];
                    const target = targetData?.target || 0;
                    const actual = actualData?.actual || 0;
                    const unit = targetData?.unit || actualData?.unit || '';
                    const progress = calculateKPIProgress(target, actual);

                    return (
                      <div key={kpiName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium capitalize">{kpiName.replace(/_/g, ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {actual.toLocaleString()} / {target.toLocaleString()} {unit}
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-xs text-muted-foreground text-right">
                          {progress.toFixed(1)}% complete
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  KPI Tracking
                </h2>
                <div className="text-sm text-muted-foreground">No KPI targets set</div>
              </div>
            )}

            {/* Service Metrics Card (from department_data) */}
            <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Service Metrics
                </h2>
                <ServiceMetricsUpdateDialog
                  campaign={campaign}
                  variant="outline"
                  size="sm"
                />
              </div>
              {campaign.department_data && Object.keys(campaign.department_data).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(campaign.department_data).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No service metrics recorded yet. Click "Update Metrics" to add metrics for this campaign.
                </div>
              )}
            </div>

            {/* Tasks Card */}
            {campaignTasks && campaignTasks.length > 0 ? (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Tasks ({campaignTasks.length})
                </h2>
                <div className="space-y-3">
                  {campaignTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-white/10">
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status && (
                          <Badge variant="outline" className="capitalize">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        )}
                        {task.priority && (
                          <Badge variant="secondary" className="capitalize">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Tasks
                </h2>
                <div className="text-sm text-muted-foreground">No tasks assigned to this campaign</div>
              </div>
            )}

            {/* Notes Card */}
            {campaign.notes ? (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{campaign.notes}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </h2>
                <div className="text-sm text-muted-foreground">No notes added</div>
              </div>
            )}
          </div>

          {/* Right Column - Team & Metadata */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Current Status</div>
                  <Badge className={cn("text-white", getStatusColor(campaign.status))}>
                    {campaign.status_display || campaign.status}
                  </Badge>
                </div>
                {campaign.service_types && campaign.service_types.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Service Types</div>
                    <div className="flex flex-wrap gap-2">
                      {campaign.service_types.map((st: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="capitalize">
                          {campaign.service_types_display?.[idx] || st.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {campaign.platforms && campaign.platforms.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Platforms</div>
                    <div className="flex flex-wrap gap-2">
                      {campaign.platforms.map((platform: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="capitalize">
                          {campaign.platforms_display?.[idx] || platform.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Health Score */}
            <ClientHealthScore
              entityId={campaign.client?.id}
              profile={healthScoreProfile}
              isLoading={healthScoreLoading}
              departmentId={campaign.department}
              className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg"
            />

            {/* Team Card */}
            {campaign.handlers && campaign.handlers.length > 0 ? (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team ({campaign.handlers.length})
                </h2>
                <div className="space-y-4">
                  {campaign.handlers.map((handler: any) => (
                    <div key={handler.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-white/10">
                      <Avatar>
                        <AvatarImage src={handler.user?.avatar} />
                        <AvatarFallback>
                          {handler.user?.first_name?.[0]}{handler.user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {handler.user?.first_name} {handler.user?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {handler.user?.email || 'No email'}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize shrink-0">
                        {handler.role_display || handler.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team
                </h2>
                <div className="text-sm text-muted-foreground">No team members assigned</div>
              </div>
            )}

            {/* Metadata Card */}
            <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Metadata</h2>
              <div className="space-y-4">
                {campaign.created_by ? (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Created By</div>
                    <div className="font-medium">
                      {campaign.created_by.first_name} {campaign.created_by.last_name}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Created By</div>
                    <div className="text-sm text-muted-foreground">Unknown</div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="font-medium">{format(new Date(campaign.updated_at), 'PPP')}</div>
                </div>
              </div>
            </div>

            {/* Activity Log Section */}
            <div className="rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </h2>
              <ActivityTimeline campaignId={campaignId} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
