import { useArtistAnalyticsDetail } from '@/api/hooks/useCampaigns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Users, DollarSign, Package, Building2 } from 'lucide-react'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS } from '@/types/campaign'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CampaignCard } from './CampaignCard'

interface ArtistAnalyticsProps {
  artistId: number
  onCampaignEdit?: (campaign: any) => void
  onCampaignDelete?: (campaign: any) => void
  onCampaignClick?: (campaign: any) => void
}

export function ArtistAnalytics({ artistId, onCampaignEdit, onCampaignDelete, onCampaignClick }: ArtistAnalyticsProps) {
  const { data: analytics, isLoading, error } = useArtistAnalyticsDetail(artistId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load artist analytics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Artist Header */}
      <div>
        <h2 className="text-3xl font-bold">{analytics.artist_name}</h2>
        <p className="text-muted-foreground">Artist Campaign Analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_campaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(analytics.total_value).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unique_clients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unique_brands}</div>
          </CardContent>
        </Card>
      </div>

      {/* Avg Campaign Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Campaign Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${analytics.total_campaigns > 0
              ? (parseFloat(analytics.total_value) / analytics.total_campaigns).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                )
              : 0}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Status Breakdown</CardTitle>
          <CardDescription>Distribution of campaigns across different statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.campaigns_by_status).map(([status, count]) => (
              <Badge
                key={status}
                className={`${CAMPAIGN_STATUS_COLORS[status as keyof typeof CAMPAIGN_STATUS_COLORS]} px-4 py-2 text-sm`}
              >
                {CAMPAIGN_STATUS_LABELS[status as keyof typeof CAMPAIGN_STATUS_LABELS]}: {count as number}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Brand Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brands by Campaign Count</CardTitle>
          <CardDescription>Brands this artist has worked with</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Campaigns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No brands found
                  </TableCell>
                </TableRow>
              ) : (
                analytics.brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{brand.campaign_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients by Campaign Count</CardTitle>
          <CardDescription>Clients this artist has worked with</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Campaigns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                analytics.clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{client.campaign_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All Campaigns */}
      {analytics.campaigns && analytics.campaigns.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">All Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={onCampaignEdit}
                onDelete={onCampaignDelete}
                onClick={onCampaignClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
