import { useEffect, useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
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
import { ContactPerson } from '@/api/services/entities.service'
import {
  useCreateContactPerson,
  useUpdateContactPerson,
  useDeleteContactPerson,
} from '@/api/hooks/useEntities'
import {
  CONTACT_ROLE_LABELS,
  ENGAGEMENT_STAGE_LABELS,
  CONTACT_SENTIMENT_LABELS,
  ENGAGEMENT_STAGE_COLORS,
  CONTACT_SENTIMENT_COLORS,
  ContactRole,
  EngagementStage,
  ContactSentiment,
} from '@/types/contact'
import {
  Plus,
  X,
  Mail,
  Phone,
  Briefcase,
  Heart,
  TrendingUp,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  onSuccess?: (contactPerson: ContactPerson) => void
}

export function ContactPersonFormDialog({
  open,
  onOpenChange,
  entityId,
  contactPerson,
  onSuccess,
}: ContactPersonFormDialogProps) {
  const isEdit = !!contactPerson
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [createdContactId, setCreatedContactId] = useState<number | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const isCreateMode = !contactPerson && !createdContactId

  const createContactPerson = useCreateContactPerson()
  const updateContactPerson = useUpdateContactPerson()
  const deleteContactPerson = useDeleteContactPerson()

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
      setCreatedContactId(null)
      setSaveState('idle')
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

  // Focus name input when opening in create mode
  useEffect(() => {
    if (open && !isEdit && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open, isEdit])

  const handleDelete = async () => {
    const idToDelete = contactPerson?.id || createdContactId
    if (!idToDelete) return
    try {
      await deleteContactPerson.mutateAsync(idToDelete)
      toast.success('Contact deleted successfully')
      setShowDeleteDialog(false)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete contact')
    }
  }

  // Watch all form values for auto-save
  const watchedValues = form.watch()
  const lastSavedRef = useRef<string>('')
  const initializedRef = useRef(false)

  // Auto-save with debounce
  useEffect(() => {
    if (!open) {
      initializedRef.current = false
      lastSavedRef.current = ''
      return
    }

    const name = watchedValues.name?.trim()
    if (!name) return // Don't save without a name

    // Create a string representation for comparison
    const currentState = JSON.stringify({
      name: watchedValues.name,
      role: watchedValues.role,
      engagement_stage: watchedValues.engagement_stage,
      sentiment: watchedValues.sentiment,
      notes: watchedValues.notes,
      emails: watchedValues.emails?.filter((e) => e.email?.trim()),
      phones: watchedValues.phones?.filter((p) => p.phone?.trim()),
    })

    // Skip if nothing changed or first render with existing contact
    if (currentState === lastSavedRef.current) return
    if (!initializedRef.current) {
      initializedRef.current = true
      if (contactPerson) {
        lastSavedRef.current = currentState
        return // Don't save on initial load of existing contact
      }
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Prepare payload
    const getPayload = () => ({
      entity: entityId,
      name: watchedValues.name,
      role: watchedValues.role || undefined,
      engagement_stage: watchedValues.engagement_stage || undefined,
      sentiment: watchedValues.sentiment || undefined,
      notes: watchedValues.notes || undefined,
      emails: watchedValues.emails?.filter((e) => e.email && e.email.trim() !== '') || [],
      phones: watchedValues.phones?.filter((p) => p.phone && p.phone.trim() !== '') || [],
    })

    // Set debounce timer
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setSaveState('saving')

        if (isCreateMode) {
          // Create new contact
          const result = await createContactPerson.mutateAsync(getPayload())
          setCreatedContactId(result.id)
          lastSavedRef.current = currentState
          onSuccess?.(result)
          toast.success('Contact created')
        } else {
          // Update existing contact
          const idToUpdate = contactPerson?.id || createdContactId!
          const result = await updateContactPerson.mutateAsync({
            id: idToUpdate,
            payload: getPayload(),
          })
          lastSavedRef.current = currentState
          onSuccess?.(result)
        }

        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch (error: any) {
        setSaveState('idle')
        toast.error(error?.response?.data?.message || 'Failed to save contact')
      }
    }, 1000)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [watchedValues, open, isCreateMode, entityId, contactPerson?.id, createdContactId])

  // Handle close - save any pending changes
  const handleClose = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const name = watchedValues.name?.trim()
    if (!name) {
      onOpenChange(false)
      return
    }

    // Check if there are unsaved changes
    const currentState = JSON.stringify({
      name: watchedValues.name,
      role: watchedValues.role,
      engagement_stage: watchedValues.engagement_stage,
      sentiment: watchedValues.sentiment,
      notes: watchedValues.notes,
      emails: watchedValues.emails?.filter((e) => e.email?.trim()),
      phones: watchedValues.phones?.filter((p) => p.phone?.trim()),
    })

    if (currentState !== lastSavedRef.current) {
      const payload = {
        entity: entityId,
        name: watchedValues.name,
        role: watchedValues.role || undefined,
        engagement_stage: watchedValues.engagement_stage || undefined,
        sentiment: watchedValues.sentiment || undefined,
        notes: watchedValues.notes || undefined,
        emails: watchedValues.emails?.filter((e) => e.email && e.email.trim() !== '') || [],
        phones: watchedValues.phones?.filter((p) => p.phone && p.phone.trim() !== '') || [],
      }

      try {
        if (isCreateMode) {
          const result = await createContactPerson.mutateAsync(payload)
          onSuccess?.(result)
        } else {
          const idToUpdate = contactPerson?.id || createdContactId!
          const result = await updateContactPerson.mutateAsync({
            id: idToUpdate,
            payload,
          })
          onSuccess?.(result)
        }
      } catch (error) {
        // Silent fail on close
      }
    }

    onOpenChange(false)
  }

  // Watch values for header badges
  const watchRole = watchedValues.role
  const watchEngagement = watchedValues.engagement_stage
  const watchSentiment = watchedValues.sentiment

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <Form {...form}>
            <div>
              {/* Main Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Name - Large and Prominent (Notion style) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                      Name
                    </label>
                    {saveState === 'saving' && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    )}
                    {saveState === 'saved' && (
                      <span className="text-xs text-muted-foreground">Saved</span>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <input
                            ref={nameInputRef}
                            type="text"
                            placeholder={isEdit ? "Contact name" : "Contact name..."}
                            className="w-full text-3xl font-bold bg-transparent px-1 py-2 placeholder:text-muted-foreground/30"
                            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                            onFocus={(e) => e.target.style.outline = 'none'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Status badges */}
                  {(watchRole || watchEngagement || watchSentiment) && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {watchRole && (
                        <Badge variant="outline" className="text-xs">
                          {CONTACT_ROLE_LABELS[watchRole as ContactRole] || watchRole}
                        </Badge>
                      )}
                      {watchEngagement && (
                        <Badge className={cn("text-xs", ENGAGEMENT_STAGE_COLORS[watchEngagement as EngagementStage])}>
                          {ENGAGEMENT_STAGE_LABELS[watchEngagement as EngagementStage] || watchEngagement}
                        </Badge>
                      )}
                      {watchSentiment && (
                        <Badge className={cn("text-xs", CONTACT_SENTIMENT_COLORS[watchSentiment as ContactSentiment])}>
                          {CONTACT_SENTIMENT_LABELS[watchSentiment as ContactSentiment] || watchSentiment}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Properties Grid */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Relationship
                  </h4>

                  <div className="space-y-3">
                    {/* Role */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>Role</span>
                      </div>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ''}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full border-0 bg-transparent hover:bg-accent/50 focus:bg-accent/50 h-9 px-3">
                                    <SelectValue placeholder="Select role..." />
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
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Engagement Stage */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Stage</span>
                      </div>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="engagement_stage"
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ''}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full border-0 bg-transparent hover:bg-accent/50 focus:bg-accent/50 h-9 px-3">
                                    <SelectValue placeholder="Select stage..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(ENGAGEMENT_STAGE_LABELS).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            ENGAGEMENT_STAGE_COLORS[value as EngagementStage]?.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-400'
                                          )} />
                                          {label}
                                        </div>
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Sentiment */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        <span>Sentiment</span>
                      </div>
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name="sentiment"
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ''}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full border-0 bg-transparent hover:bg-accent/50 focus:bg-accent/50 h-9 px-3">
                                    <SelectValue placeholder="Select sentiment..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[300px]">
                                  {Object.entries(CONTACT_SENTIMENT_LABELS).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            CONTACT_SENTIMENT_COLORS[value as ContactSentiment]?.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-400'
                                          )} />
                                          {label}
                                        </div>
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-4">
                  {/* Emails */}
                  <div className="space-y-3">
                    {emailFields.map((field, index) => (
                      <div key={field.id} className="group flex items-start gap-3">
                        <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground pt-2">
                          <Mail className="h-4 w-4" />
                          <FormField
                            control={form.control}
                            name={`emails.${index}.label`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input
                                    placeholder="label"
                                    className="h-6 w-16 border-0 bg-transparent px-0 text-xs text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`emails.${index}.email`}
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    className="h-9 border-0 bg-transparent hover:bg-accent/50 focus:bg-accent/50 rounded-md px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`emails.${index}.is_primary`}
                            render={({ field }) => (
                              <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className={cn(
                                  "text-xs px-2 py-1 rounded transition-colors shrink-0",
                                  field.value
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground/40 hover:text-muted-foreground"
                                )}
                              >
                                {field.value ? 'Primary' : 'Set primary'}
                              </button>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmail(index)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        appendEmail({ email: '', label: 'work', is_primary: false })
                      }
                      className="h-8 px-2 text-xs text-muted-foreground ml-32"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add email
                    </Button>
                  </div>

                  {/* Phones */}
                  <div className="space-y-3">
                    {phoneFields.map((field, index) => (
                      <div key={field.id} className="group flex items-start gap-3">
                        <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground pt-2">
                          <Phone className="h-4 w-4" />
                          <FormField
                            control={form.control}
                            name={`phones.${index}.label`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input
                                    placeholder="label"
                                    className="h-6 w-16 border-0 bg-transparent px-0 text-xs text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`phones.${index}.phone`}
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <Input
                                    placeholder="+40 123 456 789"
                                    className="h-9 border-0 bg-transparent hover:bg-accent/50 focus:bg-accent/50 rounded-md px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`phones.${index}.is_primary`}
                            render={({ field }) => (
                              <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className={cn(
                                  "text-xs px-2 py-1 rounded transition-colors shrink-0",
                                  field.value
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground/40 hover:text-muted-foreground"
                                )}
                              >
                                {field.value ? 'Primary' : 'Set primary'}
                              </button>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePhone(index)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        appendPhone({ phone: '', label: 'mobile', is_primary: false })
                      }
                      className="h-8 px-2 text-xs text-muted-foreground ml-32"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add phone
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Notes Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Notes</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Add notes about this contact..."
                            className="resize-none min-h-[100px] border-0 bg-transparent hover:bg-accent/30 focus:bg-accent/30 rounded-md px-2 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Delete Link (Edit mode or after creation) */}
                {(isEdit || createdContactId) && (
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors underline underline-offset-2"
                    >
                      Delete contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contactPerson?.name || watchedValues.name || 'this contact'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteContactPerson.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
