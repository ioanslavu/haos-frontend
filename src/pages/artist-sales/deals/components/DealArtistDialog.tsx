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
import { useCreateDealArtist, useUpdateDealArtist } from '@/api/hooks/useArtistSales'
import { DealArtist } from '@/types/artist-sales'
import { toast } from 'sonner'

interface DealArtistDialogProps {
  dealId: number
  currency: string
  artist: DealArtist | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  artist: z.number({ required_error: 'Artist is required' }),
  role: z.enum(['main', 'featured', 'guest', 'ensemble']),
  artist_fee: z.string().min(1, 'Fee is required').regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  revenue_share_percent: z.string().optional(),
  contract_status: z.enum(['pending', 'signed', 'active']).default('pending'),
  signed_date: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function DealArtistDialog({
  dealId,
  currency,
  artist,
  open,
  onOpenChange,
}: DealArtistDialogProps) {
  const isEdit = !!artist
  const createMutation = useCreateDealArtist()
  const updateMutation = useUpdateDealArtist()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artist: undefined,
      role: 'main',
      artist_fee: '',
      revenue_share_percent: '',
      contract_status: 'pending',
      signed_date: '',
    },
  })

  useEffect(() => {
    if (artist && isEdit) {
      form.reset({
        artist: artist.artist.id,
        role: artist.role,
        artist_fee: artist.artist_fee,
        revenue_share_percent: artist.revenue_share_percent || '',
        contract_status: artist.contract_status,
        signed_date: artist.signed_date || '',
      })
    } else if (!artist) {
      form.reset({
        artist: undefined,
        role: 'main',
        artist_fee: '',
        revenue_share_percent: '',
        contract_status: 'pending',
        signed_date: '',
      })
    }
  }, [artist, isEdit, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        deal: dealId,
        ...data,
        revenue_share_percent: data.revenue_share_percent || null,
        signed_date: data.signed_date || null,
      }

      if (isEdit && artist) {
        await updateMutation.mutateAsync({
          id: artist.id,
          data: payload,
        })
        toast.success('Artist updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Artist added to deal')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save artist')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Deal Artist</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update artist details for this deal.'
              : 'Add an artist to this deal with their fee and contract details.'
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

            <div className="grid grid-cols-2 gap-4">
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
                name="contract_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="artist_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Fee ({currency}) *</FormLabel>
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
                    Fixed fee for this artist
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revenue_share_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue Share (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="15.00"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.]/g, '')
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional revenue share percentage for performance-based deals
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signed_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signed Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                {isEdit ? 'Update' : 'Add'} Artist
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
