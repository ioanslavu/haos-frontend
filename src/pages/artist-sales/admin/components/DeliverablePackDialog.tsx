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
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useCreateDeliverablePack, useUpdateDeliverablePack } from '@/api/hooks/useArtistSales'
import { DeliverablePack } from '@/types/artist-sales'
import { toast } from 'sonner'

interface DeliverablePackDialogProps {
  pack: DeliverablePack | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

export function DeliverablePackDialog({
  pack,
  open,
  onOpenChange,
}: DeliverablePackDialogProps) {
  const isEdit = !!pack
  const createMutation = useCreateDeliverablePack()
  const updateMutation = useUpdateDeliverablePack()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (pack && isEdit) {
      form.reset({
        name: pack.name,
        description: pack.description || '',
        is_active: pack.is_active,
      })
    } else if (!pack) {
      form.reset({
        name: '',
        description: '',
        is_active: true,
      })
    }
  }, [pack, isEdit, form])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && pack) {
        await updateMutation.mutateAsync({
          id: pack.id,
          data,
        })
        toast.success('Deliverable pack updated')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Deliverable pack created')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save deliverable pack')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Create'} Deliverable Pack</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update pack details. You can manage items from the pack detail page.'
              : 'Create a new deliverable pack. You can add items after creation.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pack Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Standard Social Media Package" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this pack includes..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Make this pack available for selection when creating deals
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {isEdit ? 'Update' : 'Create'} Pack
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
