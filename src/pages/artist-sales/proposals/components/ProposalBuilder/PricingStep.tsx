import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProposalBuilderData } from './index'
import { Separator } from '@/components/ui/separator'
import { useMemo } from 'react'

interface PricingStepProps {
  data: ProposalBuilderData
  updateData: (updates: Partial<ProposalBuilderData>) => void
}

export function PricingStep({ data, updateData }: PricingStepProps) {
  const feeNet = useMemo(() => {
    const gross = parseFloat(data.feeGross || '0') || 0
    const discount = parseFloat(data.discounts || '0') || 0
    const agency = parseFloat(data.agencyFee || '0') || 0
    return gross - discount + agency
  }, [data.feeGross, data.discounts, data.agencyFee])

  const handleBlur = (field: 'feeGross' | 'discounts' | 'agencyFee', value: string) => {
    // Auto-fill "0" for empty fields on blur
    if (!value || value.trim() === '') {
      updateData({ [field]: '0' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select value={data.currency} onValueChange={(value) => updateData({ currency: value })}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="RON">RON (Lei)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feeGross">Gross Fee *</Label>
          <Input
            id="feeGross"
            type="number"
            step="0.01"
            min="0"
            value={data.feeGross}
            onChange={(e) => updateData({ feeGross: e.target.value })}
            onBlur={(e) => handleBlur('feeGross', e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Total fee before discounts and agency fees
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discounts">Discounts</Label>
          <Input
            id="discounts"
            type="number"
            step="0.01"
            min="0"
            value={data.discounts}
            onChange={(e) => updateData({ discounts: e.target.value })}
            onBlur={(e) => handleBlur('discounts', e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Any discounts or deductions (will be subtracted)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agencyFee">Agency Fee</Label>
          <Input
            id="agencyFee"
            type="number"
            step="0.01"
            min="0"
            value={data.agencyFee}
            onChange={(e) => updateData({ agencyFee: e.target.value })}
            onBlur={(e) => handleBlur('agencyFee', e.target.value)}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Additional agency or service fees (will be added)
          </p>
        </div>

        <Separator className="my-4" />

        {/* Net Fee Calculation */}
        <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Net Fee:</span>
            <span className="text-2xl font-bold text-primary">
              {data.currency} {feeNet.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This is the total amount the client will pay
          </p>
        </div>

        <div className="space-y-2 mt-6">
          <Label htmlFor="notes">Additional Notes (optional)</Label>
          <Textarea
            id="notes"
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            placeholder="Add any additional details, terms, or conditions..."
            rows={4}
          />
        </div>
      </div>

      {parseFloat(data.feeGross) === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Please enter a gross fee greater than zero to continue.
        </p>
      )}
    </div>
  )
}
