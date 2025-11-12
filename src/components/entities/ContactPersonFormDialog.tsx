import { useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ContactPerson } from '@/api/services/entities.service'
import {
  useCreateContactPerson,
  useUpdateContactPerson,
} from '@/api/hooks/useEntities'
import {
  CONTACT_ROLE_LABELS,
  ENGAGEMENT_STAGE_LABELS,
  CONTACT_SENTIMENT_LABELS,
  ContactRole,
  EngagementStage,
  ContactSentiment,
} from '@/types/contact'
import { Plus, X, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

const emailSchema = z.object({
  id: z.number().optional(),
  email: z.string().optional(),
  label: z.string().optional(),
  is_primary: z.boolean(),
})

const phoneSchema = z.object({
  id: z.number().optional(),
  phone: z.string().optional(),
  label: z.string().optional(),
  is_primary: z.boolean(),
})

const contactPersonFormSchema = z.object({
  entity: z.number({ required_error: 'Entity is required' }),
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  engagement_stage: z.string().optional(),
  sentiment: z.string().optional(),
  notes: z.string().optional(),
  emails: z.array(emailSchema),
  phones: z.array(phoneSchema),
})

type ContactPersonFormData = z.infer<typeof contactPersonFormSchema>

interface ContactPersonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityId: number
  contactPerson?: ContactPerson | null
}

export function ContactPersonFormDialog({
  open,
  onOpenChange,
  entityId,
  contactPerson,
}: ContactPersonFormDialogProps) {
  const isEdit = !!contactPerson

  const createContactPerson = useCreateContactPerson()
  const updateContactPerson = useUpdateContactPerson()

  const form = useForm<ContactPersonFormData>({
    resolver: zodResolver(contactPersonFormSchema),
    defaultValues: {
      entity: entityId,
      name: '',
      role: undefined,
      engagement_stage: undefined,
      sentiment: undefined,
      notes: '',
      emails: [{ email: '', label: 'work', is_primary: true }],
      phones: [{ phone: '', label: 'mobile', is_primary: true }],
    },
  })

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control: form.control,
    name: 'emails',
  })

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control: form.control,
    name: 'phones',
  })

  // Reset form when dialog opens/closes or contact person changes
  useEffect(() => {
    if (open) {
      if (contactPerson) {
        form.reset({
          entity: contactPerson.entity,
          name: contactPerson.name,
          role: contactPerson.role || undefined,
          engagement_stage: contactPerson.engagement_stage || undefined,
          sentiment: contactPerson.sentiment || undefined,
          notes: contactPerson.notes || '',
          emails:
            contactPerson.emails.length > 0
              ? contactPerson.emails
              : [{ email: '', label: 'work', is_primary: true }],
          phones:
            contactPerson.phones.length > 0
              ? contactPerson.phones
              : [{ phone: '', label: 'mobile', is_primary: true }],
        })
      } else {
        form.reset({
          entity: entityId,
          name: '',
          role: undefined,
          engagement_stage: undefined,
          sentiment: undefined,
          notes: '',
          emails: [{ email: '', label: 'work', is_primary: true }],
          phones: [{ phone: '', label: 'mobile', is_primary: true }],
        })
      }
    }
  }, [open, contactPerson, entityId, form])

  const onSubmit = async (data: ContactPersonFormData) => {
    try {
      // Filter out empty emails and phones
      const payload = {
        ...data,
        emails: data.emails.filter((e) => e.email && e.email.trim() !== ''),
        phones: data.phones.filter((p) => p.phone && p.phone.trim() !== ''),
      }

      if (isEdit && contactPerson) {
        await updateContactPerson.mutateAsync({
          id: contactPerson.id,
          payload,
        })
        toast.success('Contact person updated successfully')
      } else {
        await createContactPerson.mutateAsync(payload)
        toast.success('Contact person created successfully')
      }
      onOpenChange(false)
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Failed to save contact person'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Contact Person' : 'Add Contact Person'}
          </DialogTitle>
          <DialogDescription>
            Manage contact information for this entity
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {Object.entries(CONTACT_ROLE_LABELS).map(
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

              {/* Engagement Stage */}
              <FormField
                control={form.control}
                name="engagement_stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engagement Stage</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ENGAGEMENT_STAGE_LABELS).map(
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

              {/* Sentiment */}
              <FormField
                control={form.control}
                name="sentiment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentiment</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sentiment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {Object.entries(CONTACT_SENTIMENT_LABELS).map(
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

            {/* Emails */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Addresses
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendEmail({ email: '', label: 'work', is_primary: false })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Email
                </Button>
              </div>

              {emailFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start border rounded-md p-3 bg-muted/30"
                >
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`emails.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`emails.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Label (e.g., work)" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`emails.${index}.is_primary`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              Primary
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {emailFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmail(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Phones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Numbers
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendPhone({ phone: '', label: 'mobile', is_primary: false })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Phone
                </Button>
              </div>

              {phoneFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start border rounded-md p-3 bg-muted/30"
                >
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`phones.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`phones.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Label (e.g., mobile)" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`phones.${index}.is_primary`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              Primary
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {phoneFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhone(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this contact..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createContactPerson.isPending || updateContactPerson.isPending
                }
              >
                {createContactPerson.isPending || updateContactPerson.isPending
                  ? 'Saving...'
                  : isEdit
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
