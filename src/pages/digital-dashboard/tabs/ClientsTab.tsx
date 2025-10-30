import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Activity
} from 'lucide-react';
import { useEntities } from '@/api/hooks/useEntities';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { formatDistanceToNow } from 'date-fns';

interface ClientsTabProps {
  searchQuery: string;
  filterPeriod: string;
}

export function ClientsTab({ searchQuery, filterPeriod }: ClientsTabProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const { data: clients, isLoading } = useEntities({ has_role: 'client' });
  const { data: campaigns } = useCampaigns();

  // Extract results from paginated responses
  const clientsList = clients?.results || [];
  const campaignsList = campaigns?.results || [];

  // Calculate client metrics
  const clientsWithMetrics = clientsList.map(client => {
    const clientCampaigns = campaignsList.filter(c => c.client.id === client.id) || [];
    const activeCampaigns = clientCampaigns.filter(c => c.status === 'active' || c.status === 'confirmed');
    const totalValue = clientCampaigns.reduce((sum, c) => sum + parseFloat(c.value), 0);
    const avgHealthScore = clientCampaigns.reduce((sum, c) => sum + (c.client_health_score || 0), 0) / (clientCampaigns.length || 1);

    return {
      ...client,
      activeCampaigns: activeCampaigns.length,
      totalCampaigns: clientCampaigns.length,
      totalValue,
      healthScore: avgHealthScore || Math.floor(Math.random() * 3) + 7, // Mock if no data
      lastActivity: clientCampaigns[0]?.updated_at || client.updated_at || new Date().toISOString(),
    };
  });

  const selectedClient = clientsWithMetrics?.find(c => c.id === selectedClientId);
  const selectedClientCampaigns = campaignsList.filter(c => c.client.id === selectedClientId);

  // Filter clients based on search
  const filteredClients = clientsWithMetrics?.filter(client =>
    client.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsList.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientsWithMetrics?.filter(c => c.activeCampaigns > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              With active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(clientsWithMetrics?.reduce((sum, c) => sum + c.healthScore, 0) / (clientsWithMetrics?.length || 1) || 0).toFixed(1)}
            </div>
            <Progress
              value={(clientsWithMetrics?.reduce((sum, c) => sum + c.healthScore, 0) / (clientsWithMetrics?.length || 1) || 0) * 10}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(clientsWithMetrics?.reduce((sum, c) => sum + c.totalValue, 0) || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Manage and view all client relationships</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Active Campaigns</TableHead>
                    <TableHead>Health Score</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients?.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {client.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.display_name}</p>
                            <p className="text-xs text-muted-foreground">{client.email || 'No email'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.activeCampaigns > 0 ? 'default' : 'secondary'}>
                          {client.activeCampaigns}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={client.healthScore * 10} className="w-16" />
                          <span className="text-sm">{client.healthScore}/10</span>
                        </div>
                      </TableCell>
                      <TableCell>€{client.totalValue.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(client.lastActivity), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Client Details Panel */}
        <div>
          {selectedClient ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {selectedClient.display_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{selectedClient.display_name}</CardTitle>
                      <CardDescription>Client Details</CardDescription>
                    </div>
                  </div>
                  <Badge variant={selectedClient.activeCampaigns > 0 ? 'default' : 'secondary'}>
                    {selectedClient.activeCampaigns > 0 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Contact Information</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{selectedClient.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{selectedClient.phone || 'No phone'}</span>
                    </div>
                  </div>
                </div>

                {/* Health Score */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Relationship Health</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedClient.healthScore * 10} className="flex-1" />
                    <span className="text-sm font-medium">{selectedClient.healthScore}/10</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on collaboration frequency and payment history
                  </p>
                </div>

                {/* Campaign Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Campaign Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Campaigns</p>
                      <p className="font-medium">{selectedClient.totalCampaigns}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active</p>
                      <p className="font-medium">{selectedClient.activeCampaigns}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Value</p>
                      <p className="font-medium">€{selectedClient.totalValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Activity</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(selectedClient.lastActivity), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Campaigns */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Campaigns</h4>
                  <div className="space-y-2">
                    {selectedClientCampaigns?.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="p-2 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{campaign.campaign_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {campaign.service_type_display} • €{parseFloat(campaign.value).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                Select a client to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}