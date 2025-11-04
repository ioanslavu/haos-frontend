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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
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
  asMenuItem?: boolean
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
  content_creation: [
    { key: 'content_pieces_created', label: 'Content Pieces Created', type: 'number' },
    { key: 'total_views', label: 'Total Views', type: 'number' },
    { key: 'engagement_rate', label: 'Engagement Rate (%)', type: 'number', step: '0.1' },
    { key: 'shares', label: 'Shares', type: 'number' },
  ],
  social_media_mgmt: [
    { key: 'posts_published', label: 'Posts Published', type: 'number' },
    { key: 'followers_gained', label: 'Followers Gained', type: 'number' },
    { key: 'engagement_rate', label: 'Engagement Rate (%)', type: 'number', step: '0.1' },
    { key: 'reach', label: 'Total Reach', type: 'number' },
  ],
  influencer_marketing: [
    { key: 'influencers_contacted', label: 'Influencers Contacted', type: 'number' },
    { key: 'partnerships_secured', label: 'Partnerships Secured', type: 'number' },
    { key: 'total_reach', label: 'Total Reach', type: 'number' },
    { key: 'engagement_rate', label: 'Engagement Rate (%)', type: 'number', step: '0.1' },
  ],
  seo: [
    { key: 'keywords_targeted', label: 'Keywords Targeted', type: 'number' },
    { key: 'rankings_improved', label: 'Rankings Improved', type: 'number' },
    { key: 'organic_traffic', label: 'Organic Traffic', type: 'number' },
    { key: 'conversion_rate', label: 'Conversion Rate (%)', type: 'number', step: '0.1' },
  ],
  email_marketing: [
    { key: 'emails_sent', label: 'Emails Sent', type: 'number' },
    { key: 'open_rate', label: 'Open Rate (%)', type: 'number', step: '0.1' },
    { key: 'click_rate', label: 'Click Rate (%)', type: 'number', step: '0.1' },
    { key: 'conversions', label: 'Conversions', type: 'number' },
  ],
}

export function ServiceMetricsUpdateDialog({
  campaign,
  children,
  variant = 'default',
  size = 'default',
  asMenuItem = false,
}: ServiceMetricsUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { user, isAdminOrManager } = useAuthStore()
  const updateCampaign = useUpdateCampaign()

  // Get the first service type for metrics (campaigns can have multiple service types)
  const primaryServiceType = useMemo(() => {
    if (campaign.service_types && campaign.service_types.length > 0) {
      return campaign.service_types[0]
    }
    return ''
  }, [campaign])

  // Initialize form data from campaign.department_data
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {}
    const metrics = SERVICE_METRICS[primaryServiceType] || []
    metrics.forEach((metric) => {
      initialData[metric.key] = campaign.department_data?.[metric.key]?.toString() || ''
    })
    return initialData
  })

  // Check if user has permission to update metrics
  const canUpdate = useMemo(() => {
    // Admins can always update
    if (isAdminOrManager()) return true

    // Check if user is assigned to this campaign
    if (campaign.assignments && user) {
      return campaign.assignments.some(assignment => assignment.user === Number(user.id))
    }

    return false
  }, [campaign, user, isAdminOrManager])

  // Get metrics fields for current service type
  const metricFields = useMemo(() => {
    return SERVICE_METRICS[primaryServiceType] || []
  }, [primaryServiceType])

  // Check if metrics can be updated
  const canShowMetrics = canUpdate && primaryServiceType && metricFields.length > 0

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

  // When NOT used as menu item, don't render if conditions aren't met
  if (!asMenuItem && !canShowMetrics) {
    return null
  }

  // When used as a menu item, always show it (but handle disabled state)
  if (asMenuItem) {
    if (!canShowMetrics) {
      // Show disabled menu item with tooltip info
      return (
        <DropdownMenuItem disabled>
          <Edit3 className="h-4 w-4 mr-2" />
          Update Metrics
        </DropdownMenuItem>
      )
    }

    return (
      <>
        <DropdownMenuItem onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}>
          <Edit3 className="h-4 w-4 mr-2" />
          Update Metrics
        </DropdownMenuItem>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Update Service Metrics</DialogTitle>
                <DialogDescription>
                  Update progress metrics for <strong>{campaign.campaign_name}</strong>
                  <br />
                  Service: <strong>
                    {campaign.service_types_display?.[0] ||
                     primaryServiceType}
                  </strong>
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
      </>
    )
  }

  // When used as a standalone button
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
              Service: <strong>
                {campaign.service_types_display?.[0] ||
                 primaryServiceType}
              </strong>
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
