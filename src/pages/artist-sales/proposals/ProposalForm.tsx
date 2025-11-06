import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { useCreateProposal, useUpdateProposal, useProposal, useOpportunities, useCreateProposalArtist, useCreateDealDeliverable } from '@/api/hooks/useArtistSales'
import { PROPOSAL_STATUS_LABELS } from '@/types/artist-sales'
import { ArrowLeft, Loader2, Wand2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { ProposalBuilder, ProposalBuilderData } from './components/ProposalBuilder'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const proposalFormSchema = z.object({
  opportunity: z.number({ required_error: 'Opportunity is required' }),
  proposal_status: z.enum(['draft', 'pending_approval', 'sent', 'accepted', 'rejected']),
  fee_gross: z.string().min(1, 'Gross fee is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  fee_net: z.string().min(1, 'Net fee is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  currency: z.enum(['EUR', 'USD', 'GBP', 'RON']).default('EUR'),
  version: z.number().optional(),
  sent_date: z.string().optional(),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
})

type ProposalFormData = z.infer<typeof proposalFormSchema>

export default function ProposalForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const proposalId = id ? Number(id) : 0

  // Get opportunityId from URL if present (for pre-selection in wizard)
  const urlOpportunityId = searchParams.get('opportunityId')
  const preSelectedOpportunityId = urlOpportunityId ? Number(urlOpportunityId) : undefined

  // Mode: 'wizard' for new proposals, 'form' for quick entry and edits
  const [mode, setMode] = useState<'wizard' | 'form'>(isEdit ? 'form' : 'wizard')

  const { data: proposal, isLoading: proposalLoading } = useProposal(proposalId, isEdit && proposalId > 0)
  const { data: opportunitiesData } = useOpportunities()
  const opportunities = opportunitiesData?.results || []
  const createProposal = useCreateProposal()
  const updateProposal = useUpdateProposal()
  const createProposalArtist = useCreateProposalArtist()

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      opportunity: undefined,
      proposal_status: 'draft',
      fee_gross: '',
      fee_net: '',
      currency: 'EUR',
      version: 1,
      sent_date: '',
      valid_until: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (proposal && isEdit) {
      form.reset({
        opportunity: proposal.opportunity.id,
        proposal_status: proposal.proposal_status,
        fee_gross: proposal.fee_gross,
        fee_net: proposal.fee_net,
        currency: proposal.currency,
        version: proposal.version,
        sent_date: proposal.sent_date || '',
        valid_until: proposal.valid_until || '',
        notes: proposal.notes || '',
      })
    }
  }, [proposal, isEdit, form])

  const onSubmit = async (data: ProposalFormData) => {
    try {
      const payload = {
        ...data,
        sent_date: data.sent_date || undefined,
        valid_until: data.valid_until || undefined,
        notes: data.notes || undefined,
      }

      if (isEdit && proposal) {
        await updateProposal.mutateAsync({
          id: proposal.id,
          data: payload,
        })
        toast.success('Proposal updated successfully')
      } else {
        await createProposal.mutateAsync(payload)
        toast.success('Proposal created successfully')
      }
      navigate('/artist-sales/proposals')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save proposal')
    }
  }

  const handleWizardSubmit = async (wizardData: ProposalBuilderData) => {
    try {
      if (!wizardData.opportunityId) {
        toast.error('Please select an opportunity')
        return
      }

      // Calculate fee_net from wizard data - ensure all values are valid numbers
      const feeGross = parseFloat(wizardData.feeGross || '0') || 0
      const discounts = parseFloat(wizardData.discounts || '0') || 0
      const agencyFee = parseFloat(wizardData.agencyFee || '0') || 0
      const feeNet = Math.max(0, feeGross - discounts + agencyFee).toFixed(2)

      // Validate that fee_net is not negative
      if (parseFloat(feeNet) < 0) {
        toast.error('Net fee cannot be negative. Please adjust discounts.')
        return
      }

      // Create the proposal
      const proposalPayload = {
        opportunity: wizardData.opportunityId,
        proposal_status: 'draft' as const,
        fee_gross: feeGross.toFixed(2),
        fee_net: feeNet,
        discounts: discounts.toFixed(2),
        agency_fee: agencyFee.toFixed(2),
        currency: wizardData.currency,
        notes: wizardData.notes || undefined,
        usage_terms: wizardData.usageTermsId,
      }

      const createdProposal = await createProposal.mutateAsync(proposalPayload)

      // Create proposal artists
      if (wizardData.artists.length > 0) {
        await Promise.all(
          wizardData.artists.map((artist) =>
            createProposalArtist.mutateAsync({
              proposal: createdProposal.id,
              artist: artist.artistId,
              role: artist.role,
              proposed_fee: artist.proposedFee,
            })
          )
        )
      }

      toast.success('Proposal created successfully with wizard')
      navigate('/artist-sales/proposals')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create proposal')
    }
  }

  if (isEdit && proposalLoading) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/proposals')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? 'Edit Proposal' : 'Create New Proposal'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update proposal details.' : 'Create a proposal for an opportunity.'}
            </p>
          </div>
          {!isEdit && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'wizard' | 'form')} className="w-auto">
              <TabsList>
                <TabsTrigger value="wizard">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Wizard
                </TabsTrigger>
                <TabsTrigger value="form">
                  <FileText className="mr-2 h-4 w-4" />
                  Quick Form
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {mode === 'wizard' && !isEdit ? (
          <ProposalBuilder
            opportunityId={preSelectedOpportunityId || 0}
            onSubmit={handleWizardSubmit}
            onCancel={() => navigate('/artist-sales/proposals')}
          />
        ) : (
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="proposal_status"
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
                            {Object.entries(PROPOSAL_STATUS_LABELS).map(([value, label]) => (
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
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fee_gross"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gross Fee *</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="fee_net"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Fee *</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="40000.00"
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sent_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sent Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valid_until"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
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
                onClick={() => navigate('/artist-sales/proposals')}
                disabled={createProposal.isPending || updateProposal.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProposal.isPending || updateProposal.isPending}
              >
                {createProposal.isPending || updateProposal.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Update Proposal'
                ) : (
                  'Create Proposal'
                )}
              </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </AppLayout>
  )
}
