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
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { EntityFormDialog } from './EntityFormDialog'
import { ContactPersonFormDialog } from './ContactPersonFormDialog'
import { useCreateCampaign, useUpdateCampaign } from '@/api/hooks/useCampaigns'
import { Campaign, CampaignStatus, CAMPAIGN_STATUS_LABELS, CAMPAIGN_HANDLER_ROLE_LABELS } from '@/types/campaign'
import { useUsersList } from '@/api/hooks/useUsers'
import { useAuthStore } from '@/stores/authStore'
import { useContactPersons } from '@/api/hooks/useEntities'
import { Plus, X, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const handlerSchema = z.object({
  user: z.number().optional(),
  role: z.enum(['lead', 'support', 'observer']),
})

const campaignFormSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  client: z.number({ required_error: 'Client is required' }),
  artist: z.number({ required_error: 'Artist is required' }),
  brand: z.number({ required_error: 'Brand is required' }),
  contact_person: z.number().optional().nullable(),
  value: z.string().min(1, 'Value is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid value format'),
  status: z.enum(['lead', 'negotiation', 'confirmed', 'active', 'completed', 'lost']),
  confirmed_at: z.string().optional(),
  notes: z.string().optional(),
  handlers: z.array(handlerSchema).optional(),
})

type CampaignFormData = z.infer<typeof campaignFormSchema>

interface CampaignFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign | null
}

export function CampaignFormDialog({ open, onOpenChange, campaign }: CampaignFormDialogProps) {
  const [showClientAdd, setShowClientAdd] = useState(false)
  const [showArtistAdd, setShowArtistAdd] = useState(false)
  const [showBrandAdd, setShowBrandAdd] = useState(false)
  const [showContactPersonAdd, setShowContactPersonAdd] = useState(false)

  const isEdit = !!campaign

  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  // Get current user
  const currentUser = useAuthStore((state) => state.user)

  // Fetch users for handler selection
  const { data: usersData } = useUsersList({ is_active: true })
  const users = usersData?.results || []

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      campaign_name: '',
      client: undefined,
      artist: undefined,
      brand: undefined,
      contact_person: null,
      value: '',
      status: 'lead',
      confirmed_at: '',
      notes: '',
      handlers: [],
    },
  })

  // Watch client field to fetch contact persons
  const selectedClientId = form.watch('client')
  const { data: contactPersonsData, isLoading: contactPersonsLoading } = useContactPersons(selectedClientId, !!selectedClientId)
  const contactPersons = useMemo(() => contactPersonsData || [], [contactPersonsData])

  const {
    fields: handlerFields,
    append: appendHandler,
    remove: removeHandler,
  } = useFieldArray({
    control: form.control,
    name: 'handlers',
  })

  // Reset form when dialog opens/closes or campaign changes
  useEffect(() => {
    if (open) {
      if (campaign) {
        form.reset({
          campaign_name: campaign.campaign_name,
          client: campaign.client.id,
          artist: campaign.artist.id,
          brand: campaign.brand.id,
          contact_person: campaign.contact_person?.id || null,
          value: campaign.value,
          status: campaign.status,
          confirmed_at: campaign.confirmed_at || '',
          notes: campaign.notes || '',
          handlers: campaign.handlers?.map(h => ({ user: h.user, role: h.role })) || [],
        })
      } else {
        form.reset({
          campaign_name: '',
          client: undefined,
          artist: undefined,
          brand: undefined,
          contact_person: null,
          value: '',
          status: 'lead',
          confirmed_at: '',
          notes: '',
          handlers: [],
        })
      }
    }
  }, [open, campaign, form])

  // Reset contact person when client changes
  useEffect(() => {
    if (selectedClientId && !campaign) {
      form.setValue('contact_person', null)
    }
  }, [selectedClientId, campaign, form])

  const onSubmit = async (data: CampaignFormData) => {
    try {
      // Filter out handlers without a user selected
      const validHandlers = data.handlers?.filter(h => h.user !== undefined && h.user !== null) || []

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
      onOpenChange(false)
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update campaign details and track the deal status.'
                : 'Create a new campaign to track brand deals with clients and artists.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {/* Artist */}
              <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist *</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                {/* Value */}
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
                            // Allow only numbers and decimal point
                            const value = e.target.value.replace(/[^\d.]/g, '')
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
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

              {/* Confirmed Date (show if status is confirmed or later) */}
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

              <Separator />

              {/* Campaign Handlers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Campaign Handlers (Optional)
                    </FormLabel>
                    <FormDescription className="text-xs mt-1">
                      Additional team members to help with this campaign. You'll be auto-assigned as lead.
                    </FormDescription>
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

                {handlerFields.length > 0 && (
                  <div className="space-y-2">
                    {handlerFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex gap-2 items-start border rounded-md p-3 bg-muted/30"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          {/* User Selection */}
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

                          {/* Role Selection */}
                          <FormField
                            control={form.control}
                            name={`handlers.${index}.role`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.entries(CAMPAIGN_HANDLER_ROLE_LABELS).map(
                                      ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                          {label}
                                        </SelectItem>
                                      )
                                    )}
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
                )}

                {handlerFields.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/20">
                    No additional handlers assigned. Campaign creator will be auto-assigned as lead.
                  </div>
                )}
              </div>

              <Separator />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this campaign..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCampaign.isPending || updateCampaign.isPending}
                >
                  {createCampaign.isPending || updateCampaign.isPending
                    ? 'Saving...'
                    : isEdit
                    ? 'Update Campaign'
                    : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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

      {/* Quick-add contact person dialog */}
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
    </>
  )
}
