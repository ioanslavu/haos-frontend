import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react'
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
  useProposalArtists,
  useDeleteProposalArtist,
} from '@/api/hooks/useArtistSales'
import { ProposalArtist } from '@/types/artist-sales'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ProposalArtistDialog } from './ProposalArtistDialog'

interface ProposalArtistsSectionProps {
  proposalId: number
  currency: string
}

const ROLE_LABELS: Record<string, string> = {
  main: 'Main',
  featured: 'Featured',
  guest: 'Guest',
  ensemble: 'Ensemble',
}

export function ProposalArtistsSection({ proposalId, currency }: ProposalArtistsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArtist, setEditingArtist] = useState<ProposalArtist | null>(null)
  const [deletingArtist, setDeletingArtist] = useState<ProposalArtist | null>(null)

  const { data: artists, isLoading } = useProposalArtists(proposalId)
  const artistsList = Array.isArray(artists) ? artists : []
  const deleteMutation = useDeleteProposalArtist()

  const handleEdit = (artist: ProposalArtist) => {
    setEditingArtist(artist)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingArtist(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingArtist) return

    try {
      await deleteMutation.mutateAsync(deletingArtist.id)
      toast.success('Artist removed from proposal')
      setDeletingArtist(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to remove artist')
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
          <CardTitle>Proposal Artists</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Artist
          </Button>
        </CardHeader>
        <CardContent>
          {artistsList.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No artists added to this proposal yet</p>
              <Button onClick={handleAdd} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add First Artist
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artist</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Proposed Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artistsList.map((artist) => (
                    <TableRow key={artist.id}>
                      <TableCell className="font-medium">
                        {artist.artist.display_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_LABELS[artist.role] || artist.role_display || artist.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {artist.proposed_fee
                          ? formatCurrency(Number(artist.proposed_fee), currency)
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(artist)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingArtist(artist)}
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

      <ProposalArtistDialog
        proposalId={proposalId}
        currency={currency}
        artist={editingArtist}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingArtist(null)
        }}
      />

      <AlertDialog open={!!deletingArtist} onOpenChange={() => setDeletingArtist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Artist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingArtist?.artist.display_name}</strong> from this proposal?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
