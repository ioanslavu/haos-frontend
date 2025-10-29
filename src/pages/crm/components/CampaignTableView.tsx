import { useState } from 'react'
import { Campaign, CAMPAIGN_STATUS_COLORS, CAMPAIGN_STATUS_LABELS } from '@/types/campaign'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'

interface CampaignTableViewProps {
  campaigns: Campaign[]
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
  onClick?: (campaign: Campaign) => void
}

type SortField = 'campaign_name' | 'value' | 'status' | 'created_at' | 'confirmed_at'
type SortOrder = 'asc' | 'desc'

export function CampaignTableView({
  campaigns,
  onEdit,
  onDelete,
  onClick,
}: CampaignTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === 'value') {
      aValue = parseFloat(a.value)
      bValue = parseFloat(b.value)
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 -ml-3"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="campaign_name">Campaign</SortButton>
            </TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>
              <SortButton field="value">Value</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="confirmed_at">Confirmed</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="created_at">Created</SortButton>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCampaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No campaigns found
              </TableCell>
            </TableRow>
          ) : (
            sortedCampaigns.map((campaign) => (
              <TableRow
                key={campaign.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onClick?.(campaign)}
              >
                <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                <TableCell>{campaign.client.display_name}</TableCell>
                <TableCell>{campaign.artist.display_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{campaign.brand.display_name}</Badge>
                </TableCell>
                <TableCell className="font-mono">
                  ${parseFloat(campaign.value).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                    {CAMPAIGN_STATUS_LABELS[campaign.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {campaign.confirmed_at
                    ? format(new Date(campaign.confirmed_at), 'MMM d, yyyy')
                    : '-'}
                </TableCell>
                <TableCell>{format(new Date(campaign.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(campaign)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(campaign)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
