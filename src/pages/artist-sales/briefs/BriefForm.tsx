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
import { useCreateBrief, useUpdateBrief, useBrief } from '@/api/hooks/useArtistSales'
import { BRIEF_STATUS_LABELS } from '@/types/artist-sales'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const briefFormSchema = z.object({
  account: z.number({ required_error: 'Account is required' }),
  campaign_title: z.string().min(1, 'Campaign title is required'),
  brand_category: z.string().optional(),
  received_date: z.string().min(1, 'Received date is required'),
  sla_due_date: z.string().optional(),
  brief_status: z.enum(['new', 'in_progress', 'quoted', 'lost', 'won']),
  budget_range_min: z.string().optional(),
  budget_range_max: z.string().optional(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'RON']).default('EUR'),
  deliverables_requested: z.string().optional(),
  notes: z.string().optional(),
})

type BriefFormData = z.infer<typeof briefFormSchema>

export default function BriefForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const briefId = id ? Number(id) : 0

  const { data: brief, isLoading: briefLoading } = useBrief(briefId, isEdit && briefId > 0)
  const createBrief = useCreateBrief()
  const updateBrief = useUpdateBrief()

  const form = useForm<BriefFormData>({
    resolver: zodResolver(briefFormSchema),
    defaultValues: {
      account: undefined,
      campaign_title: '',
      brand_category: '',
      received_date: new Date().toISOString().split('T')[0],
      sla_due_date: '',
      brief_status: 'new',
      budget_range_min: '',
      budget_range_max: '',
      currency: 'EUR',
      deliverables_requested: '',
      notes: '',
    },
  })

  // Load brief data when editing
  useEffect(() => {
    if (brief && isEdit) {
      form.reset({
        account: brief.account.id,
        campaign_title: brief.campaign_title,
        brand_category: brief.brand_category || '',
        received_date: brief.received_date,
        sla_due_date: brief.sla_due_date || '',
        brief_status: brief.brief_status,
        budget_range_min: brief.budget_range_min || '',
        budget_range_max: brief.budget_range_max || '',
        currency: brief.currency,
        deliverables_requested: brief.deliverables_requested || '',
        notes: brief.notes || '',
      })
    }
  }, [brief, isEdit, form])

  const onSubmit = async (data: BriefFormData) => {
    try {
      const payload = {
        ...data,
        brand_category: data.brand_category || undefined,
        sla_due_date: data.sla_due_date || undefined,
        budget_range_min: data.budget_range_min || undefined,
        budget_range_max: data.budget_range_max || undefined,
        deliverables_requested: data.deliverables_requested || undefined,
        notes: data.notes || undefined,
      }

      if (isEdit && brief) {
        await updateBrief.mutateAsync({
          id: brief.id,
          data: payload,
        })
        toast.success('Brief updated successfully')
      } else {
        await createBrief.mutateAsync(payload)
        toast.success('Brief created successfully')
      }
      navigate('/artist-sales/briefs')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save brief')
    }
  }

  if (isEdit && briefLoading) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/briefs')} aria-label="Go back to briefs">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? 'Edit Brief' : 'Create New Brief'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update brief details and track progress.'
                : 'Create a new brief to track incoming campaign requests.'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about this brief</CardDescription>
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
                        The company or brand submitting this brief
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="campaign_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Fashion, Tech, FMCG" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brief_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(BRIEF_STATUS_LABELS).map(([value, label]) => (
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="received_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Received Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sla_due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SLA Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          When response is due according to SLA
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Budget Information */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Information</CardTitle>
                <CardDescription>Expected budget range for this campaign</CardDescription>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget_range_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Budget</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="10000"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '')
                              field.onChange(value)
                            }}
                          />
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
                        <FormLabel>Maximum Budget</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="50000"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '')
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Deliverables & Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Deliverables & Additional Information</CardTitle>
                <CardDescription>What the client is requesting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="deliverables_requested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deliverables Requested</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the deliverables requested by the client..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this brief..."
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
                onClick={() => navigate('/artist-sales/briefs')}
                disabled={createBrief.isPending || updateBrief.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBrief.isPending || updateBrief.isPending}
              >
                {createBrief.isPending || updateBrief.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Update Brief'
                ) : (
                  'Create Brief'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  )
}
