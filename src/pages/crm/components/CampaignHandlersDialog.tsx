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
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Campaign, CAMPAIGN_HANDLER_ROLE_LABELS } from '@/types/campaign'
import { useUpdateCampaign } from '@/api/hooks/useCampaigns'
import { useUsersList } from '@/api/hooks/useUsers'
import { Plus, X, Users } from 'lucide-react'
import { toast } from 'sonner'

const handlerSchema = z.object({
  user: z.number({ required_error: 'User is required' }),
  role: z.enum(['lead', 'support', 'observer']),
})

const handlersFormSchema = z.object({
  handlers: z.array(handlerSchema),
})

type HandlersFormData = z.infer<typeof handlersFormSchema>

interface CampaignHandlersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign
}

export function CampaignHandlersDialog({
  open,
  onOpenChange,
  campaign,
}: CampaignHandlersDialogProps) {
  const updateCampaign = useUpdateCampaign()

  // Fetch users for handler selection
  const { data: usersData } = useUsersList({ is_active: true })
  const users = usersData?.results || []

  const form = useForm<HandlersFormData>({
    resolver: zodResolver(handlersFormSchema),
    defaultValues: {
      handlers: [],
    },
  })

  const {
    fields: handlerFields,
    append: appendHandler,
    remove: removeHandler,
  } = useFieldArray({
    control: form.control,
    name: 'handlers',
  })

  // Reset form when dialog opens or campaign changes
  useEffect(() => {
    if (open && campaign) {
      form.reset({
        handlers: campaign.handlers?.map(h => ({ user: h.user, role: h.role })) || [],
      })
    }
  }, [open, campaign, form])

  const onSubmit = async (data: HandlersFormData) => {
    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        data: {
          handlers: data.handlers,
        },
      })
      toast.success('Campaign handlers updated successfully')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update handlers')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Campaign Handlers
          </DialogTitle>
          <DialogDescription>
            Assign team members to handle "{campaign.campaign_name}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Campaign Handlers</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendHandler({ user: undefined as any, role: 'support' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Handler
                </Button>
              </div>

              {handlerFields.length > 0 ? (
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
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-muted/20">
                  No handlers assigned. Click "Add Handler" to assign team members.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCampaign.isPending}>
                {updateCampaign.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
