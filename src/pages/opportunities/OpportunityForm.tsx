/**
 * Opportunity Form - Create/Edit unified opportunities
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { useCreateOpportunity, useUpdateOpportunity, useOpportunity } from '@/api/hooks/useOpportunities';
import { useAuthStore } from '@/stores/authStore';
import { useDepartmentUsers } from '@/api/hooks/useUsers';
import { useContactPersons } from '@/api/hooks/useEntities';
import type { OpportunityStage, OpportunityPriority } from '@/types/opportunities';
import { STAGE_CONFIG, PRIORITY_CONFIG } from '@/types/opportunities';
import { toast } from 'sonner';

const opportunityFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  stage: z.string().optional(),
  priority: z.string().optional(),
  client: z.number({ required_error: 'Client is required' }),
  contact_person: z.number().optional().nullable(),
  owner: z.number({ required_error: 'Owner is required' }),
  team: z.number().optional().nullable(),
  estimated_value: z.string().optional().nullable(),
  currency: z.enum(['EUR', 'USD', 'RON', 'GBP']).default('EUR'),
  expected_close_date: z.string().optional().nullable(),

  // Brief fields
  campaign_objectives: z.string().optional(),
  target_audience: z.string().optional(),
  brand_category: z.string().optional(),
  budget_range_min: z.string().optional().nullable(),
  budget_range_max: z.string().optional().nullable(),
  campaign_start_date: z.string().optional().nullable(),
  campaign_end_date: z.string().optional().nullable(),

  notes: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

const STAGES: { value: OpportunityStage; label: string; emoji: string }[] = [
  { value: 'brief', label: STAGE_CONFIG.brief.label, emoji: STAGE_CONFIG.brief.emoji },
  { value: 'qualified', label: STAGE_CONFIG.qualified.label, emoji: STAGE_CONFIG.qualified.emoji },
  { value: 'shortlist', label: STAGE_CONFIG.shortlist.label, emoji: STAGE_CONFIG.shortlist.emoji },
  { value: 'proposal_draft', label: STAGE_CONFIG.proposal_draft.label, emoji: STAGE_CONFIG.proposal_draft.emoji },
  { value: 'proposal_sent', label: STAGE_CONFIG.proposal_sent.label, emoji: STAGE_CONFIG.proposal_sent.emoji },
  { value: 'negotiation', label: STAGE_CONFIG.negotiation.label, emoji: STAGE_CONFIG.negotiation.emoji },
  { value: 'contract_prep', label: STAGE_CONFIG.contract_prep.label, emoji: STAGE_CONFIG.contract_prep.emoji },
  { value: 'contract_sent', label: STAGE_CONFIG.contract_sent.label, emoji: STAGE_CONFIG.contract_sent.emoji },
  { value: 'won', label: STAGE_CONFIG.won.label, emoji: STAGE_CONFIG.won.emoji },
];

const PRIORITIES: { value: OpportunityPriority; label: string }[] = [
  { value: 'low', label: PRIORITY_CONFIG.low.label },
  { value: 'medium', label: PRIORITY_CONFIG.medium.label },
  { value: 'high', label: PRIORITY_CONFIG.high.label },
  { value: 'urgent', label: PRIORITY_CONFIG.urgent.label },
];

export default function OpportunityForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const opportunityId = id ? Number(id) : 0;

  const { user } = useAuthStore();
  const { data: opportunity, isLoading } = useOpportunity(opportunityId);
  const { data: departmentUsers } = useDepartmentUsers(user?.department?.id);
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      title: '',
      stage: 'brief',
      priority: 'medium',
      client: undefined,
      contact_person: null,
      owner: user?.id || undefined,
      team: user?.department?.id || null,
      estimated_value: '',
      currency: 'EUR',
      expected_close_date: '',
      campaign_objectives: '',
      target_audience: '',
      brand_category: '',
      budget_range_min: '',
      budget_range_max: '',
      campaign_start_date: '',
      campaign_end_date: '',
      notes: '',
    },
  });

  // Watch client field to load contact persons
  const selectedClientId = form.watch('client');
  const { data: contactPersons } = useContactPersons(selectedClientId, !!selectedClientId);

  // Load opportunity data for editing
  useEffect(() => {
    if (isEdit && opportunity) {
      form.reset({
        title: opportunity.title,
        stage: opportunity.stage,
        priority: opportunity.priority,
        client: opportunity.client.id,
        contact_person: opportunity.contact_person?.id || null,
        owner: opportunity.owner.id,
        team: opportunity.team?.id || null,
        estimated_value: opportunity.estimated_value || '',
        currency: opportunity.currency as 'EUR' | 'USD' | 'RON' | 'GBP',
        expected_close_date: opportunity.expected_close_date || '',
        campaign_objectives: opportunity.campaign_objectives || '',
        target_audience: opportunity.target_audience || '',
        brand_category: opportunity.brand_category || '',
        budget_range_min: opportunity.budget_range_min || '',
        budget_range_max: opportunity.budget_range_max || '',
        campaign_start_date: opportunity.campaign_start_date || '',
        campaign_end_date: opportunity.campaign_end_date || '',
        notes: opportunity.notes || '',
      });
    }
  }, [isEdit, opportunity, form]);

  const onSubmit = async (data: OpportunityFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: opportunityId, data });
        navigate(`/opportunities/${opportunityId}`);
      } else {
        const created = await createMutation.mutateAsync(data);
        navigate(`/opportunities/${created.id}`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save opportunity');
    }
  };

  if (isEdit && isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl py-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipeline
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Edit Opportunity' : 'New Opportunity'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEdit ? 'Update opportunity details' : 'Create a new sales opportunity'}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opportunity Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Nike Summer Campaign 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STAGES.map((stage) => (
                              <SelectItem key={stage.value} value={stage.value}>
                                <span className="flex items-center gap-2">
                                  <span>{stage.emoji}</span>
                                  <span>{stage.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITIES.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <EntitySearchCombobox
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            // Reset contact person when client changes
                            form.setValue('contact_person', null);
                          }}
                          placeholder="Search clients..."
                          entityType="brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={field.value?.toString() || undefined}
                        disabled={!selectedClientId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedClientId ? "Select contact person (optional)" : "Select client first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contactPersons?.results?.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.full_name} {contact.email && `(${contact.email})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="owner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner *</FormLabel>
                        <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departmentUsers?.results?.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="RON">RON</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimated_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Value</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expected_close_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Close Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget_range_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range Min</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget_range_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range Max</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="campaign_objectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Objectives</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What are the main goals and objectives of this campaign?"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the target audience for this campaign"
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fashion, Sports, Automotive" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="campaign_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="campaign_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or context about this opportunity"
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/opportunities')}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Update' : 'Create'} Opportunity
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
