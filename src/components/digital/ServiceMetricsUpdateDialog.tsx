import { useState, useMemo } from 'react'
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
import { Edit3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ServiceMetricsUpdateDialogProps {
  campaign: Campaign
  children?: React.ReactNode
  variant?: 'default' | 'icon' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

interface MetricField {
  key: string
  label: string
  type?: 'number' | 'text'
  step?: string
}

// Define metrics for each service type
const SERVICE_METRICS: Record<string, MetricField[]> = {
  dsp_distribution: [
    { key: 'tracks_delivered', label: 'Piese livrate', type: 'number' },
    { key: 'tracks_pending', label: 'În pending', type: 'number' },
    { key: 'tracks_in_qc', label: 'În QC', type: 'number' },
    { key: 'tracks_rejected', label: 'Respinse', type: 'number' },
  ],
  youtube_cms: [
    { key: 'new_clips', label: 'Clipuri noi', type: 'number' },
    { key: 'revenue_estimate', label: 'Estimare venituri ($)', type: 'number', step: '0.01' },
    { key: 'active_disputes', label: 'Dispute active', type: 'number' },
    { key: 'strikes', label: 'Strike-uri', type: 'number' },
  ],
  tiktok_ugc: [
    { key: 'clips_generated', label: 'Clipuri generate', type: 'number' },
    { key: 'avg_engagement', label: 'Engagement mediu (%)', type: 'number', step: '0.1' },
    { key: 'total_views', label: 'Total vizualizări', type: 'number' },
  ],
  playlist_pitching: [
    { key: 'contacts_sent', label: 'Contacte trimise', type: 'number' },
    { key: 'responses_received', label: 'Răspunsuri primite', type: 'number' },
    { key: 'tracks_accepted', label: 'Piese acceptate', type: 'number' },
  ],
  radio_plugging: [
    { key: 'contacts_sent', label: 'Contacte trimise', type: 'number' },
    { key: 'responses_received', label: 'Răspunsuri primite', type: 'number' },
    { key: 'tracks_accepted', label: 'Piese acceptate', type: 'number' },
  ],
  ppc: [
    { key: 'conversions', label: 'Conversii', type: 'number' },
    { key: 'cost_per_result', label: 'Cost per rezultat ($)', type: 'number', step: '0.01' },
  ],
}

export function ServiceMetricsUpdateDialog({
  campaign,
  children,
  variant = 'default',
  size = 'default',
}: ServiceMetricsUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { user, isAdminOrManager } = useAuthStore()
  const updateCampaign = useUpdateCampaign()

  // Initialize form data from campaign.department_data
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {}
    const metrics = SERVICE_METRICS[campaign.service_type || ''] || []
    metrics.forEach((metric) => {
      initialData[metric.key] = campaign.department_data?.[metric.key]?.toString() || ''
    })
    return initialData
  })

  // Check if user has permission to update metrics
  const canUpdate = useMemo(() => {
    // Admins can always update
    if (isAdminOrManager()) return true

    // Check if user is a handler for this campaign
    if (campaign.handlers && user) {
      return campaign.handlers.some(handler => handler.user === Number(user.id))
    }

    return false
  }, [campaign, user, isAdminOrManager])

  // Get metrics fields for current service type
  const metricFields = useMemo(() => {
    return SERVICE_METRICS[campaign.service_type || ''] || []
  }, [campaign.service_type])

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Convert form data to numbers where appropriate
      const departmentData: Record<string, any> = { ...campaign.department_data }

      metricFields.forEach((field) => {
        const value = formData[field.key]
        if (value === '' || value === null || value === undefined) {
          // Remove empty values
          delete departmentData[field.key]
        } else {
          // Convert to number if it's a number field
          departmentData[field.key] = field.type === 'number' ? Number(value) : value
        }
      })

      await updateCampaign.mutateAsync({
        id: campaign.id,
        data: {
          department_data: departmentData,
        },
      })

      toast({
        title: 'Success',
        description: 'Service metrics updated successfully',
      })

      setOpen(false)
    } catch (error) {
      console.error('Error updating metrics:', error)
      toast({
        title: 'Error',
        description: 'Failed to update service metrics',
        variant: 'destructive',
      })
    }
  }

  // Don't render if user doesn't have permission
  if (!canUpdate) {
    return null
  }

  // Don't render if no service type or no metrics defined for this service
  if (!campaign.service_type || metricFields.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={variant} size={size}>
            <Edit3 className="h-4 w-4 mr-2" />
            Update Metrics
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Service Metrics</DialogTitle>
            <DialogDescription>
              Update progress metrics for <strong>{campaign.campaign_name}</strong>
              <br />
              Service: <strong>{campaign.service_type_display || campaign.service_type}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {metricFields.map((field) => (
              <div key={field.key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={field.key} className="text-right">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  step={field.step}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="col-span-3"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
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
              {updateCampaign.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
