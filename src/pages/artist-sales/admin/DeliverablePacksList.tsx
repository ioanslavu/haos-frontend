import { useState } from 'react'
import { Plus, Edit, Trash2, Package, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AppLayout } from '@/components/layout/AppLayout'
import { useDeliverablePacks } from '@/api/hooks/useArtistSales'
import { DeliverablePack } from '@/types/artist-sales'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { DeliverablePackDialog } from './components/DeliverablePackDialog'

export default function DeliverablePacksList() {
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPack, setEditingPack] = useState<DeliverablePack | null>(null)
  const [deletingPack, setDeletingPack] = useState<DeliverablePack | null>(null)

  const { data: packsData, isLoading } = useDeliverablePacks()
  const packs = packsData?.results || []

  const handleEdit = (pack: DeliverablePack) => {
    setEditingPack(pack)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingPack(null)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (pack: DeliverablePack) => {
    navigate(`/artist-sales/admin/deliverable-packs/${pack.id}`)
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

  return (
    <AppLayout>
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deliverable Packs</h1>
            <p className="text-muted-foreground mt-2">
              Manage reusable deliverable templates for faster deal creation
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            New Pack
          </Button>
        </div>

        {packs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No deliverable packs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first deliverable pack to speed up deal creation
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Pack
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <Card
                key={pack.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleViewDetails(pack)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pack.name}</CardTitle>
                      <CardDescription className="mt-1.5 line-clamp-2">
                        {pack.description}
                      </CardDescription>
                    </div>
                    <Badge variant={pack.is_active ? 'default' : 'secondary'}>
                      {pack.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-medium">{pack.items_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="font-medium">{formatDate(pack.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(pack)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingPack(pack)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DeliverablePackDialog
        pack={editingPack}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingPack(null)
        }}
      />

      <AlertDialog open={!!deletingPack} onOpenChange={() => setDeletingPack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable Pack</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingPack?.name}</strong>?
              This will not affect existing deals that use this pack, but it will no longer be available for new deals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.info('Delete functionality will be implemented')
                setDeletingPack(null)
              }}
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
