import { useState, useEffect } from 'react';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { useAuthStore } from '@/stores/authStore';
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
  const currentUser = useAuthStore((state) => state.user);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Build filter params for backend
  const filterParams: any = {
    status: filterStatus !== 'all' ? filterStatus : undefined,
    service_type: filterService !== 'all' ? filterService : undefined,
    search: searchQuery || undefined,
    page: currentPage,
    page_size: itemsPerPage,
  };

  // Add client filter
  if (filterClient && filterClient !== 'all') {
    filterParams.client = Number(filterClient);
  }

  // Add date range filters
  if (filterPeriod === 'custom') {
    if (startDate) {
      filterParams.created_after = startDate.toISOString();
    }
    if (endDate) {
      filterParams.created_before = endDate.toISOString();
    }
  } else if (filterPeriod !== 'all' && filterPeriod !== '30d') {
    // For predefined periods, calculate the date range
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
      filterParams.created_after = cutoffDate.toISOString();
    }
  }

  const { data: campaigns, isLoading } = useCampaigns(filterParams);
  const updateCampaign = useUpdateCampaign();

  // Extract campaigns from paginated response
  const campaignsList = campaigns?.results || [];
  const totalCount = campaigns?.count || 0;

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterService, filterPeriod, startDate, endDate, filterClient]);

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    })
  );

  // Campaigns are already filtered by the backend
  // No need for frontend filtering anymore
  const filteredCampaigns = campaignsList;

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
                          {currentUser?.role === 'digital_employee'
                            ? `${campaign.currency || '€'}${parseFloat(campaign.budget_allocated || '0').toLocaleString()}`
                            : `${campaign.currency || '€'}${parseFloat(campaign.budget_allocated || campaign.value).toLocaleString()}`
                          }
                        </p>
                        <Progress
                          value={
                            ((parseFloat(campaign.budget_spent || '0') /
                            parseFloat(
                              currentUser?.role === 'digital_employee'
                                ? campaign.budget_allocated || '1'
                                : campaign.budget_allocated || campaign.value || '1'
                            )) * 100)
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
        <div className="grid grid-cols-6 gap-8">
          {statusColumns.map((column) => (
            <DroppableColumn key={column.id} id={column.id}>
            <div className="h-[700px] flex flex-col">
              {/* Column Header */}
              <div className="pb-5 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="text-base font-semibold">{column.label}</h3>
                  </div>
                  <Badge variant="secondary" className="text-sm px-2.5 py-1 font-medium">
                    {campaignsByStatus[column.id as keyof typeof campaignsByStatus].length}
                  </Badge>
                </div>
              </div>
              {/* Scrollable Cards Container */}
              <div className="flex-1 overflow-auto">
                <div className="space-y-4 pr-2">
                  {campaignsByStatus[column.id as keyof typeof campaignsByStatus].map((campaign) => (
                    <DraggableCampaignCard key={campaign.id} campaign={campaign} onClick={() => navigate(`/digital/campaigns/${campaign.id}`)}>
                    <Card
                      className="p-5 cursor-grab active:cursor-grabbing hover:shadow-xl hover:border-primary/50 transition-all duration-200 bg-card"
                    >
                      <div className="space-y-4">
                        {/* Title and Actions */}
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold line-clamp-2 leading-snug flex-1 min-w-0">
                            {campaign.campaign_name}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <ServiceMetricsUpdateDialog
                              campaign={campaign}
                              variant="ghost"
                              size="icon"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </ServiceMetricsUpdateDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Service Types - Show only first one + count */}
                        {campaign.service_types && campaign.service_types.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-medium px-2.5 py-1">
                              {campaign.service_types_display?.[0] || campaign.service_types[0]}
                            </Badge>
                            {campaign.service_types.length > 1 && (
                              <Badge variant="secondary" className="text-xs px-2 py-1">
                                +{campaign.service_types.length - 1}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Client & Artist */}
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {campaign.client.display_name}
                          </p>
                          {campaign.artist && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <span>🎵</span>
                              <span>{campaign.artist.display_name}</span>
                            </p>
                          )}
                        </div>

                        {/* Metrics Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          {/* Campaign Value - Hidden for digital_employee */}
                          {currentUser?.role !== 'digital_employee' && campaign.value && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-foreground">
                                {campaign.currency || '€'}{parseFloat(campaign.value).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className={cn(
                            "flex items-center gap-2",
                            currentUser?.role === 'digital_employee' || !campaign.value ? "ml-0" : "ml-auto"
                          )}>
                            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-sm font-medium">
                              {campaign.kpi_completion || 0}%
                            </span>
                          </div>
                        </div>

                        {/* Due Date */}
                        {campaign.end_date && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                            <Clock className="h-4 w-4 flex-shrink-0" />
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
              </div>
            </div>
            </DroppableColumn>
          ))}
        </div>

        {/* Drag Overlay - shows the campaign being dragged */}
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeCampaign ? (
            <Card className="p-5 cursor-grabbing shadow-2xl rotate-2 w-[300px] bg-card border-2 border-primary/50">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold line-clamp-2 leading-snug">
                  {activeCampaign.campaign_name}
                </h4>
                {activeCampaign.service_types && activeCampaign.service_types.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium px-2.5 py-1">
                      {activeCampaign.service_types_display?.[0] || activeCampaign.service_types[0]}
                    </Badge>
                    {activeCampaign.service_types.length > 1 && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        +{activeCampaign.service_types.length - 1}
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground truncate">
                  {activeCampaign.client.display_name}
                </p>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
        </DndContext>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} campaigns
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}