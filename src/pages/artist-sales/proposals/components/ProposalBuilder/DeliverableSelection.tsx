import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Package } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProposalBuilderData } from './index'
import { useDeliverablePacks } from '@/api/hooks/useArtistSales'
import { Badge } from '@/components/ui/badge'

interface DeliverableSelectionProps {
  data: ProposalBuilderData
  updateData: (updates: Partial<ProposalBuilderData>) => void
}

const DELIVERABLE_TYPES = [
  { value: 'ig_post', label: 'Instagram Post' },
  { value: 'ig_story', label: 'Instagram Story' },
  { value: 'ig_reel', label: 'Instagram Reel' },
  { value: 'tiktok_video', label: 'TikTok Video' },
  { value: 'youtube_video', label: 'YouTube Video' },
  { value: 'tvc', label: 'TV Commercial' },
  { value: 'event', label: 'Event Appearance' },
  { value: 'other', label: 'Other' },
]

export function DeliverableSelection({ data, updateData }: DeliverableSelectionProps) {
  const { data: packsData } = useDeliverablePacks()
  const packs = packsData?.results?.filter((p) => p.is_active) || []

  const [selectedType, setSelectedType] = useState('ig_post')
  const [quantity, setQuantity] = useState('1')
  const [description, setDescription] = useState('')

  const handleAddDeliverable = () => {
    const newDeliverable = {
      type: selectedType,
      quantity: parseInt(quantity) || 1,
      description,
    }
    updateData({ deliverables: [...data.deliverables, newDeliverable] })
    setQuantity('1')
    setDescription('')
  }

  const handleRemoveDeliverable = (index: number) => {
    updateData({
      deliverables: data.deliverables.filter((_, i) => i !== index),
    })
  }

  const handleUsePack = (packId: number) => {
    const pack = packs.find((p) => p.id === packId)
    if (pack?.items) {
      const newDeliverables = pack.items.map((item) => ({
        type: item.deliverable_type,
        quantity: item.quantity,
        description: item.description,
      }))
      updateData({ deliverables: [...data.deliverables, ...newDeliverables] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Deliverable Packs */}
      {packs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Quick Add from Packs</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {packs.map((pack) => (
              <div key={pack.id} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{pack.name}</p>
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <Badge variant="outline" className="text-xs mb-3">
                  {pack.items_count || 0} items
                </Badge>
                <Button size="sm" variant="outline" onClick={() => handleUsePack(pack.id)} className="w-full">
                  Add Pack
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Deliverable Form */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <h3 className="font-semibold">Add Custom Deliverable</h3>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DELIVERABLE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="e.g., 1080x1080px"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleAddDeliverable} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Deliverable
        </Button>
      </div>

      {/* Selected Deliverables */}
      <div className="space-y-3">
        <h3 className="font-semibold">Selected Deliverables ({data.deliverables.length})</h3>

        {data.deliverables.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            No deliverables added yet
          </div>
        ) : (
          <div className="space-y-2">
            {data.deliverables.map((deliverable, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-background"
              >
                <div>
                  <p className="font-medium">
                    {DELIVERABLE_TYPES.find((t) => t.value === deliverable.type)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {deliverable.quantity}
                    {deliverable.description && ` • ${deliverable.description}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveDeliverable(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
