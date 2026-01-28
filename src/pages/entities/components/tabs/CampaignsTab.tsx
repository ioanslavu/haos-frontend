import { Loader2, Package, DollarSign, Users, Building2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS } from '@/types/campaign';

interface CampaignsTabProps {
  isArtist: boolean;
  artistAnalytics: any;
}

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function CampaignsTab({ isArtist, artistAnalytics }: CampaignsTabProps) {
  if (!isArtist) {
    return null;
  }

  return (
    <TabsContent value="campaigns" className="space-y-6">
      {artistAnalytics ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{artistAnalytics.total_campaigns}</div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${parseFloat(artistAnalytics.total_value).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{artistAnalytics.unique_clients}</div>
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Brands</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{artistAnalytics.unique_brands}</div>
              </CardContent>
            </Card>
          </div>

          {/* Avg Campaign Value */}
          <Card className={cardClass}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Campaign Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {artistAnalytics.total_campaigns > 0
                  ? (parseFloat(artistAnalytics.total_value) / artistAnalytics.total_campaigns).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )
                  : 0}
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Campaign Status Breakdown</CardTitle>
              <CardDescription>Distribution of campaigns across different statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(artistAnalytics.campaigns_by_status).map(([status, count]) => (
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

          {/* Top Brands */}
          <Card className={cardClass}>
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
                  {artistAnalytics.brands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No brands found
                      </TableCell>
                    </TableRow>
                  ) : (
                    artistAnalytics.brands.map((brand: any) => (
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

          {/* Top Clients */}
          <Card className={cardClass}>
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
                  {artistAnalytics.clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    artistAnalytics.clients.map((client: any) => (
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
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </TabsContent>
  );
}
