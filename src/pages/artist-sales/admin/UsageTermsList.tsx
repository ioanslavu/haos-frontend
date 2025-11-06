import { useState } from 'react'
import { Plus, Edit, Trash2, FileText, Loader2 } from 'lucide-react'
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
import { useUsageTerms } from '@/api/hooks/useArtistSales'
import { UsageTerms } from '@/types/artist-sales'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { UsageTermsDialog } from './components/UsageTermsDialog'

export default function UsageTermsList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTerms, setEditingTerms] = useState<UsageTerms | null>(null)
  const [deletingTerms, setDeletingTerms] = useState<UsageTerms | null>(null)

  const { data: termsData, isLoading } = useUsageTerms()
  const terms = termsData?.results || []

  const handleEdit = (terms: UsageTerms) => {
    setEditingTerms(terms)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingTerms(null)
    setIsDialogOpen(true)
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
            <h1 className="text-3xl font-bold tracking-tight">Usage Terms Templates</h1>
            <p className="text-muted-foreground mt-2">
              Manage reusable usage rights and licensing templates for deals
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        {terms.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No usage terms templates yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first usage rights template for faster deal creation
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {terms.map((term) => (
              <Card key={term.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{term.name}</CardTitle>
                        {term.is_template && (
                          <Badge variant="default">Template</Badge>
                        )}
                        {term.buyout && (
                          <Badge variant="secondary">Buyout</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {term.usage_scope?.join(', ') || 'No scope specified'} • {term.territories?.join(', ') || 'No territories specified'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(term)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeletingTerms(term)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Duration</p>
                      <p className="font-medium">{term.usage_duration_days} days</p>
                    </div>
                    {term.exclusivity_category && (
                      <div>
                        <p className="text-muted-foreground mb-1">Exclusivity</p>
                        <p className="font-medium">{term.exclusivity_category}</p>
                      </div>
                    )}
                    {term.exclusivity_duration_days && (
                      <div>
                        <p className="text-muted-foreground mb-1">Exclusivity Duration</p>
                        <p className="font-medium">{term.exclusivity_duration_days} days</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground mb-1">Extensions</p>
                      <p className="font-medium">{term.extensions_allowed ? 'Allowed' : 'Not Allowed'}</p>
                    </div>
                  </div>
                  {term.brand_list_blocked && term.brand_list_blocked.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Blocked Brands:</p>
                      <div className="flex flex-wrap gap-2">
                        {term.brand_list_blocked.map((brand, idx) => (
                          <Badge key={idx} variant="outline">{brand}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {term.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{term.notes}</p>
                    </div>
                  )}
                  <div className="mt-4 text-xs text-muted-foreground">
                    Updated {formatDate(term.updated_at)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <UsageTermsDialog
        terms={editingTerms}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingTerms(null)
        }}
      />

      <AlertDialog open={!!deletingTerms} onOpenChange={() => setDeletingTerms(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Usage Terms Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingTerms?.name}</strong>?
              This will not affect existing deals that use these terms, but it will no longer be available for new deals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.info('Delete functionality will be implemented')
                setDeletingTerms(null)
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
