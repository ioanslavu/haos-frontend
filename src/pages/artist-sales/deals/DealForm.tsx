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
import { useCreateDeal, useUpdateDeal, useDeal, useOpportunities } from '@/api/hooks/useArtistSales'
import { DEAL_STATUS_LABELS } from '@/types/artist-sales'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const dealFormSchema = z.object({
  opportunity: z.number({ required_error: 'Opportunity is required' }),
  deal_title: z.string().min(1, 'Deal title is required'),
  account: z.number({ required_error: 'Account is required' }),
  po_number: z.string().optional(),
  deal_status: z.enum(['draft', 'pending_signature', 'signed', 'active', 'in_execution', 'completed', 'on_hold', 'cancelled']),
  fee_total: z.string().min(1, 'Total fee is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  currency: z.enum(['EUR', 'USD', 'GBP', 'RON']).default('EUR'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
})

type DealFormData = z.infer<typeof dealFormSchema>

export default function DealForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const dealId = id ? Number(id) : 0

  const { data: deal, isLoading: dealLoading } = useDeal(dealId, isEdit && dealId > 0)
  const { data: opportunitiesData } = useOpportunities()
  const opportunities = opportunitiesData?.results || []
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      opportunity: undefined,
      deal_title: '',
      account: undefined,
      po_number: '',
      deal_status: 'draft',
      fee_total: '',
      currency: 'EUR',
      start_date: '',
      end_date: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (deal && isEdit) {
      form.reset({
        opportunity: deal.opportunity.id,
        deal_title: deal.deal_title,
        account: deal.account.id,
        po_number: deal.po_number || '',
        deal_status: deal.deal_status,
        fee_total: deal.fee_total,
        currency: deal.currency,
        start_date: deal.start_date || '',
        end_date: deal.end_date || '',
        notes: deal.notes || '',
      })
    }
  }, [deal, isEdit, form])

  const onSubmit = async (data: DealFormData) => {
    try {
      const payload = {
        ...data,
        po_number: data.po_number || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        notes: data.notes || undefined,
      }

      if (isEdit && deal) {
        await updateDeal.mutateAsync({
          id: deal.id,
          data: payload,
        })
        toast.success('Deal updated successfully')
      } else {
        await createDeal.mutateAsync(payload)
        toast.success('Deal created successfully')
      }
      navigate('/artist-sales/deals')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save deal')
    }
  }

  if (isEdit && dealLoading) {
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/deals')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? 'Edit Deal' : 'Create New Deal'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update deal details.' : 'Create a deal from an opportunity.'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="opportunity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opportunity *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? field.value.toString() : ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select opportunity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {opportunities.map((opp) => (
                            <SelectItem key={opp.id} value={opp.id.toString()}>
                              {opp.opp_name} - {opp.account.display_name}
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
                  name="deal_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter deal title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deal_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(DEAL_STATUS_LABELS).map(([value, label]) => (
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
                    name="po_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PO Number</FormLabel>
                        <FormControl>
                          <Input placeholder="PO-12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
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
                            <SelectValue />
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
                  name="fee_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Fee *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="100000.00"
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes..."
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

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/artist-sales/deals')}
                disabled={createDeal.isPending || updateDeal.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDeal.isPending || updateDeal.isPending}
              >
                {createDeal.isPending || updateDeal.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Update Deal'
                ) : (
                  'Create Deal'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  )
}
