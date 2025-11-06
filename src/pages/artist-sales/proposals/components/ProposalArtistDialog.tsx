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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { useCreateProposalArtist, useUpdateProposalArtist } from '@/api/hooks/useArtistSales'
import { ProposalArtist } from '@/types/artist-sales'
import { toast } from 'sonner'

interface ProposalArtistDialogProps {
  proposalId: number
  currency: string
  artist: ProposalArtist | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  artist: z.number({ required_error: 'Artist is required' }),
  role: z.enum(['main', 'featured', 'guest', 'ensemble']),
  proposed_fee: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function ProposalArtistDialog({
  proposalId,
  currency,
  artist,
  open,
  onOpenChange,
}: ProposalArtistDialogProps) {
  const isEdit = !!artist
  const createMutation = useCreateProposalArtist()
  const updateMutation = useUpdateProposalArtist()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artist: undefined,
      role: 'main',
      proposed_fee: '',
    },
  })

  useEffect(() => {
    if (artist && isEdit) {
      form.reset({
        artist: artist.artist.id,
        role: artist.role,
        proposed_fee: artist.proposed_fee || '',
      })
    } else if (!artist) {
      form.reset({
        artist: undefined,
        role: 'main',
        proposed_fee: '',
      })
    }
  }, [artist, isEdit, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        proposal: proposalId,
        ...data,
        proposed_fee: data.proposed_fee || null,
      }

      if (isEdit && artist) {
        await updateMutation.mutateAsync({
          id: artist.id,
          data: payload,
        })
        toast.success('Artist updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Artist added to proposal')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save artist')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Proposal Artist</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update artist details for this proposal.'
              : 'Add an artist to this proposal with their role and proposed fee.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist *</FormLabel>
                  <FormControl>
                    <EntitySearchCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search for artist..."
                      filter={{ has_role: 'artist' }}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="ensemble">Ensemble</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proposed_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Fee ({currency})</FormLabel>
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
                  <FormDescription>
                    Optional proposed fee for this artist
                  </FormDescription>
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
                {isEdit ? 'Update' : 'Add'} Artist
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
