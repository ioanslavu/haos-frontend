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
import { Separator } from '@/components/ui/separator'
import { AppLayout } from '@/components/layout/AppLayout'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { WorkRecordingSearchCombobox } from '@/components/catalog/WorkRecordingSearchCombobox'
import { EntityFormDialog } from './components/EntityFormDialog'
import { ContactPersonFormDialog } from './components/ContactPersonFormDialog'
import { FormProgress } from '@/components/ui/form-progress'
import { useCreateCampaign, useUpdateCampaign, useCampaign } from '@/api/hooks/useCampaigns'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_HANDLER_ROLE_LABELS } from '@/types/campaign'
import { useUsersList } from '@/api/hooks/useUsers'
import { useAuthStore } from '@/stores/authStore'
import { useContactPersons } from '@/api/hooks/useEntities'
import { Plus, X, Users, UserPlus, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const handlerSchema = z.object({
  user: z.number().optional(),
  role: z.enum(['lead', 'support', 'observer']),
})

const campaignFormSchema = z.object({
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
})

type CampaignFormData = z.infer<typeof campaignFormSchema>

export function CampaignFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const campaignId = id ? Number(id) : 0

  const [showClientAdd, setShowClientAdd] = useState(false)
  const [showArtistAdd, setShowArtistAdd] = useState(false)
  const [showBrandAdd, setShowBrandAdd] = useState(false)
  const [showContactPersonAdd, setShowContactPersonAdd] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId, isEdit && campaignId > 0)
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  const currentUser = useAuthStore((state) => state.user)
  const { data: usersData } = useUsersList({ is_active: true })
  const users = usersData?.results || []

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
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
    },
  })

  const selectedClientId = form.watch('client')
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

  // Load campaign data when editing
  useEffect(() => {
    if (campaign && isEdit) {
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
        handlers: campaign.handlers?.map((h) => ({ user: h.user, role: h.role })) || [],
      })
    }
  }, [campaign, isEdit, form])

  // Reset contact person when client changes
  useEffect(() => {
    if (selectedClientId && !isEdit) {
      form.setValue('contact_person', null)
    }
  }, [selectedClientId, isEdit, form])

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const validHandlers = data.handlers?.filter((h) => h.user !== undefined && h.user !== null) || []

      const payload = {
        ...data,
        confirmed_at: data.confirmed_at || undefined,
        notes: data.notes || undefined,
        handlers: validHandlers.length > 0 ? validHandlers : undefined,
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
      navigate('/crm')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save campaign')
    }
  }

  const statusValue = form.watch('status')

  // Auto-set confirmed_at when status changes to confirmed or later
  useEffect(() => {
    if (['confirmed', 'active', 'completed'].includes(statusValue) && !form.getValues('confirmed_at')) {
      form.setValue('confirmed_at', new Date().toISOString().split('T')[0])
    }
  }, [statusValue, form])

  // Calculate form completion progress
  const formValues = form.watch()
  const currentStep = useMemo(() => {
    // Step 0: Basic Information (required: campaign_name, value, status)
    const hasBasicInfo = formValues.campaign_name && formValues.value && formValues.status
    if (!hasBasicInfo) return 0

    // Step 1: Parties & Relationships (required: client, brand)
    const hasParties = formValues.client && formValues.brand
    if (!hasParties) return 1

    // Step 2: Team Handlers (optional, but if filled counts as progress)
    // Step 3: Notes (optional, always accessible)
    // Since Steps 2 and 3 are optional, we move to step 2 once parties are filled
    return 2
  }, [formValues])

  const formSteps = [
    {
      label: 'Basic Information',
      description: 'Campaign name, value, and status',
    },
    {
      label: 'Parties & Relationships',
      description: 'Client, brand, artist, and contact',
    },
    {
      label: 'Team & Details',
      description: 'Handlers and additional notes',
    },
    {
      label: 'Review & Submit',
      description: 'Verify and create campaign',
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/crm')} aria-label="Go back to CRM">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? 'Update campaign details and track the deal status.'
              : 'Create a new campaign to track brand deals with clients and artists.'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {!isEdit && (
        <FormProgress steps={formSteps} currentStep={currentStep} className="mt-8" />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core details about this campaign</CardDescription>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value *</FormLabel>
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
              </div>

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

          {/* Parties & Relationships */}
          <Card>
            <CardHeader>
              <CardTitle>Parties & Relationships</CardTitle>
              <CardDescription>Client, brand, artist, and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          useBusinessEndpoint
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
                    <FormDescription>
                      Search business entities - they can have multiple roles (client, brand, label, etc.)
                    </FormDescription>
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
                          useBusinessEndpoint
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
                    <FormDescription>
                      Same list as clients - an entity can be both client and brand
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Artist */}
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

              {/* Song/Recording */}
              <FormField
                control={form.control}
                name="song"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song / Recording (Optional)</FormLabel>
                    <FormControl>
                      <WorkRecordingSearchCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search for song or recording..."
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Search by song title, recording title, or ISRC code. Expand works to see all versions (remix, acoustic, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    Additional team members to help with this campaign. You'll be auto-assigned as lead.
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
              onClick={() => navigate('/crm')}
              disabled={createCampaign.isPending || updateCampaign.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCampaign.isPending || updateCampaign.isPending}
            >
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

      <EntityFormDialog
        open={showArtistAdd}
        onOpenChange={setShowArtistAdd}
        role="artist"
        onSuccess={(entity) => {
          form.setValue('artist', entity.id)
          setShowArtistAdd(false)
        }}
      />

      <EntityFormDialog
        open={showBrandAdd}
        onOpenChange={setShowBrandAdd}
        role="brand"
        onSuccess={(entity) => {
          form.setValue('brand', entity.id)
          setShowBrandAdd(false)
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

export default CampaignFormPage
