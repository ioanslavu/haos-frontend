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
import { useCreateApproval, useUpdateApproval, useDealDeliverables } from '@/api/hooks/useArtistSales'
import { Approval, ApprovalStage, ApprovalStatus } from '@/types/artist-sales'
import { toast } from 'sonner'

interface ApprovalDialogProps {
  dealId: number
  approval: Approval | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STAGES: { value: ApprovalStage; label: string }[] = [
  { value: 'concept', label: 'Concept' },
  { value: 'script', label: 'Script' },
  { value: 'storyboard', label: 'Storyboard' },
  { value: 'rough_cut', label: 'Rough Cut' },
  { value: 'final_cut', label: 'Final Cut' },
  { value: 'caption', label: 'Caption' },
  { value: 'static_kv', label: 'Static Key Visual' },
  { value: 'usage_extension', label: 'Usage Extension' },
  { value: 'other', label: 'Other' },
]

const STATUSES: { value: ApprovalStatus; label: string }[] = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'rejected', label: 'Rejected' },
]

const formSchema = z.object({
  stage: z.enum([
    'concept', 'script', 'storyboard', 'rough_cut', 'final_cut',
    'caption', 'static_kv', 'usage_extension', 'other'
  ] as const),
  version: z.number().min(1, 'Version must be at least 1').default(1),
  status: z.enum(['pending', 'approved', 'changes_requested', 'rejected'] as const).default('pending'),
  submitted_at: z.string().min(1, 'Submission date is required'),
  approved_at: z.string().optional(),
  deliverable: z.number().optional(),
  notes: z.string().optional(),
  file_url: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function ApprovalDialog({
  dealId,
  approval,
  open,
  onOpenChange,
}: ApprovalDialogProps) {
  const isEdit = !!approval
  const createMutation = useCreateApproval()
  const updateMutation = useUpdateApproval()
  const { data: deliverables } = useDealDeliverables(dealId)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stage: 'concept',
      version: 1,
      status: 'pending',
      submitted_at: new Date().toISOString().split('T')[0],
      approved_at: '',
      deliverable: undefined,
      notes: '',
      file_url: '',
    },
  })

  useEffect(() => {
    if (approval && isEdit) {
      form.reset({
        stage: approval.stage,
        version: approval.version,
        status: approval.status,
        submitted_at: approval.submitted_at.split('T')[0],
        approved_at: approval.approved_at ? approval.approved_at.split('T')[0] : '',
        deliverable: approval.deliverable?.id,
        notes: approval.notes || '',
        file_url: approval.file_url || '',
      })
    } else if (!approval) {
      form.reset({
        stage: 'concept',
        version: 1,
        status: 'pending',
        submitted_at: new Date().toISOString().split('T')[0],
        approved_at: '',
        deliverable: undefined,
        notes: '',
        file_url: '',
      })
    }
  }, [approval, isEdit, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        deal: dealId,
        ...data,
        approved_at: data.approved_at || null,
        deliverable: data.deliverable || null,
        notes: data.notes || '',
        file_url: data.file_url || null,
      }

      if (isEdit && approval) {
        await updateMutation.mutateAsync({
          id: approval.id,
          data: payload,
        })
        toast.success('Approval updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Approval created')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save approval')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Approval</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update approval details.'
              : 'Add an approval stage for this deal.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
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
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version *</FormLabel>
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
              name="deliverable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Deliverable</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : parseInt(value))}
                    value={field.value?.toString() || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deliverable (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {deliverables?.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.deliverable_type_display || d.deliverable_type} - {d.description.substring(0, 50)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Link this approval to a specific deliverable
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="submitted_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submitted Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approved_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approved Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty if not yet approved
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="file_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the file for approval (Google Drive, S3, etc.)
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
                      placeholder="Feedback, comments, or instructions..."
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
                {isEdit ? 'Update' : 'Create'} Approval
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
