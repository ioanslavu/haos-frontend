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
import { useCreateUsageTerms, useUpdateUsageTerms } from '@/api/hooks/useArtistSales'
import { UsageTerms, UsageScope } from '@/types/artist-sales'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

interface UsageTermsDialogProps {
  terms: UsageTerms | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const USAGE_SCOPES: { value: UsageScope; label: string }[] = [
  { value: 'digital', label: 'Digital' },
  { value: 'atl', label: 'ATL (Above The Line)' },
  { value: 'btl', label: 'BTL (Below The Line)' },
  { value: 'ooh', label: 'Out of Home' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'in_store', label: 'In Store' },
  { value: 'global', label: 'Global' },
  { value: 'print', label: 'Print' },
  { value: 'broadcast', label: 'Broadcast (TV/Radio)' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'events', label: 'Events' },
]

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  usage_scope: z.array(z.string()).min(1, 'Select at least one usage scope'),
  territories: z.string().min(1, 'Territories are required'),
  exclusivity_category: z.string().optional(),
  exclusivity_duration_days: z.number().optional(),
  usage_duration_days: z.number().min(1, 'Usage duration is required'),
  extensions_allowed: z.boolean().default(true),
  buyout: z.boolean().default(false),
  brand_list_blocked: z.string().optional(),
  is_template: z.boolean().default(true),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function UsageTermsDialog({
  terms,
  open,
  onOpenChange,
}: UsageTermsDialogProps) {
  const isEdit = !!terms
  const createMutation = useCreateUsageTerms()
  const updateMutation = useUpdateUsageTerms()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      usage_scope: [],
      territories: 'RO',
      exclusivity_category: '',
      exclusivity_duration_days: undefined,
      usage_duration_days: 365,
      extensions_allowed: true,
      buyout: false,
      brand_list_blocked: '',
      is_template: true,
      notes: '',
    },
  })

  useEffect(() => {
    if (terms && isEdit) {
      form.reset({
        name: terms.name,
        usage_scope: terms.usage_scope,
        territories: terms.territories?.join(', ') || '',
        exclusivity_category: terms.exclusivity_category || '',
        exclusivity_duration_days: terms.exclusivity_duration_days || undefined,
        usage_duration_days: terms.usage_duration_days,
        extensions_allowed: terms.extensions_allowed,
        buyout: terms.buyout,
        brand_list_blocked: terms.brand_list_blocked?.join(', ') || '',
        is_template: terms.is_template,
        notes: terms.notes || '',
      })
    } else if (!terms) {
      form.reset({
        name: '',
        usage_scope: [],
        territories: 'RO',
        exclusivity_category: '',
        exclusivity_duration_days: undefined,
        usage_duration_days: 365,
        extensions_allowed: true,
        buyout: false,
        brand_list_blocked: '',
        is_template: true,
        notes: '',
      })
    }
  }, [terms, isEdit, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.name,
        usage_scope: data.usage_scope as UsageScope[],
        territories: data.territories.split(',').map(t => t.trim()),
        exclusivity_category: data.exclusivity_category || '',
        exclusivity_duration_days: data.exclusivity_duration_days || null,
        usage_duration_days: data.usage_duration_days,
        extensions_allowed: data.extensions_allowed,
        buyout: data.buyout,
        brand_list_blocked: data.brand_list_blocked
          ? data.brand_list_blocked.split(',').map(b => b.trim())
          : [],
        is_template: data.is_template,
        notes: data.notes || '',
      }

      if (isEdit && terms) {
        await updateMutation.mutateAsync({
          id: terms.id,
          data: payload,
        })
        toast.success('Usage terms updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Usage terms created')
      }

      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save usage terms')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Create'} Usage Terms Template</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update usage rights template details.'
              : 'Create a new reusable usage rights template.'
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
                  <FormLabel>Template Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digital Only - 12 Months" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usage_scope"
              render={() => (
                <FormItem>
                  <FormLabel>Usage Scope *</FormLabel>
                  <FormDescription>
                    Select all applicable usage types
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {USAGE_SCOPES.map((scope) => (
                      <FormField
                        key={scope.value}
                        control={form.control}
                        name="usage_scope"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(scope.value)}
                                onCheckedChange={(checked) => {
                                  const value = field.value || []
                                  if (checked) {
                                    field.onChange([...value, scope.value])
                                  } else {
                                    field.onChange(value.filter((v: string) => v !== scope.value))
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {scope.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="territories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Territories *</FormLabel>
                    <FormControl>
                      <Input placeholder="RO, GLOBAL, etc" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Comma-separated ISO codes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usage_duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Duration (days) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 365)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exclusivity_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exclusivity Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Beverage, Automotive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exclusivity_duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exclusivity Duration (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="brand_list_blocked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blocked Brands</FormLabel>
                  <FormControl>
                    <Input placeholder="Brand1, Brand2, Brand3" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Comma-separated list of brands to exclude
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
                      placeholder="Additional details..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="extensions_allowed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Extensions Allowed
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyout"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Buyout
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_template"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Template
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

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
                {isEdit ? 'Update' : 'Create'} Template
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
