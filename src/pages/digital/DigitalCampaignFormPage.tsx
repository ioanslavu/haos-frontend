import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { AppLayout } from '@/components/layout/AppLayout'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { RecordingSearchCombobox } from '@/components/catalog/RecordingSearchCombobox'
import { EntityFormDialog } from '@/pages/crm/components/EntityFormDialog'
import { ContactPersonFormDialog } from '@/pages/crm/components/ContactPersonFormDialog'
import { FormProgress } from '@/components/ui/form-progress'
import { ClientHealthScore } from '@/components/crm/ClientHealthScore'
import { useCreateCampaign, useUpdateCampaign, useCampaign } from '@/api/hooks/useCampaigns'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_HANDLER_ROLE_LABELS } from '@/types/campaign'
import {
  SERVICE_TYPE_LABELS,
  PLATFORM_LABELS,
  SERVICE_TYPE_CHOICES,
  PLATFORM_CHOICES,
  SERVICE_KPI_PRESETS
} from '@/api/types/campaigns'
import { useUsersList } from '@/api/hooks/useUsers'
import { useAuthStore } from '@/stores/authStore'
import { useContactPersons } from '@/api/hooks/useEntities'
import { Plus, X, Users, UserPlus, ArrowLeft, Loader2, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { ServiceMetricsUpdateDialog } from '@/components/digital/ServiceMetricsUpdateDialog'

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
  campaign_name: z.string().min(1, 'Campaign name is required'),
  client_type: z.enum(['internal', 'external']),
  client: z.number({ required_error: 'Client is required' }),
  contact_person: z.number().optional().nullable(),
  value: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), 'Invalid value format'),
  status: z.enum(['lead', 'negotiation', 'confirmed', 'active', 'completed', 'lost']),
  confirmed_at: z.string().optional(),
  notes: z.string().optional(),
  handlers: z.array(handlerSchema).optional(),
  // Digital-specific fields
  service_type: z.enum(SERVICE_TYPE_CHOICES as [string, ...string[]]).optional(),
  platforms: z.array(z.enum(PLATFORM_CHOICES as [string, ...string[]])).optional(),
  currency: z.enum(['EUR', 'USD', 'RON']).default('EUR'),
  budget_allocated: z.string().optional(),
  budget_spent: z.string().optional(),
  profit: z.string().optional(),
  internal_cost_estimate: z.string().optional(),
  invoice_status: z.enum(['issued', 'collected', 'delayed']).optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  kpi_targets: z.array(kpiTargetSchema).optional(),
})

type DigitalCampaignFormData = z.infer<typeof digitalCampaignFormSchema>

