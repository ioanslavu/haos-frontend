import { useEffect, useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { RecordingSearchCombobox } from '@/components/catalog/RecordingSearchCombobox'
import { EntityFormDialog } from './EntityFormDialog'
import { ContactPersonFormDialog } from './ContactPersonFormDialog'
import { useCreateCampaign, useUpdateCampaign } from '@/api/hooks/useCampaigns'
import { Campaign, CampaignStatus, CAMPAIGN_STATUS_LABELS, CAMPAIGN_HANDLER_ROLE_LABELS } from '@/types/campaign'
import { useUsersList } from '@/api/hooks/useUsers'
import { useAuthStore } from '@/stores/authStore'
import { useContactPersons } from '@/api/hooks/useEntities'
import { Plus, X, Users, UserPlus, Target, DollarSign, Calendar, BarChart3, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import {
  SERVICE_TYPE_LABELS,
  PLATFORM_LABELS,
  SERVICE_TYPE_CHOICES,
  PLATFORM_CHOICES
} from '@/api/types/campaigns'

const handlerSchema = z.object({
  user: z.number().optional(),
  role: z.enum(['lead', 'support', 'observer']),
})

const kpiTargetSchema = z.object({
  name: z.string().min(1, 'KPI name is required'),
  target: z.string().min(1, 'Target value is required'),
  unit: z.string().optional(),
})

const digitalCampaignFormSchema = z.object({
  // Basic fields (from original)
  campaign_name: z.string().min(1, 'Campaign name is required'),
  client: z.number({ required_error: 'Client is required' }),
  artist: z.number().optional().nullable(),
  brand: z.number({ required_error: 'Brand is required' }),
  song: z.number().optional().nullable(),
  contact_person: z.number().optional().nullable(),
  value: z.string().min(1, 'Value is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid value format'),
  status: z.enum(['lead', 'negotiation', 'confirmed', 'active', 'completed', 'lost']),
  confirmed_at: z.string().optional(),
  notes: z.string().optional(),
  handlers: z.array(handlerSchema).optional(),

  // Digital department specific fields
  service_type: z.enum(SERVICE_TYPE_CHOICES as [string, ...string[]]).optional(),
  platform: z.enum(PLATFORM_CHOICES as [string, ...string[]]).optional(),
  budget_allocated: z.string().optional(),
  budget_spent: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  kpi_targets: z.array(kpiTargetSchema).optional(),
  client_health_score: z.number().min(1).max(10).optional(),
})

type DigitalCampaignFormData = z.infer<typeof digitalCampaignFormSchema>

interface DigitalCampaignFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
}

export function DigitalCampaignFormDialog({ open, onOpenChange, campaign }: DigitalCampaignFormDialogProps) {
  const [showClientAdd, setShowClientAdd] = useState(false)
  const [showArtistAdd, setShowArtistAdd] = useState(false)
  const [showBrandAdd, setShowBrandAdd] = useState(false)
  const [showContactPersonAdd, setShowContactPersonAdd] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const isEdit = !!campaign

  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  // Get current user
  const currentUser = useAuthStore((state) => state.user)

  // Fetch users for handler selection
  const { data: usersData } = useUsersList({ is_active: true })
  const users = usersData?.results || []

  const form = useForm<DigitalCampaignFormData>({
    resolver: zodResolver(digitalCampaignFormSchema),
    defaultValues: {
      campaign_name: '',
      client: undefined,
      artist: null,
      brand: undefined,
      song: null,
      contact_person: null,
      value: '',
      status: 'lead',
      confirmed_at: '',
      notes: '',
      handlers: [],
      service_type: undefined,
      platform: undefined,
      budget_allocated: '',
      budget_spent: '0',
      start_date: '',
      end_date: '',
      kpi_targets: [],
      client_health_score: 8,
    },
  })

  // Watch fields for conditional rendering
  const selectedClientId = form.watch('client')
  const selectedServiceType = form.watch('service_type')
  const budgetAllocated = form.watch('budget_allocated')
  const budgetSpent = form.watch('budget_spent')
  const statusValue = form.watch('status')

  // Calculate budget utilization
  const budgetUtilization = useMemo(() => {
    const allocated = parseFloat(budgetAllocated || '0')
    const spent = parseFloat(budgetSpent || '0')
    if (allocated === 0) return 0
    return (spent / allocated) * 100
  }, [budgetAllocated, budgetSpent])

  // Fetch contact persons for selected client
  const { data: contactPersonsData, isLoading: contactPersonsLoading } = useContactPersons(
    selectedClientId,
    !!selectedClientId
  )
  const contactPersons = useMemo(() => contactPersonsData || [], [contactPersonsData])

  // Handler field array
  const {
    fields: handlerFields,
    append: appendHandler,
    remove: removeHandler,
  } = useFieldArray({
    control: form.control,
    name: 'handlers',
  })

  // KPI targets field array
  const {
    fields: kpiFields,
    append: appendKpi,
    remove: removeKpi,
  } = useFieldArray({
    control: form.control,
    name: 'kpi_targets',
  })

  // Get platform recommendations based on service type
  const recommendedPlatforms = useMemo(() => {
    switch (selectedServiceType) {
      case 'ppc':
        return ['meta', 'google', 'tiktok']
      case 'tiktok_ugc':
        return ['tiktok']
      case 'dsp_distribution':
        return ['spotify', 'apple_music', 'youtube_music']
      case 'playlist_pitching':
        return ['spotify', 'apple_music']
      case 'radio_plugging':
        return ['other']
      case 'youtube_cms':
        return ['youtube']
      default:
        return []
    }
  }, [selectedServiceType])

  // Get KPI recommendations based on service type
  const recommendedKPIs = useMemo(() => {
    switch (selectedServiceType) {
      case 'ppc':
        return [
          { name: 'Impressions', unit: 'views' },
          { name: 'Clicks', unit: 'clicks' },
          { name: 'CTR', unit: '%' },
          { name: 'Conversions', unit: 'conversions' },
          { name: 'CPA', unit: '€' },
        ]
      case 'tiktok_ugc':
        return [
          { name: 'Views', unit: 'views' },
          { name: 'Engagement Rate', unit: '%' },
          { name: 'Shares', unit: 'shares' },
          { name: 'Comments', unit: 'comments' },
        ]
      case 'dsp_distribution':
        return [
          { name: 'Streams', unit: 'streams' },
          { name: 'Monthly Listeners', unit: 'listeners' },
          { name: 'Playlist Adds', unit: 'playlists' },
          { name: 'Revenue', unit: '€' },
        ]
      case 'playlist_pitching':
        return [
          { name: 'Pitches Sent', unit: 'pitches' },
          { name: 'Acceptance Rate', unit: '%' },
          { name: 'Total Reach', unit: 'listeners' },
          { name: 'Playlist Followers', unit: 'followers' },
        ]
      default:
        return []
    }
  }, [selectedServiceType])

  // Reset form when dialog opens/closes or campaign changes
  useEffect(() => {
    if (open) {
      if (campaign) {
        form.reset({
          campaign_name: campaign.campaign_name,
          client: campaign.client.id,
          artist: campaign.artist?.id || null,
          brand: campaign.brand.id,
          song: campaign.song?.id || null,
          contact_person: campaign.contact_person?.id || null,
          value: campaign.value,
          status: campaign.status,
          confirmed_at: campaign.confirmed_at || '',
          notes: campaign.notes || '',
          handlers: campaign.handlers?.map(h => ({ user: h.user, role: h.role })) || [],
          service_type: campaign.service_type,
          platform: campaign.platform,
          budget_allocated: campaign.budget_allocated || '',
          budget_spent: campaign.budget_spent || '0',
          start_date: campaign.start_date || '',
          end_date: campaign.end_date || '',
          kpi_targets: campaign.kpi_targets ? Object.entries(campaign.kpi_targets).map(([name, target]) => ({
            name,
            target: String(target),
            unit: '',
          })) : [],
          client_health_score: campaign.client_health_score || 8,
        })
      } else {
        form.reset()
      }
    }
  }, [open, campaign, form])

  // Auto-set confirmed_at when status changes
  useEffect(() => {
    if (['confirmed', 'active', 'completed'].includes(statusValue) && !form.getValues('confirmed_at')) {
      form.setValue('confirmed_at', new Date().toISOString().split('T')[0])
    }
  }, [statusValue, form])

  const onSubmit = async (data: DigitalCampaignFormData) => {
    try {
      // Convert KPI targets array to object
      const kpiTargetsObject = data.kpi_targets?.reduce((acc, kpi) => {
        if (kpi.name && kpi.target) {
          acc[kpi.name] = kpi.target
        }
        return acc
      }, {} as Record<string, string>) || {}

      // Filter out handlers without a user
      const validHandlers = data.handlers?.filter(h => h.user !== undefined && h.user !== null) || []

      const payload = {
        ...data,
        confirmed_at: data.confirmed_at || undefined,
        notes: data.notes || undefined,
        handlers: validHandlers.length > 0 ? validHandlers : undefined,
        service_type: data.service_type || undefined,
        platform: data.platform || undefined,
        budget_allocated: data.budget_allocated || undefined,
        budget_spent: data.budget_spent || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        kpi_targets: Object.keys(kpiTargetsObject).length > 0 ? kpiTargetsObject : undefined,
        client_health_score: data.client_health_score || undefined,
      }

      if (isEdit && campaign) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          data: payload,
        })
        toast.success('Campaign updated successfully')
      } else {
        await createCampaign.mutateAsync(payload)
        toast.success('Campaign created successfully')
      }
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save campaign')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Digital Campaign' : 'Create Digital Campaign'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update campaign details, budget, and KPI targets.'
                : 'Create a new digital marketing campaign with service-specific KPIs.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="service">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Service & Platform
                  </TabsTrigger>
                  <TabsTrigger value="budget">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget & Timeline
                  </TabsTrigger>
                  <TabsTrigger value="kpis">
                    <Target className="h-4 w-4 mr-2" />
                    KPIs
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* Campaign Name */}
                  <FormField
                    control={form.control}
                    name="campaign_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Client */}
                    <FormField
                      control={form.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl className="flex-1">
                              <EntitySearchCombobox
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Search for client..."
                                filter={{ has_role: 'client' }}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowClientAdd(true)}
                              title="Add new client"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Brand */}
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl className="flex-1">
                              <EntitySearchCombobox
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Search for brand..."
                                filter={{ has_role: 'brand' }}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowBrandAdd(true)}
                              title="Add new brand"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Artist & Song */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="artist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Artist (Optional)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl className="flex-1">
                              <EntitySearchCombobox
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Search for artist..."
                                filter={{ has_role: 'artist' }}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowArtistAdd(true)}
                              title="Add new artist"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="song"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Song (Optional)</FormLabel>
                          <FormControl>
                            <RecordingSearchCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Search for song..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Status & Health Score */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
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
                              {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
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
                      name="client_health_score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Health Score (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any additional notes..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Service & Platform Tab */}
                <TabsContent value="service" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Service Type */}
                    <FormField
                      control={form.control}
                      name="service_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SERVICE_TYPE_CHOICES.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {SERVICE_TYPE_LABELS[value as keyof typeof SERVICE_TYPE_LABELS] || value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of digital service for this campaign
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Platform */}
                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PLATFORM_CHOICES.map((value) => (
                                <SelectItem
                                  key={value}
                                  value={value}
                                  disabled={selectedServiceType && !recommendedPlatforms.includes(value)}
                                >
                                  {PLATFORM_LABELS[value as keyof typeof PLATFORM_LABELS] || value}
                                  {selectedServiceType && recommendedPlatforms.includes(value) && (
                                    <span className="ml-2 text-xs text-green-600">Recommended</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the primary platform for this campaign
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Platform Recommendations */}
                  {selectedServiceType && recommendedPlatforms.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recommended Platforms</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {recommendedPlatforms.map((platform) => (
                            <Badge key={platform} variant="secondary">
                              {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Budget & Timeline Tab */}
                <TabsContent value="budget" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Campaign Value */}
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Value *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="10000.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '')
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <FormDescription>Total contract value in €</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Budget Allocated */}
                    <FormField
                      control={form.control}
                      name="budget_allocated"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Allocated</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="8000.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '')
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <FormDescription>Budget allocated for ads/services in €</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Budget Spent & Progress */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget_spent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Spent</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '')
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <FormDescription>Amount spent so far in €</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Budget Utilization Progress */}
                    {budgetAllocated && (
                      <div className="space-y-2">
                        <FormLabel>Budget Utilization</FormLabel>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>€{parseFloat(budgetSpent || '0').toLocaleString()} spent</span>
                            <span>{budgetUtilization.toFixed(1)}%</span>
                          </div>
                          <Progress value={budgetUtilization} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            of €{parseFloat(budgetAllocated).toLocaleString()} allocated
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
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

                  {/* Confirmed Date (conditional) */}
                  {['confirmed', 'active', 'completed'].includes(statusValue) && (
                    <FormField
                      control={form.control}
                      name="confirmed_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmed Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>

                {/* KPIs Tab */}
                <TabsContent value="kpis" className="space-y-4 mt-4">
                  {/* KPI Recommendations */}
                  {selectedServiceType && recommendedKPIs.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recommended KPIs for {SERVICE_TYPE_LABELS[selectedServiceType as keyof typeof SERVICE_TYPE_LABELS]}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {recommendedKPIs.map((kpi) => (
                            <Button
                              key={kpi.name}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Check if KPI already exists
                                const exists = kpiFields.some(field => field.name === kpi.name)
                                if (!exists) {
                                  appendKpi({ name: kpi.name, target: '', unit: kpi.unit })
                                }
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {kpi.name}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* KPI Targets */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>KPI Targets</FormLabel>
                        <FormDescription className="text-xs mt-1">
                          Define measurable targets for this campaign
                        </FormDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendKpi({ name: '', target: '', unit: '' })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add KPI
                      </Button>
                    </div>

                    {kpiFields.map((field, index) => (
                      <Card key={field.id} className="p-3">
                        <div className="flex gap-2">
                          <FormField
                            control={form.control}
                            name={`kpi_targets.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="KPI Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`kpi_targets.${index}.target`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Target Value" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`kpi_targets.${index}.unit`}
                            render={({ field }) => (
                              <FormItem className="w-24">
                                <FormControl>
                                  <Input placeholder="Unit" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeKpi(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {kpiFields.length === 0 && (
                      <Card className="p-8">
                        <p className="text-center text-sm text-muted-foreground">
                          No KPIs defined yet. Add KPIs to track campaign performance.
                        </p>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>
                  {isEdit ? 'Update' : 'Create'} Campaign
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs for adding entities */}
      <EntityFormDialog
        open={showClientAdd}
        onOpenChange={setShowClientAdd}
        defaultRole="client"
      />
      <EntityFormDialog
        open={showArtistAdd}
        onOpenChange={setShowArtistAdd}
        defaultRole="artist"
      />
      <EntityFormDialog
        open={showBrandAdd}
        onOpenChange={setShowBrandAdd}
        defaultRole="brand"
      />
      {selectedClientId && (
        <ContactPersonFormDialog
          open={showContactPersonAdd}
          onOpenChange={setShowContactPersonAdd}
          entityId={selectedClientId}
        />
      )}
    </>
  )
}