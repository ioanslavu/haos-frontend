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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateDeliverablePackItem, useUpdateDeliverablePackItem } from '@/api/hooks/useArtistSales'
import { DeliverablePackItem } from '@/types/artist-sales'
import { toast } from 'sonner'

interface DeliverablePackItemDialogProps {
  packId: number
  item: DeliverablePackItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DELIVERABLE_TYPES = [
  { value: 'ig_post', label: 'Instagram Post' },
  { value: 'ig_story', label: 'Instagram Story' },
  { value: 'ig_reel', label: 'Instagram Reel' },
  { value: 'tiktok_video', label: 'TikTok Video' },
  { value: 'youtube_video', label: 'YouTube Video' },
  { value: 'youtube_short', label: 'YouTube Short' },
  { value: 'tvc', label: 'TV Commercial' },
  { value: 'digital_banner', label: 'Digital Banner' },
  { value: 'event', label: 'Event Appearance' },
  { value: 'other', label: 'Other' },
]

const formSchema = z.object({
  deliverable_type: z.string().min(1, 'Type is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function DeliverablePackItemDialog({
  packId,
  item,
  open,
  onOpenChange,
}: DeliverablePackItemDialogProps) {
  const isEdit = !!item
  const createMutation = useCreateDeliverablePackItem()
  const updateMutation = useUpdateDeliverablePackItem()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliverable_type: 'ig_post',
      quantity: 1,
      description: '',
    },
  })

  useEffect(() => {
    if (item && isEdit) {
      form.reset({
        deliverable_type: item.deliverable_type,
        quantity: item.quantity,
        description: item.description || '',
      })
    } else if (!item) {
      form.reset({
        deliverable_type: 'ig_post',
        quantity: 1,
        description: '',
      })
    }
  }, [item, isEdit, form])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({
          id: item.id,
          data,
        })
        toast.success('Item updated successfully')
      } else {
        await createMutation.mutateAsync({
          pack: packId,
          ...data,
        })
        toast.success('Item added successfully')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save item')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Pack Item</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the deliverable item details.'
              : 'Add a new deliverable item to this pack.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deliverable_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deliverable Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific details about this deliverable..."
                      className="min-h-[80px]"
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
                {isEdit ? 'Update' : 'Add'} Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
