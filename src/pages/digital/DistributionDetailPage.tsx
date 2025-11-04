import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { distributionsService } from '@/api/services/distributions.service'
import { DistributionCatalogItem } from '@/types/distribution'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useToast } from '@/hooks/use-toast'
import { AddCatalogItemDialog } from './components/AddCatalogItemDialog'
import { AddRevenueReportDialog } from './components/AddRevenueReportDialog'

const dealStatusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_negotiation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

const distributionStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  live: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  taken_down: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function DistributionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [addCatalogDialogOpen, setAddCatalogDialogOpen] = useState(false)
  const [addRevenueDialogOpen, setAddRevenueDialogOpen] = useState(false)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<number | null>(null)

  const { data: distribution, isLoading } = useQuery({
    queryKey: ['distribution', id],
    queryFn: () => distributionsService.getDistribution(Number(id)),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => distributionsService.deleteDistribution(Number(id)),
    onSuccess: () => {
      toast({ title: 'Distribution deleted successfully' })
      navigate('/digital/distributions')
    },
    onError: () => {
      toast({ title: 'Failed to delete distribution', variant: 'destructive' })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => distributionsService.removeCatalogItem(Number(id), itemId),
    onSuccess: () => {
      toast({ title: 'Catalog item removed successfully' })
      queryClient.invalidateQueries({ queryKey: ['distribution', id] })
      setItemToDelete(null)
    },
    onError: () => {
      toast({ title: 'Failed to remove catalog item', variant: 'destructive' })
    },
  })

  const toggleExpanded = (itemId: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleAddRevenue = (catalogItemId: number) => {
    setSelectedCatalogItem(catalogItemId)
    setAddRevenueDialogOpen(true)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!distribution) {
    return <div>Distribution not found</div>
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/digital/distributions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{distribution.entity.display_name}</h1>
            <p className="text-muted-foreground">{distribution.deal_type_display} Distribution Deal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/digital/distributions/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge className={dealStatusColors[distribution.deal_status]}>
                  {distribution.deal_status_display}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Deal Type</label>
              <div className="mt-1 font-medium">{distribution.deal_type_display}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Global Revenue Share</label>
              <div className="mt-1 text-2xl font-bold">{distribution.global_revenue_share_percentage}%</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Signing Date</label>
              <div className="mt-1 font-medium">
                {new Date(distribution.signing_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Tracks</label>
              <div className="mt-1 text-2xl font-bold">{distribution.track_count}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Revenue</label>
              <div className="mt-1 text-2xl font-bold text-green-600">
                €{parseFloat(distribution.total_revenue).toLocaleString()}
              </div>
            </div>
            {distribution.contact_person && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                <div className="mt-1 font-medium">{distribution.contact_person.name}</div>
                <div className="text-sm text-muted-foreground">{distribution.contact_person.email}</div>
              </div>
            )}
            {distribution.contract && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contract</label>
                <div className="mt-1 font-medium">{distribution.contract.contract_number}</div>
                <div className="text-sm text-muted-foreground">{distribution.contract.title}</div>
              </div>
            )}
          </div>

          {distribution.special_terms && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Special Terms</label>
              <div className="mt-1 text-sm whitespace-pre-wrap">{distribution.special_terms}</div>
            </div>
          )}

          {distribution.notes && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <div className="mt-1 text-sm whitespace-pre-wrap">{distribution.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catalog Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Distributed Catalog</CardTitle>
          <Button onClick={() => setAddCatalogDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Track/Release
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Revenue Share</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Release Date</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribution.catalog_items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No catalog items added yet
                  </TableCell>
                </TableRow>
              ) : (
                distribution.catalog_items?.map((item) => (
                  <>
                    <TableRow key={item.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          {expandedItems.has(item.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{item.catalog_item_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.catalog_item_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.platforms_display.slice(0, 3).map((platform, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                          {item.platforms_display.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.platforms_display.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.individual_revenue_share ? (
                          <span className="font-medium">{item.individual_revenue_share}%</span>
                        ) : (
                          <span className="text-muted-foreground">Global: {item.effective_revenue_share}%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={distributionStatusColors[item.distribution_status]}>
                          {item.distribution_status_display}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.release_date ? new Date(item.release_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        €{parseFloat(item.total_revenue).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddRevenue(item.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setItemToDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Revenue Reports Expanded Row */}
                    {expandedItems.has(item.id) && item.revenue_reports && item.revenue_reports.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/50 p-4">
                          <div className="text-sm font-medium mb-2">Revenue Reports</div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Platform</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Streams</TableHead>
                                <TableHead>Downloads</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {item.revenue_reports.map((report) => (
                                <TableRow key={report.id}>
                                  <TableCell>{report.platform_display}</TableCell>
                                  <TableCell>
                                    {new Date(report.reporting_period).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                    })}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {report.currency} {parseFloat(report.revenue_amount).toLocaleString()}
                                  </TableCell>
                                  <TableCell>{report.streams?.toLocaleString() || '-'}</TableCell>
                                  <TableCell>{report.downloads?.toLocaleString() || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddCatalogItemDialog
        open={addCatalogDialogOpen}
        onOpenChange={setAddCatalogDialogOpen}
        distributionId={Number(id)}
      />

      {selectedCatalogItem && (
        <AddRevenueReportDialog
          open={addRevenueDialogOpen}
          onOpenChange={setAddRevenueDialogOpen}
          distributionId={Number(id)}
          catalogItemId={selectedCatalogItem}
        />
      )}

      {/* Delete Distribution Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Distribution</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this distribution? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Catalog Item Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Catalog Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from the distribution?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppLayout>
  )
}
