import { useState } from 'react'
import { Campaign } from '@/types/campaign'
import { useAuthStore } from '@/stores/authStore'
import { useUpdateCampaign } from '@/api/hooks/useCampaigns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface KPIProgressUpdateDialogProps {
  campaign: Campaign
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function KPIProgressUpdateDialog({
  campaign,
  variant = 'default',
  size = 'default',
}: KPIProgressUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { isAdminOrManager } = useAuthStore()
  const updateCampaign = useUpdateCampaign()

  // Initialize form data from campaign.kpi_actuals
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {}
    if (campaign.kpi_targets) {
      Object.keys(campaign.kpi_targets).forEach((kpiName) => {
        initialData[kpiName] = campaign.kpi_actuals?.[kpiName]?.actual?.toString() || ''
      })
    }
    return initialData
  })

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Convert form data to kpi_actuals format
      const kpiActuals: Record<string, { actual: number; unit: string }> = {}

      Object.entries(formData).forEach(([kpiName, value]) => {
        const target = campaign.kpi_targets?.[kpiName]
        if (target && value && value !== '') {
          kpiActuals[kpiName] = {
            actual: Number(value),
            unit: target.unit || '',
          }
        }
      })

      await updateCampaign.mutateAsync({
        id: campaign.id,
        data: {
          kpi_actuals: kpiActuals,
        },
      })

      toast({
        title: 'Success',
        description: 'KPI progress updated successfully',
      })

      setOpen(false)
    } catch (error) {
      console.error('Error updating KPI progress:', error)
      toast({
        title: 'Error',
        description: 'Failed to update KPI progress',
        variant: 'destructive',
      })
    }
  }

  // Don't render if no KPI targets or user doesn't have permission
  if (!campaign.kpi_targets || Object.keys(campaign.kpi_targets).length === 0 || !isAdminOrManager()) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Update Progress
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update KPI Progress</DialogTitle>
            <DialogDescription>
              Update actual achieved values for <strong>{campaign.campaign_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {Object.entries(campaign.kpi_targets).map(([kpiName, targetData]) => (
              <div key={kpiName} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={kpiName} className="text-right capitalize">
                  {kpiName.replace(/_/g, ' ')}
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id={kpiName}
                    type="number"
                    step="0.01"
                    value={formData[kpiName] || ''}
                    onChange={(e) => handleInputChange(kpiName, e.target.value)}
                    placeholder={`Target: ${targetData.target.toLocaleString()} ${targetData.unit}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Target: {targetData.target.toLocaleString()} {targetData.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCampaign.isPending}
            >
              {updateCampaign.isPending ? 'Saving...' : 'Save Progress'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
