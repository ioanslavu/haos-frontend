import { useBrandAnalyticsDetail } from '@/api/hooks/useCampaigns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Users, DollarSign, Package } from 'lucide-react'
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

interface BrandAnalyticsProps {
  brandId: number
  onCampaignEdit?: (campaign: any) => void
  onCampaignDelete?: (campaign: any) => void
  onCampaignClick?: (campaign: any) => void
}

export function BrandAnalytics({ brandId, onCampaignEdit, onCampaignDelete, onCampaignClick }: BrandAnalyticsProps) {
  const { data: analytics, isLoading, error } = useBrandAnalyticsDetail(brandId)

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
        Failed to load brand analytics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Brand Header */}
      <div>
        <h2 className="text-3xl font-bold">{analytics.brand_name}</h2>
        <p className="text-muted-foreground">Brand Campaign Analytics</p>
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
            <CardTitle className="text-sm font-medium">Unique Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unique_artists}</div>
          </CardContent>
        </Card>

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
      </div>

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

      {/* Artist Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Artists by Campaign Count</CardTitle>
          <CardDescription>Artists who have worked on campaigns for this brand</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist</TableHead>
                <TableHead className="text-right">Campaigns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.artists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No artists found
                  </TableCell>
                </TableRow>
              ) : (
                analytics.artists.map((artist) => (
                  <TableRow key={artist.id}>
                    <TableCell className="font-medium">{artist.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{artist.campaign_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Campaigns */}
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
