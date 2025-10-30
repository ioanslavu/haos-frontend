import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { formatDistanceToNow, format } from 'date-fns';
import { SERVICE_TYPE_LABELS, PLATFORM_LABELS } from '@/api/types/campaigns';

interface CampaignsTabProps {
  searchQuery: string;
  filterStatus: string;
  filterService: string;
  filterPeriod: string;
}

export function CampaignsTab({ searchQuery, filterStatus, filterService }: CampaignsTabProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const { data: campaigns, isLoading } = useCampaigns({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    service_type: filterService !== 'all' ? filterService : undefined,
  });

  // Extract campaigns from paginated response
  const campaignsList = campaigns?.results || [];

  // Filter campaigns based on search
  const filteredCampaigns = campaignsList.filter(campaign =>
    campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.client.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.artist?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group campaigns by status for kanban view
  const campaignsByStatus = {
    lead: filteredCampaigns?.filter(c => c.status === 'lead') || [],
    negotiation: filteredCampaigns?.filter(c => c.status === 'negotiation') || [],
    confirmed: filteredCampaigns?.filter(c => c.status === 'confirmed') || [],
    active: filteredCampaigns?.filter(c => c.status === 'active') || [],
    completed: filteredCampaigns?.filter(c => c.status === 'completed') || [],
  };

  const statusColumns = [
    { id: 'lead', label: 'Lead', color: 'bg-blue-500' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-yellow-500' },
    { id: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
    { id: 'active', label: 'Active', color: 'bg-purple-500' },
    { id: 'completed', label: 'Completed', color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'table')}>
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>
              Manage and monitor all digital marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Client / Artist</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>KPI Progress</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns?.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <p className="text-xs text-muted-foreground">
                          #{campaign.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{campaign.client.display_name}</p>
                        {campaign.artist && (
                          <p className="text-xs text-muted-foreground">
                            {campaign.artist.display_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {campaign.service_type_display || SERVICE_TYPE_LABELS[campaign.service_type as keyof typeof SERVICE_TYPE_LABELS] || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.platform && (
                        <Badge variant="secondary">
                          {campaign.platform_display || PLATFORM_LABELS[campaign.platform as keyof typeof PLATFORM_LABELS]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {campaign.currency || '€'}{parseFloat(campaign.budget_spent || '0').toLocaleString()} /
                          {campaign.currency || '€'}{parseFloat(campaign.budget_allocated || campaign.value).toLocaleString()}
                        </p>
                        <Progress
                          value={
                            ((parseFloat(campaign.budget_spent || '0') /
                            parseFloat(campaign.budget_allocated || campaign.value || '1')) * 100)
                          }
                          className="w-20 h-1 mt-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={campaign.kpi_completion || 0} className="w-16" />
                        <span className="text-xs">{campaign.kpi_completion || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {campaign.start_date && (
                          <p>{format(new Date(campaign.start_date), 'MMM d')}</p>
                        )}
                        {campaign.end_date && (
                          <p className="text-muted-foreground">
                            to {format(new Date(campaign.end_date), 'MMM d')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        campaign.status === 'active' ? 'default' :
                        campaign.status === 'completed' ? 'secondary' :
                        campaign.status === 'confirmed' ? 'outline' :
                        'outline'
                      }>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Kanban View
        <div className="grid grid-cols-5 gap-4">
          {statusColumns.map((column) => (
            <Card key={column.id} className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <CardTitle className="text-sm">{column.label}</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {campaignsByStatus[column.id as keyof typeof campaignsByStatus].length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="space-y-2">
                  {campaignsByStatus[column.id as keyof typeof campaignsByStatus].map((campaign) => (
                    <Card key={campaign.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium line-clamp-2">
                            {campaign.campaign_name}
                          </h4>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {campaign.service_type_display || 'Service'}
                          </Badge>
                          {campaign.platform && (
                            <Badge variant="secondary" className="text-xs">
                              {campaign.platform_display}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {campaign.client.display_name}
                          </p>
                          {campaign.artist && (
                            <p className="text-xs text-muted-foreground">
                              {campaign.artist.display_name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {campaign.currency || '€'}{parseFloat(campaign.value).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">
                              {campaign.kpi_completion || 0}%
                            </span>
                          </div>
                        </div>

                        {campaign.end_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}