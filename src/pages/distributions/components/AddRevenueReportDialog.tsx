import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { distributionsService } from '@/api/services/distributions.service'
import { DistributionRevenueReportFormData, Platform } from '@/types/distribution'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface AddRevenueReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  distributionId: number
  catalogItemId: number
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple_music', label: 'Apple Music' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'amazon_music', label: 'Amazon Music' },
  { value: 'deezer', label: 'Deezer' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'soundcloud', label: 'SoundCloud' },
]

export function AddRevenueReportDialog({
  open,
  onOpenChange,
  distributionId,
  catalogItemId,
}: AddRevenueReportDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset } = useForm<DistributionRevenueReportFormData>({
    defaultValues: {
      currency: 'EUR',
      reporting_period: new Date().toISOString().split('T')[0],
    },
  })

  const addReportMutation = useMutation({
    mutationFn: (data: DistributionRevenueReportFormData) =>
      distributionsService.addRevenueReport(distributionId, catalogItemId, data),
    onSuccess: () => {
      toast({ title: 'Revenue report added successfully' })
      // Invalidate with string to match URL param type
      queryClient.invalidateQueries({ queryKey: ['distribution', distributionId.toString()] })
      // Also invalidate the distributions list
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      onOpenChange(false)
      reset()
    },
    onError: () => {
      toast({ title: 'Failed to add revenue report', variant: 'destructive' })
    },
  })

  const onSubmit = (data: DistributionRevenueReportFormData) => {
    addReportMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Revenue Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Platform */}
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={watch('platform')}
                onValueChange={(value) => setValue('platform', value as Platform)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reporting Period */}
            <div className="space-y-2">
              <Label htmlFor="reporting_period">Reporting Period (Month) *</Label>
              <Input
                id="reporting_period"
                type="month"
                {...register('reporting_period', { required: true })}
              />
              <p className="text-xs text-muted-foreground">Select the month and year</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Amount */}
            <div className="space-y-2">
              <Label htmlFor="revenue_amount">Revenue Amount *</Label>
              <Input
                id="revenue_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('revenue_amount', { required: true })}
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={watch('currency')}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="streams">Streams (Optional)</Label>
              <Input
                id="streams"
                type="number"
                min="0"
                placeholder="Number of streams"
                {...register('streams')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="downloads">Downloads (Optional)</Label>
              <Input
                id="downloads"
                type="number"
                min="0"
                placeholder="Number of downloads"
                {...register('downloads')}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Additional notes about this revenue report..."
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addReportMutation.isPending}>
              Add Revenue Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
