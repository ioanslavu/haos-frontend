import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { distributionsService } from '@/api/services/distributions.service'
import catalogService from '@/api/services/catalog.service'
import { DistributionCatalogItemFormData, Platform } from '@/types/distribution'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

interface AddCatalogItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  distributionId: number
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple_music', label: 'Apple Music' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'amazon_music', label: 'Amazon Music' },
  { value: 'deezer', label: 'Deezer' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'soundcloud', label: 'SoundCloud' },
]

export function AddCatalogItemDialog({ open, onOpenChange, distributionId }: AddCatalogItemDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [catalogType, setCatalogType] = useState<'recording' | 'release'>('recording')

  const { register, handleSubmit, setValue, watch, reset } = useForm<DistributionCatalogItemFormData>({
    defaultValues: {
      platforms: [],
      distribution_status: 'pending',
    },
  })

  // Fetch recordings
  const { data: recordingsData } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => catalogService.getRecordings({ page_size: 1000 }),
    enabled: catalogType === 'recording',
  })

  // Fetch releases
  const { data: releasesData } = useQuery({
    queryKey: ['releases'],
    queryFn: () => catalogService.getReleases({ page_size: 1000 }),
    enabled: catalogType === 'release',
  })

  const addItemMutation = useMutation({
    mutationFn: (data: DistributionCatalogItemFormData) =>
      distributionsService.addCatalogItem(distributionId, data),
    onSuccess: () => {
      toast({ title: 'Catalog item added successfully' })
      // Invalidate with string to match URL param type
      queryClient.invalidateQueries({ queryKey: ['distribution', distributionId.toString()] })
      // Also invalidate the distributions list
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      onOpenChange(false)
      reset()
      setSelectedPlatforms([])
    },
    onError: () => {
      toast({ title: 'Failed to add catalog item', variant: 'destructive' })
    },
  })

  const togglePlatform = (platform: Platform) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform]
    setSelectedPlatforms(newPlatforms)
    setValue('platforms', newPlatforms)
  }

  const onSubmit = (data: DistributionCatalogItemFormData) => {
    data.platforms = selectedPlatforms
    addItemMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Catalog Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Catalog Type */}
          <div className="space-y-2">
            <Label>Catalog Type</Label>
            <Select value={catalogType} onValueChange={(value) => setCatalogType(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recording">Recording (Single Track)</SelectItem>
                <SelectItem value="release">Release (Album/EP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recording/Release Select */}
          {catalogType === 'recording' ? (
            <div className="space-y-2">
              <Label htmlFor="recording">Recording *</Label>
              <Select
                value={watch('recording')?.toString()}
                onValueChange={(value) => {
                  setValue('recording', Number(value))
                  setValue('release', null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recording" />
                </SelectTrigger>
                <SelectContent>
                  {recordingsData?.results?.map((recording) => (
                    <SelectItem key={recording.id} value={recording.id.toString()}>
                      {recording.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="release">Release *</Label>
              <Select
                value={watch('release')?.toString()}
                onValueChange={(value) => {
                  setValue('release', Number(value))
                  setValue('recording', null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select release" />
                </SelectTrigger>
                <SelectContent>
                  {releasesData?.results?.map((release) => (
                    <SelectItem key={release.id} value={release.id.toString()}>
                      {release.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Distribution Platforms *</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => (
                <div key={platform.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.value}
                    checked={selectedPlatforms.includes(platform.value)}
                    onCheckedChange={() => togglePlatform(platform.value)}
                  />
                  <label
                    htmlFor={platform.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {platform.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Share Override */}
            <div className="space-y-2">
              <Label htmlFor="individual_revenue_share">Individual Revenue Share % (Optional)</Label>
              <Input
                id="individual_revenue_share"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Leave empty to use global"
                {...register('individual_revenue_share')}
              />
              <p className="text-xs text-muted-foreground">Override global revenue share for this item</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="distribution_status">Status *</Label>
              <Select
                value={watch('distribution_status')}
                onValueChange={(value) => setValue('distribution_status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="taken_down">Taken Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Release Date */}
          <div className="space-y-2">
            <Label htmlFor="release_date">Release Date</Label>
            <Input id="release_date" type="date" {...register('release_date')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addItemMutation.isPending}>
              Add Catalog Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
