import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useCampaigns, useUpdateCampaign } from '@/api/hooks/useCampaigns';
import { formatDistanceToNow, format } from 'date-fns';
import { SERVICE_TYPE_LABELS, PLATFORM_LABELS } from '@/api/types/campaigns';
import { ServiceMetricsUpdateDialog } from '@/components/digital/ServiceMetricsUpdateDialog';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';

interface CampaignsTabProps {
  searchQuery: string;
  filterStatus: string;
  filterService: string;
  filterPeriod: string;
  startDate?: Date;
  endDate?: Date;
  filterClient?: string;
}

// Droppable Column Component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/50 rounded-lg'
      )}
    >
      {children}
    </div>
  );
}

// Draggable Campaign Card Component
function DraggableCampaignCard({ campaign, children, onClick }: { campaign: any; children: React.ReactNode; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: campaign.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(isDragging && 'opacity-30')}
      onClick={(e) => {
        // Only trigger onClick if not dragging
        if (!isDragging) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

export function CampaignsTab({ searchQuery, filterStatus, filterService, filterPeriod, startDate, endDate, filterClient }: CampaignsTabProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);
  const { data: campaigns, isLoading } = useCampaigns({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    service_type: filterService !== 'all' ? filterService : undefined,
  });
  const updateCampaign = useUpdateCampaign();

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    })
  );

  // Extract campaigns from paginated response
  const campaignsList = campaigns?.results || [];

  // Filter campaigns based on search, date range, and client
  const filteredCampaigns = campaignsList.filter(campaign => {
    // Search filter
    const matchesSearch =
      campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.client.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.artist?.display_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Date range filter
    if (filterPeriod === 'custom' && (startDate || endDate)) {
      const createdAt = new Date(campaign.created_at);
      if (startDate && createdAt < startDate) return false;
      if (endDate && createdAt > endDate) return false;
    } else if (filterPeriod !== 'custom' && filterPeriod !== 'all') {
      const now = new Date();
      const periodDays: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        'year': 365
      };
      const days = periodDays[filterPeriod];
      if (days) {
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const createdAt = new Date(campaign.created_at);
        if (createdAt < cutoffDate) return false;
      }
    }

    // Client filter
    if (filterClient && filterClient !== 'all') {
      if (String(campaign.client.id) !== filterClient) return false;
    }

    return true;
  });

  // Group campaigns by status for kanban view
  const campaignsByStatus = {
    lead: filteredCampaigns?.filter(c => c.status === 'lead') || [],
    negotiation: filteredCampaigns?.filter(c => c.status === 'negotiation') || [],
    confirmed: filteredCampaigns?.filter(c => c.status === 'confirmed') || [],
    active: filteredCampaigns?.filter(c => c.status === 'active') || [],
    completed: filteredCampaigns?.filter(c => c.status === 'completed') || [],
    lost: filteredCampaigns?.filter(c => c.status === 'lost') || [],
  };

  const statusColumns = [
    { id: 'lead', label: 'Lead', color: 'bg-blue-500' },
    { id: 'negotiation', label: 'Negotiation', color: 'bg-yellow-500' },
    { id: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
    { id: 'active', label: 'Active', color: 'bg-purple-500' },
    { id: 'completed', label: 'Completed', color: 'bg-gray-500' },
    { id: 'lost', label: 'Lost', color: 'bg-red-500' },
  ];

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const campaignId = event.active.id as number;
    const campaign = filteredCampaigns?.find((c) => c.id === campaignId);
    if (campaign) {
      setActiveCampaign(campaign);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveCampaign(null);
      return;
    }

    const campaignId = active.id as number;
    const newStatus = over.id as string;

    // Find the campaign
    const campaign = filteredCampaigns?.find((c) => c.id === campaignId);

    if (campaign && campaign.status !== newStatus) {
      // Update campaign status
      try {
        await updateCampaign.mutateAsync({ id: campaignId, data: { status: newStatus } });
      } catch (error) {
        console.error('Failed to update campaign status:', error);
      }
    }

    setActiveCampaign(null);
  };

  const handleDragCancel = () => {
    setActiveCampaign(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1.5 rounded-xl bg-muted/50 backdrop-blur-sm border border-white/10">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(
              "h-9 px-4 rounded-lg transition-all duration-300",
              viewMode === 'table'
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "hover:bg-background/50"
            )}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className={cn(
              "h-9 px-4 rounded-lg transition-all duration-300",
              viewMode === 'kanban'
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "hover:bg-background/50"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
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
                      <div className="flex flex-wrap gap-1">
                        {campaign.service_types && campaign.service_types.length > 0 ? (
                          campaign.service_types.map((serviceType: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {campaign.service_types_display?.[index] || SERVICE_TYPE_LABELS[serviceType as keyof typeof SERVICE_TYPE_LABELS] || serviceType}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.platforms && campaign.platforms.length > 0 ? (
                          campaign.platforms.map((platform: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {campaign.platforms_display?.[index] || PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </div>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/digital/campaigns/${campaign.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/digital/campaigns/${campaign.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Campaign
                            </DropdownMenuItem>
                            <ServiceMetricsUpdateDialog
                              campaign={campaign}
                              variant="ghost"
                              asMenuItem
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
        <div className="grid grid-cols-6 gap-4">
          {statusColumns.map((column) => (
            <DroppableColumn key={column.id} id={column.id}>
            <Card className="h-[600px] flex flex-col">
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
                    <DraggableCampaignCard key={campaign.id} campaign={campaign} onClick={() => navigate(`/digital/campaigns/${campaign.id}`)}>
                    <Card
                      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium line-clamp-2">
                            {campaign.campaign_name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <ServiceMetricsUpdateDialog
                              campaign={campaign}
                              variant="ghost"
                              size="icon"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </ServiceMetricsUpdateDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {campaign.service_types && campaign.service_types.length > 0 && (
                            campaign.service_types.map((st: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {campaign.service_types_display?.[idx] || st}
                              </Badge>
                            ))
                          )}
                          {campaign.platforms && campaign.platforms.length > 0 && (
                            campaign.platforms.map((p: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {campaign.platforms_display?.[idx] || p}
                              </Badge>
                            ))
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
                    </DraggableCampaignCard>
                  ))}
                </div>
              </CardContent>
            </Card>
            </DroppableColumn>
          ))}
        </div>

        {/* Drag Overlay - shows the campaign being dragged */}
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeCampaign ? (
            <Card className="p-3 cursor-grabbing shadow-2xl rotate-2 w-[280px]">
              <div className="space-y-2">
                <h4 className="text-sm font-medium line-clamp-2">
                  {activeCampaign.campaign_name}
                </h4>
                <div className="flex items-center gap-2">
                  {activeCampaign.service_types && activeCampaign.service_types.length > 0 && (
                    activeCampaign.service_types.map((st: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {activeCampaign.service_types_display?.[idx] || st}
                      </Badge>
                    ))
                  )}
                  {activeCampaign.platforms && activeCampaign.platforms.length > 0 && (
                    activeCampaign.platforms.map((p: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {activeCampaign.platforms_display?.[idx] || p}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}