export function DigitalCampaignFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const campaignId = id ? Number(id) : 0

  const [showClientAdd, setShowClientAdd] = useState(false)
  const [showContactPersonAdd, setShowContactPersonAdd] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId, isEdit && campaignId > 0)
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  const currentUser = useAuthStore((state) => state.user)
  const { data: usersData } = useUsersList({ is_active: true })
  const users = usersData?.results || []

  const form = useForm<DigitalCampaignFormData>({
    resolver: zodResolver(digitalCampaignFormSchema),
    defaultValues: {
      campaign_name: '',
      client_type: 'external',
      client: undefined,
      contact_person: null,
      value: '',
      status: 'lead',
      confirmed_at: '',
      notes: '',
      handlers: [],
      service_type: undefined,
      platforms: [],
      currency: 'EUR',
      budget_allocated: '',
      budget_spent: '0',
      profit: '',
      start_date: '',
      end_date: '',
      kpi_targets: [],
    },
  })

  const selectedClientId = form.watch('client')
  const selectedClientType = form.watch('client_type')
  const selectedServiceType = form.watch('service_type')
  const selectedPlatforms = form.watch('platforms')
  const selectedCurrency = form.watch('currency')
  const campaignValue = form.watch('value')
  const budgetAllocated = form.watch('budget_allocated')
  const budgetSpent = form.watch('budget_spent')
  const statusValue = form.watch('status')

  const { data: contactPersonsData, isLoading: contactPersonsLoading } = useContactPersons(
    selectedClientId,
    !!selectedClientId
  )
  const contactPersons = useMemo(() => contactPersonsData || [], [contactPersonsData])

  const {
    fields: handlerFields,
    append: appendHandler,
    remove: removeHandler,
  } = useFieldArray({
    control: form.control,
    name: 'handlers',
  })

  const {
    fields: kpiFields,
    append: appendKpi,
    remove: removeKpi,
  } = useFieldArray({
    control: form.control,
    name: 'kpi_targets',
  })

  // Calculate budget utilization
  const budgetUtilization = useMemo(() => {
    const allocated = parseFloat(budgetAllocated || '0')
    const spent = parseFloat(budgetSpent || '0')
    if (allocated === 0) return 0
    return Math.min((spent / allocated) * 100, 100)
  }, [budgetAllocated, budgetSpent])

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'EUR':
        return '€'
      case 'USD':
        return '$'
      case 'RON':
        return 'lei'
      default:
        return currency
    }
  }

  // Get platform recommendations based on service type
  const recommendedPlatforms = useMemo(() => {
    switch (selectedServiceType) {
      case 'ppc':
        return ['meta', 'google', 'tiktok']
      case 'tiktok_ugc':
        return ['tiktok']
      case 'dsp_distribution':
        return ['spotify', 'apple_music', 'youtube']
      case 'playlist_pitching':
        return ['spotify', 'apple_music']
      case 'radio_plugging':
        return ['multi']
      case 'youtube_cms':
        return ['youtube']
      case 'social_media_mgmt':
        return ['meta', 'twitter', 'linkedin']
      default:
        return []
    }
  }, [selectedServiceType])

  // Get KPI recommendations based on service type
  const recommendedKPIs = useMemo(() => {
    if (!selectedServiceType) return []
    return SERVICE_KPI_PRESETS[selectedServiceType as keyof typeof SERVICE_KPI_PRESETS] || []
  }, [selectedServiceType])

  // Load campaign data when editing
  useEffect(() => {
    if (campaign && isEdit) {
      form.reset({
        campaign_name: campaign.campaign_name,
        client_type: (campaign.client as any).is_internal ? 'internal' : 'external',
        client: campaign.client.id,
        contact_person: campaign.contact_person?.id || null,
        value: campaign.value || '',
        status: campaign.status,
        confirmed_at: campaign.confirmed_at || '',
        notes: campaign.notes || '',
        handlers: campaign.handlers?.map((h) => ({ user: h.user, role: h.role })) || [],
        service_type: campaign.service_type,
        platforms: campaign.platform ? [campaign.platform] : [],
        currency: campaign.currency || 'EUR',
        budget_allocated: campaign.budget_allocated || '',
        budget_spent: campaign.budget_spent || '0',
        profit: (campaign as any).profit || '',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        kpi_targets: campaign.kpi_targets
          ? Object.entries(campaign.kpi_targets).map(([name, data]) => ({
              name,
              target: String(data.target || ''),
              unit: data.unit || '',
            }))
          : [],
      })
    }
  }, [campaign, isEdit, form])

  // Reset contact person when client changes
  useEffect(() => {
    if (selectedClientId && !isEdit) {
      form.setValue('contact_person', null)
    }
  }, [selectedClientId, isEdit, form])

  const onSubmit = async (data: DigitalCampaignFormData) => {
    try {
      // Convert KPI targets array to object format expected by API
      const kpiTargetsObject = data.kpi_targets?.reduce((acc, kpi) => {
        if (kpi.name && kpi.target) {
          acc[kpi.name] = {
            target: parseFloat(kpi.target),
            unit: kpi.unit || '',
          }
        }
        return acc
      }, {} as Record<string, { target: number; unit: string }>) || {}

      const validHandlers = data.handlers?.filter((h) => h.user !== undefined && h.user !== null) || []

      const payload = {
        campaign_name: data.campaign_name,
        client: data.client,
        brand: data.client, // For digital campaigns, brand is the same as client
        contact_person: data.contact_person || undefined,
        value: data.value || undefined,
        status: data.status,
        confirmed_at: data.confirmed_at || undefined,
        notes: data.notes || undefined,
        handlers: validHandlers.length > 0 ? validHandlers : undefined,
        service_type: data.service_type || undefined,
        platform: data.platforms && data.platforms.length > 0 ? data.platforms[0] : undefined,
        currency: data.currency,
        budget_allocated: data.budget_allocated || undefined,
        budget_spent: data.budget_spent || undefined,
        profit: data.profit || undefined,
        internal_cost_estimate: data.internal_cost_estimate || undefined,
        invoice_status: data.invoice_status || undefined,
        start_date: data.start_date,
        end_date: data.end_date,
        kpi_targets: Object.keys(kpiTargetsObject).length > 0 ? kpiTargetsObject : undefined,
      }

      if (isEdit && campaign) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          data: payload,
        })
        toast.success('Digital campaign updated successfully')
      } else {
        await createCampaign.mutateAsync(payload)
        toast.success('Digital campaign created successfully')
      }
      navigate('/digital/campaigns')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save digital campaign')
    }
  }

  // Auto-set confirmed_at when status changes to confirmed or later
  useEffect(() => {
    if (['confirmed', 'active', 'completed'].includes(statusValue) && !form.getValues('confirmed_at')) {
      form.setValue('confirmed_at', new Date().toISOString().split('T')[0])
    }
  }, [statusValue, form])

  // Auto-calculate profit when campaign is completed
  useEffect(() => {
    if (statusValue === 'completed' && campaignValue && budgetSpent) {
      const value = parseFloat(campaignValue)
      const spent = parseFloat(budgetSpent)
      if (!isNaN(value) && !isNaN(spent)) {
        const calculatedProfit = value - spent
        form.setValue('profit', calculatedProfit.toFixed(2))
      }
    }
  }, [statusValue, campaignValue, budgetSpent, form])

  // Calculate form completion progress
  const formValues = form.watch()
  const currentStep = useMemo(() => {
    // Step 0: Basic Information
    const hasBasicInfo = formValues.campaign_name && formValues.status
    if (!hasBasicInfo) return 0

    // Step 1: Client & Timeline
    const hasClient = formValues.client && formValues.start_date && formValues.end_date
    if (!hasClient) return 1

    // Step 2: Service & Budget
    const hasServiceInfo = formValues.service_type || (formValues.platforms && formValues.platforms.length > 0) || formValues.budget_allocated
    if (!hasServiceInfo) return 2

    // Step 3: KPIs & Final Details
    return 3
  }, [formValues])

  const formSteps = [
    {
      label: 'Basic Information',
      description: 'Campaign name and status',
    },
    {
      label: 'Client & Timeline',
      description: 'Client selection and campaign dates',
    },
    {
      label: 'Service & Budget',
      description: 'Service type, platforms, and budget details',
    },
    {
      label: 'KPIs & Review',
      description: 'Performance targets and submission',
    },
  ]

  if (isEdit && campaignLoading) {
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/digital/campaigns')}
              aria-label="Go back to digital campaigns"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEdit ? 'Edit Digital Campaign' : 'Create New Digital Campaign'}
              </h1>
              <p className="text-muted-foreground">
                {isEdit
                  ? 'Update digital campaign details, budget, and KPI targets.'
                  : 'Create a new digital marketing campaign with service-specific KPIs and budget tracking.'}
              </p>
            </div>
          </div>
          {isEdit && campaign && (
            <ServiceMetricsUpdateDialog campaign={campaign} />
          )}
        </div>

        {/* Progress Indicator */}
        {!isEdit && (
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-6 px-6 border-b mb-6">
            <FormProgress steps={formSteps} currentStep={currentStep} />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about this digital campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Client & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Client & Timeline</CardTitle>
                <CardDescription>Client selection and campaign dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Type */}
                <FormField
                  control={form.control}
                  name="client_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Internal = search internal entities, External = search external entities</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            placeholder={`Search for ${selectedClientType} client...`}
                            filter={selectedClientType === 'internal' ? { is_internal: true } : { is_internal: false }}
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

                {/* Contact Person */}
                {selectedClientId && (
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person (Optional)</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            onValueChange={(value) => field.onChange(value === 'none' ? null : Number(value))}
                            value={field.value ? field.value.toString() : 'none'}
                          >
                            <FormControl className="flex-1">
                              <SelectTrigger>
                                <SelectValue placeholder="Select contact person..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {contactPersonsLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading contact persons...
                                </SelectItem>
                              ) : contactPersons.length > 0 ? (
                                contactPersons.map((person) => (
                                  <SelectItem key={person.id} value={person.id.toString()}>
                                    {person.name}
                                    {person.role_display && ` (${person.role_display})`}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-contacts" disabled>
                                  No contact persons available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowContactPersonAdd(true)}
                            title="Add new contact person"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Client Health Score - shown after client is selected */}
                {selectedClientId && (
                  <div className="col-span-full">
                    <ClientHealthScore entityId={selectedClientId} />
                  </div>
                )}

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
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
                        <FormLabel>End Date *</FormLabel>
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

            {/* Service & Platform */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Service & Platform
                </CardTitle>
                <CardDescription>Digital service type and platform selection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <FormDescription>Type of digital service for this campaign</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                {/* Platforms Multi-Select */}
                <FormField
                  control={form.control}
                  name="platforms"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Platforms (Select multiple)</FormLabel>
                        <FormDescription>
                          Select all platforms where this campaign will run
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PLATFORM_CHOICES.map((platform) => (
                          <FormField
                            key={platform}
                            control={form.control}
                            name="platforms"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={platform}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(platform)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), platform])
                                          : field.onChange(
                                              field.value?.filter((value: string) => value !== platform)
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Platform Recommendations */}
                {selectedServiceType && recommendedPlatforms.length > 0 && (
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm font-medium mb-2">Recommended platforms for this service:</p>
                    <div className="flex flex-wrap gap-2">
                      {recommendedPlatforms.map((platform) => (
                        <Badge
                          key={platform}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => {
                            const currentPlatforms = form.getValues('platforms') || []
                            if (!currentPlatforms.includes(platform)) {
                              form.setValue('platforms', [...currentPlatforms, platform])
                            }
                          }}
                        >
                          {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Click a badge to select</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Tracking</CardTitle>
                <CardDescription>Campaign value, budget allocation and spending monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="RON">RON (lei)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Currency for all financial values</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  {/* Campaign Value */}
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Value</FormLabel>
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
                        <FormDescription>Total contract value</FormDescription>
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
                        <FormDescription>Budget for ads/services</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Spent */}
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
                        <FormDescription>Amount spent so far</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Profit (when completed) */}
                {statusValue === 'completed' && (
                  <FormField
                    control={form.control}
                    name="profit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Profit</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormDescription>
                          Auto-calculated: Campaign Value - Budget Spent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Additional Financial Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Internal Cost Estimate */}
                  <FormField
                    control={form.control}
                    name="internal_cost_estimate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Cost Estimate</FormLabel>
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
                        <FormDescription>Estimated internal costs</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Invoice Status */}
                  <FormField
                    control={form.control}
                    name="invoice_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="issued">Issued (Emisă)</SelectItem>
                            <SelectItem value="collected">Collected (Încasată)</SelectItem>
                            <SelectItem value="delayed">Delayed (Întârziată)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Current invoice status</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Budget Utilization Progress */}
                {budgetAllocated && (
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                    <FormLabel>Budget Utilization</FormLabel>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{getCurrencySymbol(selectedCurrency)}{parseFloat(budgetSpent || '0').toLocaleString()} spent</span>
                        <span className="font-medium">{budgetUtilization.toFixed(1)}%</span>
                      </div>
                      <Progress value={budgetUtilization} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        of {getCurrencySymbol(selectedCurrency)}{parseFloat(budgetAllocated).toLocaleString()} allocated
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  KPI Targets
                </CardTitle>
                <CardDescription>Define measurable performance targets for this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* KPI Recommendations */}
                {selectedServiceType && recommendedKPIs.length > 0 && (
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm font-medium mb-2">
                      Recommended KPIs for {SERVICE_TYPE_LABELS[selectedServiceType as keyof typeof SERVICE_TYPE_LABELS]}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recommendedKPIs.map((kpi) => (
                        <Button
                          key={kpi.metric}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const exists = kpiFields.some((field) => field.name === kpi.metric)
                            if (!exists) {
                              appendKpi({ name: kpi.metric, target: '', unit: kpi.unit })
                            }
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {kpi.metric}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* KPI List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Performance Targets</FormLabel>
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
                    <div key={field.id} className="flex gap-2 items-start border rounded-md p-3 bg-muted/30">
                      <FormField
                        control={form.control}
                        name={`kpi_targets.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="KPI Name (e.g., Streams)" {...field} />
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
                          <FormItem className="w-32">
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
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {kpiFields.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-muted/20">
                      No KPIs defined yet. Add KPIs to track campaign performance.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Handlers */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Campaign Handlers
                    </CardTitle>
                    <CardDescription>
                      Additional team members to help with this campaign
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {currentUser && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendHandler({ user: Number(currentUser.id), role: 'support' })}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Me
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendHandler({ user: undefined as any, role: 'support' })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Other
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {handlerFields.length > 0 ? (
                  <div className="space-y-2">
                    {handlerFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex gap-2 items-start border rounded-md p-3 bg-muted/30"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`handlers.${index}.user`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={(value) => field.onChange(Number(value))}
                                  value={field.value ? field.value.toString() : ''}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {users.length > 0 ? (
                                      users.map((user) => (
                                        <SelectItem key={user.id} value={user.id.toString()}>
                                          {user.full_name || user.email}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-users" disabled>
                                        No active users available
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`handlers.${index}.role`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(CAMPAIGN_HANDLER_ROLE_LABELS).map(([value, label]) => (
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

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHandler(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-muted/20">
                    No additional handlers assigned. Campaign creator will be auto-assigned as lead.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Additional information about this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this campaign..."
                          className="min-h-[150px]"
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
                onClick={() => navigate('/digital/campaigns')}
                disabled={createCampaign.isPending || updateCampaign.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>
                {createCampaign.isPending || updateCampaign.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Update Campaign'
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Quick-add dialogs */}
        <EntityFormDialog
          open={showClientAdd}
          onOpenChange={setShowClientAdd}
          role="client"
          onSuccess={(entity) => {
            form.setValue('client', entity.id)
            setShowClientAdd(false)
          }}
        />

        {selectedClientId && (
          <ContactPersonFormDialog
            open={showContactPersonAdd}
            onOpenChange={setShowContactPersonAdd}
            entityId={selectedClientId}
            onSuccess={(contactPerson) => {
              form.setValue('contact_person', contactPerson.id)
              setShowContactPersonAdd(false)
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}

export default DigitalCampaignFormPage
