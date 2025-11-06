import { useState } from 'react'
import { Loader2, Package, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  useDeliverablePacks,
  useDeliverablePack,
  useCreateDealDeliverable,
} from '@/api/hooks/useArtistSales'
import { DeliverablePack } from '@/types/artist-sales'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DeliverablePackDialogProps {
  dealId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeliverablePackDialog({
  dealId,
  open,
  onOpenChange,
}: DeliverablePackDialogProps) {
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { data: packsData, isLoading: packsLoading } = useDeliverablePacks({ is_active: true })
  const { data: selectedPack, isLoading: packLoading } = useDeliverablePack(
    selectedPackId || 0,
    !!selectedPackId
  )
  const createMutation = useCreateDealDeliverable()

  const packs = packsData?.results || []

  const handlePackSelect = (pack: DeliverablePack) => {
    setSelectedPackId(pack.id)
  }

  const handleCreateFromPack = async () => {
    if (!selectedPack || !selectedPack.items) return

    setIsCreating(true)
    try {
      // Create all deliverables from pack items
      const promises = selectedPack.items.map((item) =>
        createMutation.mutateAsync({
          deal: dealId,
          deliverable_type: item.deliverable_type,
          quantity: item.quantity,
          description: item.description,
          status: 'planned',
          asset_url: '',
          cost_center: '',
          notes: `Created from pack: ${selectedPack.name}`,
          kpi_target: {},
          kpi_actual: {},
        })
      )

      await Promise.all(promises)

      toast.success(
        `Created ${selectedPack.items.length} deliverable${selectedPack.items.length > 1 ? 's' : ''} from ${selectedPack.name}`
      )
      onOpenChange(false)
      setSelectedPackId(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create deliverables')
    } finally {
      setIsCreating(false)
    }
  }

  const handleBack = () => {
    setSelectedPackId(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedPackId ? 'Pack Details' : 'Select Deliverable Pack'}
          </DialogTitle>
          <DialogDescription>
            {selectedPackId
              ? 'Review the deliverables that will be created from this pack.'
              : 'Choose a deliverable pack to add multiple deliverables at once.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedPackId ? (
            // Pack selection view
            <>
              {packsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : packs.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No deliverable packs available</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {packs.map((pack) => (
                    <Card
                      key={pack.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handlePackSelect(pack)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{pack.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {pack.description}
                            </CardDescription>
                          </div>
                          {pack.items_count && (
                            <Badge variant="secondary">
                              {pack.items_count} item{pack.items_count > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Pack details view
            <>
              {packLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedPack ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{selectedPack.name}</CardTitle>
                      <CardDescription>{selectedPack.description}</CardDescription>
                    </CardHeader>
                  </Card>

                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Deliverables to be created ({selectedPack.items?.length || 0}):
                    </h4>
                    <div className="space-y-2">
                      {selectedPack.items?.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <Check className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.deliverable_type_display || item.deliverable_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Quantity: {item.quantity}
                              </span>
                            </div>
                            <p className="text-sm">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {selectedPackId ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isCreating}
              >
                Back
              </Button>
              <Button onClick={handleCreateFromPack} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Deliverables
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="ml-auto"
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
