/**
 * Proposal Wizard - Multi-step proposal creation
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUpdateOpportunity } from '@/api/hooks/useOpportunities';
import { formatMoney } from '@/lib/utils';
import { toast } from 'sonner';

const proposalSchema = z.object({
  fee_gross: z.string().min(1, 'Gross fee is required'),
  agency_fee: z.string().optional(),
  discounts: z.string().optional(),
  proposal_sent_date: z.string().optional(),
  proposal_valid_until: z.string().optional(),
  notes: z.string().optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: number;
  currentData?: any;
  currency: string;
}

export function ProposalWizard({ open, onOpenChange, opportunityId, currentData, currency }: ProposalWizardProps) {
  const [step, setStep] = useState(1);
  const updateMutation = useUpdateOpportunity();

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      fee_gross: currentData?.fee_gross || '',
      agency_fee: currentData?.agency_fee || '',
      discounts: currentData?.discounts || '',
      proposal_sent_date: currentData?.proposal_sent_date || new Date().toISOString().split('T')[0],
      proposal_valid_until: currentData?.proposal_valid_until || '',
      notes: '',
    },
  });

  const feeGross = parseFloat(form.watch('fee_gross') || '0');
  const agencyFee = parseFloat(form.watch('agency_fee') || '0');
  const discounts = parseFloat(form.watch('discounts') || '0');
  const feeNet = feeGross - agencyFee - discounts;

  const onSubmit = async (data: ProposalFormData) => {
    try {
      const proposalVersion = (currentData?.proposal_version || 0) + 1;

      await updateMutation.mutateAsync({
        id: opportunityId,
        data: {
          ...data,
          fee_net: feeNet.toFixed(2),
          proposal_version: proposalVersion,
          stage: 'proposal_sent',
        },
      });

      onOpenChange(false);
      toast.success('Proposal created successfully!');
      form.reset();
      setStep(1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create proposal');
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Proposal</DialogTitle>
          <DialogDescription>
            Build and send a professional proposal
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  s === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : s < step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-full h-0.5 mx-2 ${s < step ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Financial Breakdown */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base mb-4">Financial Breakdown</h3>
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Define the pricing structure for this proposal
                    </p>
                  </Card>
                </div>

                <FormField
                  control={form.control}
                  name="fee_gross"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross Fee *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Total fee before deductions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="agency_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discounts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discounts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Net Fee Preview */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Net Fee:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatMoney(feeNet, currency)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Gross Fee:</span>
                      <span>{formatMoney(feeGross, currency)}</span>
                    </div>
                    {agencyFee > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Agency Fee:</span>
                        <span>-{formatMoney(agencyFee, currency)}</span>
                      </div>
                    )}
                    {discounts > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discounts:</span>
                        <span>-{formatMoney(discounts, currency)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Step 2: Dates & Validity */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base mb-4">Proposal Details</h3>
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Set proposal dates and validity period
                    </p>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="proposal_sent_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sent Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposal_valid_until"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          Proposal expiration date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes about this proposal..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Review & Send */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base mb-4">Review Proposal</h3>
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Review your proposal before sending
                    </p>
                  </Card>
                </div>

                {/* Financial Summary */}
                <Card className="p-4">
                  <h4 className="font-semibold text-sm mb-3">Financial Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Gross Fee:</span>
                      <span className="font-medium">{formatMoney(feeGross, currency)}</span>
                    </div>
                    {agencyFee > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Agency Fee:</span>
                        <span>-{formatMoney(agencyFee, currency)}</span>
                      </div>
                    )}
                    {discounts > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discounts:</span>
                        <span>-{formatMoney(discounts, currency)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-bold text-primary">
                      <span>Net Fee:</span>
                      <span>{formatMoney(feeNet, currency)}</span>
                    </div>
                  </div>
                </Card>

                {/* Proposal Info */}
                <Card className="p-4">
                  <h4 className="font-semibold text-sm mb-3">Proposal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <Badge variant="outline">v{(currentData?.proposal_version || 0) + 1}</Badge>
                    </div>
                    {form.watch('proposal_sent_date') && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sent Date:</span>
                        <span>{form.watch('proposal_sent_date')}</span>
                      </div>
                    )}
                    {form.watch('proposal_valid_until') && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid Until:</span>
                        <span>{form.watch('proposal_valid_until')}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    This will update the opportunity stage to "Proposal Sent" and create version {(currentData?.proposal_version || 0) + 1} of the proposal.
                  </p>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={step === 1 ? handleClose : prevStep}
              >
                {step === 1 ? 'Cancel' : (
                  <>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </>
                )}
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Proposal
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
