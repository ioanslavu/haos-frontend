import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useDealDeliverables,
  useDeleteDealDeliverable,
} from '@/api/hooks/useArtistSales'
import { DealDeliverable, DELIVERABLE_STATUS_LABELS, DELIVERABLE_STATUS_COLORS } from '@/types/artist-sales'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { DealDeliverableDialog } from './DealDeliverableDialog'
import { DeliverablePackDialog } from './DeliverablePackDialog'

interface DealDeliverablesTabProps {
  dealId: number
}

export function DealDeliverablesTab({ dealId }: DealDeliverablesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPackDialogOpen, setIsPackDialogOpen] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<DealDeliverable | null>(null)
  const [deletingDeliverable, setDeletingDeliverable] = useState<DealDeliverable | null>(null)

  const { data: deliverables, isLoading } = useDealDeliverables(dealId)
  const deleteMutation = useDeleteDealDeliverable()

  // Ensure deliverables is always an array
  const deliverablesList = Array.isArray(deliverables) ? deliverables : []

  const handleEdit = (deliverable: DealDeliverable) => {
    setEditingDeliverable(deliverable)
    setIsDialogOpen(true)
  }

  const handleAddCustom = () => {
    setEditingDeliverable(null)
    setIsDialogOpen(true)
  }

  const handleAddFromPack = () => {
    setIsPackDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingDeliverable) return

    try {
      await deleteMutation.mutateAsync(deletingDeliverable.id)
      toast.success('Deliverable deleted')
      setDeletingDeliverable(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete deliverable')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deliverables</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleAddFromPack} size="sm" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              From Pack
            </Button>
            <Button onClick={handleAddCustom} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Custom
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {deliverablesList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No deliverables added yet</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleAddFromPack} variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Add from Pack
                </Button>
                <Button onClick={handleAddCustom}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Deliverable
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliverablesList.map((deliverable) => (
                    <TableRow key={deliverable.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          {deliverable.deliverable_type_display || deliverable.deliverable_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-2">{deliverable.description}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {deliverable.quantity}
                      </TableCell>
                      <TableCell>
                        {deliverable.due_date ? formatDate(deliverable.due_date) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={DELIVERABLE_STATUS_COLORS[deliverable.status] || ''}>
                          {DELIVERABLE_STATUS_LABELS[deliverable.status] || deliverable.status_display || deliverable.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deliverable.cost_center || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(deliverable)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingDeliverable(deliverable)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DealDeliverableDialog
        dealId={dealId}
        deliverable={editingDeliverable}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingDeliverable(null)
        }}
      />

      <DeliverablePackDialog
        dealId={dealId}
        open={isPackDialogOpen}
        onOpenChange={setIsPackDialogOpen}
      />

      <AlertDialog open={!!deletingDeliverable} onOpenChange={() => setDeletingDeliverable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deliverable? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
