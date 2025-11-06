import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { useCreateOpportunity, useUpdateOpportunity, useOpportunity, useBriefs } from '@/api/hooks/useArtistSales'
import { OPPORTUNITY_STAGE_LABELS } from '@/types/artist-sales'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const opportunityFormSchema = z.object({
  account: z.number({ required_error: 'Account is required' }),
  opp_name: z.string().min(1, 'Opportunity name is required'),
  brief: z.number().optional().nullable(),
  stage: z.enum(['qualified', 'proposal', 'negotiation', 'contract_sent', 'po_received', 'in_execution', 'completed', 'closed_lost']),
  probability_percent: z.number().min(0).max(100),
  expected_close_date: z.string().optional(),
  amount_expected: z.string().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'RON']).default('EUR'),
  lost_reason: z.string().optional(),
  notes: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunityFormSchema>

export default function OpportunityForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const opportunityId = id ? Number(id) : 0

  const { data: opportunity, isLoading: opportunityLoading } = useOpportunity(opportunityId, isEdit && opportunityId > 0)
  const { data: briefsData } = useBriefs()
  const briefs = briefsData?.results || []
  const createOpportunity = useCreateOpportunity()
  const updateOpportunity = useUpdateOpportunity()

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      account: undefined,
      opp_name: '',
      brief: null,
      stage: 'qualified',
      probability_percent: 50,
      expected_close_date: '',
      amount_expected: '',
      currency: 'EUR',
      lost_reason: '',
      notes: '',
    },
  })

  const stage = form.watch('stage')

  // Load opportunity data when editing
  useEffect(() => {
    if (opportunity && isEdit) {
      form.reset({
        account: opportunity.account.id,
        opp_name: opportunity.opp_name,
        brief: opportunity.brief?.id || null,
        stage: opportunity.stage,
        probability_percent: opportunity.probability_percent,
        expected_close_date: opportunity.expected_close_date || '',
        amount_expected: opportunity.amount_expected || '',
        currency: opportunity.currency,
        lost_reason: opportunity.lost_reason || '',
        notes: opportunity.notes || '',
      })
    }
  }, [opportunity, isEdit, form])

  const onSubmit = async (data: OpportunityFormData) => {
    try {
      const payload = {
        ...data,
        brief: data.brief || undefined,
        expected_close_date: data.expected_close_date || undefined,
        amount_expected: data.amount_expected || undefined,
        lost_reason: data.lost_reason || undefined,
        notes: data.notes || undefined,
      }

      if (isEdit && opportunity) {
        await updateOpportunity.mutateAsync({
          id: opportunity.id,
          data: payload,
        })
        toast.success('Opportunity updated successfully')
      } else {
        await createOpportunity.mutateAsync(payload)
        toast.success('Opportunity created successfully')
      }
      navigate('/artist-sales/opportunities')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save opportunity')
    }
  }

  if (isEdit && opportunityLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/opportunities')} aria-label="Go back to opportunities">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? 'Edit Opportunity' : 'Create New Opportunity'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update opportunity details and track the sales pipeline.'
                : 'Create a new sales opportunity from a brief or lead.'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about this opportunity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account *</FormLabel>
                      <FormControl>
                        <EntitySearchCombobox
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Search for account..."
                          useBusinessEndpoint
                        />
                      </FormControl>
                      <FormDescription>
                        The company or brand for this opportunity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="opp_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opportunity Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter opportunity name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brief"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Brief</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'none' ? null : Number(value))}
                        value={field.value ? field.value.toString() : 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brief (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {briefs.map((brief) => (
                            <SelectItem key={brief.id} value={brief.id.toString()}>
                              {brief.campaign_title} - {brief.account.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Link this opportunity to an existing brief
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Sales Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Track stage and probability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(OPPORTUNITY_STAGE_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                    name="probability_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probability %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="50"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expected_close_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Close Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Expected value of this opportunity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="RON">RON</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount_expected"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="50000.00"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d.]/g, '')
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Notes and status details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stage === 'closed_lost' && (
                  <FormField
                    control={form.control}
                    name="lost_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lost Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Why was this opportunity lost?"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this opportunity..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/artist-sales/opportunities')}
                disabled={createOpportunity.isPending || updateOpportunity.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOpportunity.isPending || updateOpportunity.isPending}
              >
                {createOpportunity.isPending || updateOpportunity.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Update Opportunity'
                ) : (
                  'Create Opportunity'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  )
}
