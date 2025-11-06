import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { useCreateDealDeliverable, useUpdateDealDeliverable } from '@/api/hooks/useArtistSales'
import { DealDeliverable, DeliverableType, DeliverableStatus } from '@/types/artist-sales'
import { toast } from 'sonner'

interface DealDeliverableDialogProps {
  dealId: number
  deliverable: DealDeliverable | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DELIVERABLE_TYPES: { value: DeliverableType; label: string }[] = [
  { value: 'ig_post', label: 'Instagram Post' },
  { value: 'ig_story', label: 'Instagram Story' },
  { value: 'ig_reel', label: 'Instagram Reel' },
  { value: 'tiktok_video', label: 'TikTok Video' },
  { value: 'youtube_video', label: 'YouTube Video' },
  { value: 'youtube_short', label: 'YouTube Short' },
  { value: 'tvc', label: 'TV Commercial' },
  { value: 'radio_spot', label: 'Radio Spot' },
  { value: 'event', label: 'Event' },
  { value: 'ooh', label: 'Out of Home' },
  { value: 'billboard', label: 'Billboard' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'print_ad', label: 'Print Ad' },
  { value: 'digital_banner', label: 'Digital Banner' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'livestream', label: 'Livestream' },
  { value: 'other', label: 'Other' },
]

const STATUSES: { value: DeliverableStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'completed', label: 'Completed' },
]

const formSchema = z.object({
  deliverable_type: z.enum([
    'ig_post', 'ig_story', 'ig_reel', 'tiktok_video', 'youtube_video', 'youtube_short',
    'tvc', 'radio_spot', 'event', 'ooh', 'billboard', 'packaging', 'print_ad',
    'digital_banner', 'podcast', 'livestream', 'other'
  ] as const),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  description: z.string().min(1, 'Description is required'),
  due_date: z.string().optional(),
  status: z.enum([
    'planned', 'in_progress', 'submitted', 'approved', 'rejected', 'revision_requested', 'completed'
  ] as const).default('planned'),
  asset_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  cost_center: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function DealDeliverableDialog({
  dealId,
  deliverable,
  open,
  onOpenChange,
}: DealDeliverableDialogProps) {
  const isEdit = !!deliverable
  const createMutation = useCreateDealDeliverable()
  const updateMutation = useUpdateDealDeliverable()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliverable_type: 'ig_post',
      quantity: 1,
      description: '',
      due_date: '',
      status: 'planned',
      asset_url: '',
      cost_center: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (deliverable && isEdit) {
      form.reset({
        deliverable_type: deliverable.deliverable_type,
        quantity: deliverable.quantity,
        description: deliverable.description,
        due_date: deliverable.due_date || '',
        status: deliverable.status,
        asset_url: deliverable.asset_url || '',
        cost_center: deliverable.cost_center || '',
        notes: deliverable.notes || '',
      })
    } else if (!deliverable) {
      form.reset({
        deliverable_type: 'ig_post',
        quantity: 1,
        description: '',
        due_date: '',
        status: 'planned',
        asset_url: '',
        cost_center: '',
        notes: '',
      })
    }
  }, [deliverable, isEdit, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        deal: dealId,
        ...data,
        due_date: data.due_date || null,
        asset_url: data.asset_url || '',
        cost_center: data.cost_center || '',
        notes: data.notes || '',
        kpi_target: {},
        kpi_actual: {},
      }

      if (isEdit && deliverable) {
        await updateMutation.mutateAsync({
          id: deliverable.id,
          data: payload,
        })
        toast.success('Deliverable updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Deliverable created')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save deliverable')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Deliverable</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update deliverable details.'
              : 'Add a custom deliverable to this deal.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deliverable_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DELIVERABLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the deliverable..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cost_center"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Center</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MKTG-2024-Q1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asset_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to Google Drive, S3, or other file storage
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      className="min-h-[60px]"
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
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? 'Update' : 'Create'} Deliverable
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
