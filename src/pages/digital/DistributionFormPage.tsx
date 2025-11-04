import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { distributionsService } from '@/api/services/distributions.service'
import { DistributionFormData } from '@/types/distribution'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { useToast } from '@/hooks/use-toast'
import { EntityListItem } from '@/api/services/entities.service'

export default function DistributionFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEdit = !!id
  const [selectedEntity, setSelectedEntity] = useState<EntityListItem | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DistributionFormData>({
    defaultValues: {
      deal_status: 'in_negotiation',
      global_revenue_share_percentage: '70',
      signing_date: new Date().toISOString().split('T')[0],
    },
  })

  // Fetch distribution if editing
  const { data: distribution } = useQuery({
    queryKey: ['distribution', id],
    queryFn: () => distributionsService.getDistribution(Number(id)),
    enabled: isEdit,
  })

  // Populate form when editing
  useEffect(() => {
    if (distribution && isEdit) {
      setValue('entity', distribution.entity.id)
      setValue('deal_type', distribution.deal_type)
      setValue('deal_status', distribution.deal_status)
      setValue('global_revenue_share_percentage', distribution.global_revenue_share_percentage)
      setValue('signing_date', distribution.signing_date)
      setValue('contact_person', distribution.contact_person?.id)
      setValue('contract', distribution.contract?.id)
      setValue('notes', distribution.notes)
      setValue('special_terms', distribution.special_terms)
    }
  }, [distribution, isEdit, setValue])

  // Auto-populate deal_type based on entity roles
  useEffect(() => {
    if (selectedEntity && !isEdit) {
      const roles = selectedEntity.roles || []

      // Priority: artist > label > aggregator
      if (roles.some(role => role.toLowerCase() === 'artist')) {
        setValue('deal_type', 'artist')
      } else if (roles.some(role => role.toLowerCase() === 'label')) {
        setValue('deal_type', 'label')
      } else if (roles.some(role => role.toLowerCase() === 'aggregator')) {
        setValue('deal_type', 'aggregator')
      }
    }
  }, [selectedEntity, isEdit, setValue])

  const createMutation = useMutation({
    mutationFn: (data: DistributionFormData) => distributionsService.createDistribution(data),
    onSuccess: (data) => {
      toast({ title: 'Distribution created successfully' })
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      navigate(`/digital/distributions/${data.id}`)
    },
    onError: () => {
      toast({ title: 'Failed to create distribution', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: DistributionFormData) =>
      distributionsService.updateDistribution(Number(id), data),
    onSuccess: (data) => {
      toast({ title: 'Distribution updated successfully' })
      queryClient.invalidateQueries({ queryKey: ['distribution', id] })
      navigate(`/digital/distributions/${data.id}`)
    },
    onError: () => {
      toast({ title: 'Failed to update distribution', variant: 'destructive' })
    },
  })

  const onSubmit = (data: DistributionFormData) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Distribution' : 'New Distribution'}</h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update distribution deal details' : 'Create a new distribution deal'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Distribution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Entity */}
            <div className="space-y-2">
              <Label htmlFor="entity">Entity (Artist/Label/Aggregator) *</Label>
              <EntitySearchCombobox
                value={watch('entity')}
                onValueChange={(value) => setValue('entity', value || undefined)}
                onEntitySelect={(entity) => setSelectedEntity(entity)}
                placeholder="Search for entity..."
                useBusinessEndpoint={true}
              />
              {errors.entity && <p className="text-sm text-destructive">{errors.entity.message}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Deal Type */}
              <div className="space-y-2">
                <Label htmlFor="deal_type">Deal Type</Label>
                <Select
                  value={watch('deal_type')}
                  onValueChange={(value) => setValue('deal_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-populated from entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="label">Label</SelectItem>
                    <SelectItem value="aggregator">Aggregator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto-populated from entity roles, but editable</p>
              </div>

              {/* Deal Status */}
              <div className="space-y-2">
                <Label htmlFor="deal_status">Status *</Label>
                <Select
                  value={watch('deal_status')}
                  onValueChange={(value) => setValue('deal_status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_negotiation">In Negotiation</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Share */}
              <div className="space-y-2">
                <Label htmlFor="global_revenue_share_percentage">Global Revenue Share % *</Label>
                <Input
                  id="global_revenue_share_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('global_revenue_share_percentage', { required: true })}
                />
                <p className="text-xs text-muted-foreground">Percentage for the artist/entity (0-100)</p>
              </div>

              {/* Signing Date */}
              <div className="space-y-2">
                <Label htmlFor="signing_date">Signing Date *</Label>
                <Input id="signing_date" type="date" {...register('signing_date', { required: true })} />
              </div>
            </div>

            {/* Special Terms */}
            <div className="space-y-2">
              <Label htmlFor="special_terms">Special Terms</Label>
              <Textarea
                id="special_terms"
                rows={3}
                placeholder="Enter any special terms or conditions..."
                {...register('special_terms')}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Additional notes about this distribution..."
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? 'Update Distribution' : 'Create Distribution'}
          </Button>
        </div>
      </form>
      </div>
    </AppLayout>
  )
}
