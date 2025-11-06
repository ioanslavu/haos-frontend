import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Package, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/AppLayout'
import { useDeliverablePack, useCreateDeliverablePackItem, useDeleteDeliverablePackItem } from '@/api/hooks/useArtistSales'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'
import { DeliverablePackDialog } from './components/DeliverablePackDialog'
import { DeliverablePackItemDialog } from './components/DeliverablePackItemDialog'
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
import { toast } from 'sonner'
import { DeliverablePackItem } from '@/types/artist-sales'

export default function DeliverablePackDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DeliverablePackItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<DeliverablePackItem | null>(null)

  const { data: pack, isLoading } = useDeliverablePack(Number(id))
  const deleteMutation = useDeleteDeliverablePackItem()

  const handleAddItem = () => {
    setEditingItem(null)
    setIsItemDialogOpen(true)
  }

  const handleEditItem = (item: DeliverablePackItem) => {
    setEditingItem(item)
    setIsItemDialogOpen(true)
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return

    try {
      await deleteMutation.mutateAsync(deletingItem.id)
      toast.success('Item deleted successfully')
      setDeletingItem(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete item')
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!pack) {
    return (
      <AppLayout>
        <div className="container max-w-4xl py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Deliverable Pack Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  The deliverable pack you're looking for doesn't exist.
                </p>
                <Button onClick={() => navigate('/artist-sales/admin/deliverable-packs')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Deliverable Packs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/artist-sales/admin/deliverable-packs')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{pack.name}</h1>
                <Badge variant={pack.is_active ? 'default' : 'secondary'}>
                  {pack.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{pack.description}</p>
            </div>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        {/* Pack Details */}
        <Card>
          <CardHeader>
            <CardTitle>Pack Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                <p className="text-lg font-semibold">{pack.items?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="text-lg font-semibold">
                  {pack.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-lg font-semibold">{formatDate(pack.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                <p className="text-lg font-semibold">{formatDate(pack.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pack Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Deliverable Items</CardTitle>
                <CardDescription>
                  Items included in this deliverable pack
                </CardDescription>
              </div>
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pack.items && pack.items.length > 0 ? (
              <div className="space-y-3">
                {pack.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          {item.deliverable_type_display || item.deliverable_type}
                        </p>
                        <Badge variant="outline">x{item.quantity}</Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No items in this pack yet</p>
                <Button onClick={handleAddItem} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Item
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeliverablePackDialog
        pack={pack}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <DeliverablePackItemDialog
        packId={pack.id}
        item={editingItem}
        open={isItemDialogOpen}
        onOpenChange={(open) => {
          setIsItemDialogOpen(open)
          if (!open) setEditingItem(null)
        }}
      />

      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
