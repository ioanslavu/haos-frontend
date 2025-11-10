/**
 * Opportunities Kanban Board
 * Modern 2025 design with collapsible columns and table view
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, Loader2, Table as TableIcon, LayoutDashboard, ChevronLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOpportunities, useAdvanceStage } from '@/api/hooks/useOpportunities';
import { formatMoney, formatDate } from '@/lib/utils';
import type { Opportunity, OpportunityStage } from '@/types/opportunities';
import { STAGE_CONFIG } from '@/types/opportunities';
import { QuickCreateModal } from './components/QuickCreateModal';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

const STAGES: OpportunityStage[] = [
  'brief',
  'qualified',
  'shortlist',
  'proposal_draft',
  'proposal_sent',
  'negotiation',
  'contract_prep',
  'contract_sent',
  'won',
  'executing',
  'completed',
];

// Grouped stages for pipeline view
const STAGE_GROUPS = {
  discovery: {
    label: 'Discovery',
    emoji: '🔍',
    stages: ['brief', 'qualified'] as OpportunityStage[],
  },
  planning: {
    label: 'Planning',
    emoji: '📋',
    stages: ['shortlist', 'proposal_draft', 'proposal_sent'] as OpportunityStage[],
  },
  negotiation: {
    label: 'Negotiation',
    emoji: '🤝',
    stages: ['negotiation', 'contract_prep', 'contract_sent'] as OpportunityStage[],
  },
  delivery: {
    label: 'Delivery',
    emoji: '🚀',
    stages: ['won', 'executing'] as OpportunityStage[],
  },
  complete: {
    label: 'Complete',
    emoji: '✅',
    stages: ['completed'] as OpportunityStage[],
  },
};

// Hybrid view: Important stages as columns, less important as rows
const COLUMN_STAGES: OpportunityStage[] = ['proposal_sent', 'negotiation', 'contract_sent', 'won', 'executing'];
const ROW_STAGES: OpportunityStage[] = ['brief', 'qualified', 'shortlist', 'proposal_draft', 'contract_prep', 'completed'];

// Draggable card wrapper component
function DraggableCard({ opportunity, children, onClick }: { opportunity: Opportunity; children: React.ReactNode; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    data: { opportunity },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// Droppable column wrapper component
function DroppableColumn({ stage, children }: { stage: OpportunityStage; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[200px] transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2' : ''}`}
    >
      {children}
    </div>
  );
}

export default function OpportunitiesKanban() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Set<OpportunityStage>>(new Set());
  const [viewMode, setViewMode] = useState<'kanban' | 'grouped' | 'hybrid' | 'table'>('hybrid');

  const { data, isLoading } = useOpportunities({ page_size: 200 });
  const advanceStageMutation = useAdvanceStage();

  const opportunities = data?.results || [];

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group opportunities by stage
  const opportunitiesByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = opportunities.filter(opp => opp.stage === stage);
    return acc;
  }, {} as Record<OpportunityStage, Opportunity[]>);

  const handleCardClick = (id: number) => {
    navigate(`/opportunities/${id}`);
  };

  const handleStageChange = async (opportunityId: number, newStage: OpportunityStage) => {
    await advanceStageMutation.mutateAsync({ id: opportunityId, data: { stage: newStage } });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunity = opportunities.find(opp => opp.id === active.id);
    setActiveOpportunity(opportunity || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);

    if (!over) return;

    const opportunityId = active.id as number;
    const newStage = over.id as OpportunityStage;
    const opportunity = opportunities.find(opp => opp.id === opportunityId);

    if (opportunity && opportunity.stage !== newStage) {
      await handleStageChange(opportunityId, newStage);
    }
  };

  const toggleColumn = (stage: OpportunityStage) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) {
        newSet.delete(stage);
      } else {
        newSet.add(stage);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="container max-w-full py-6 space-y-6">
        {/* Modern Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-white/10 p-8 shadow-xl mb-6">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-orange-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Opportunities Pipeline
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                {opportunities.length} opportunities
              </p>
            </div>
          <div className="flex gap-2">
            {/* Modern View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'grouped' | 'hybrid' | 'table')} className="mr-2">
              <TabsList className="p-1 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10 h-10">
                <TabsTrigger
                  value="hybrid"
                  className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Hybrid
                </TabsTrigger>
                <TabsTrigger
                  value="grouped"
                  className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Pipeline
                </TabsTrigger>
                <TabsTrigger
                  value="kanban"
                  className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  All Stages
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <TableIcon className="h-4 w-4" />
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/10">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/10">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <QuickCreateModal />
            <Button
              onClick={() => navigate('/opportunities/new')}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Opportunity
            </Button>
          </div>
          </div>
        </div>

        {viewMode === 'hybrid' ? (
          /* Hybrid View - Rows + Columns */
          <div className="space-y-6">
            {/* Row Stages - Horizontal compact view */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Early & Admin Stages</h3>
              {ROW_STAGES.map(stage => {
                const stageConfig = STAGE_CONFIG[stage];
                const stageOpportunities = opportunitiesByStage[stage] || [];

                if (stageOpportunities.length === 0) return null;

                return (
                  <Card key={stage} className="p-3 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
                    <div className="flex items-start gap-4">
                      {/* Stage Header */}
                      <div className="flex-shrink-0 w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{stageConfig.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{stageConfig.label}</h4>
                            <p className="text-xs text-muted-foreground">{stageOpportunities.length} items</p>
                          </div>
                        </div>
                      </div>

                      {/* Opportunities in horizontal scroll */}
                      <div className="flex-1 overflow-x-auto">
                        <div className="flex gap-2">
                          {stageOpportunities.map(opp => (
                            <Card
                              key={opp.id}
                              className="flex-shrink-0 w-[240px] p-2 cursor-pointer hover:shadow-lg transition-all rounded-xl border-white/10 bg-background/50 backdrop-blur-sm"
                              onClick={() => handleCardClick(opp.id)}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h5 className="font-medium text-xs line-clamp-1 flex-1">{opp.title}</h5>
                                {(opp.priority === 'high' || opp.priority === 'urgent') && (
                                  <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                                    {opp.priority_display}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{opp.account.display_name}</p>
                              {opp.estimated_value && (
                                <p className="text-xs font-semibold text-green-600 mt-1">
                                  {formatMoney(parseFloat(opp.estimated_value), opp.currency)}
                                </p>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Column Stages - Vertical kanban columns */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Active Deals</h3>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {COLUMN_STAGES.map(stage => {
                  const stageConfig = STAGE_CONFIG[stage];
                  const stageOpportunities = opportunitiesByStage[stage] || [];

                  return (
                    <div key={stage} className="flex-shrink-0 w-[280px]">
                      {/* Column Header */}
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xl">{stageConfig.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-sm">{stageConfig.label}</h3>
                          <p className="text-xs text-muted-foreground">{stageOpportunities.length}</p>
                        </div>
                      </div>

                      {/* Cards */}
                      <DroppableColumn stage={stage}>
                        {stageOpportunities.map(opp => (
                          <DraggableCard
                            key={opp.id}
                            opportunity={opp}
                            onClick={() => handleCardClick(opp.id)}
                          >
                            <Card
                              className="p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all text-xs rounded-xl border-white/10 bg-background/50 backdrop-blur-sm"
                              onClick={() => handleCardClick(opp.id)}
                            >
                              {/* Title & Priority */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-sm line-clamp-2 flex-1">{opp.title}</h4>
                                {opp.priority === 'high' || opp.priority === 'urgent' ? (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                    {opp.priority_display}
                                  </Badge>
                                ) : null}
                              </div>

                              {/* Account */}
                              <div className="text-xs text-muted-foreground mb-2 truncate">
                                {opp.account.display_name}
                              </div>

                              {/* Value */}
                              {opp.estimated_value && (
                                <div className="text-sm font-semibold text-green-600 mb-2">
                                  {formatMoney(parseFloat(opp.estimated_value), opp.currency)}
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                <span className="text-[10px]">{opp.owner.full_name}</span>
                                {opp.expected_close_date && (
                                  <span className="text-[10px]">{formatDate(opp.expected_close_date)}</span>
                                )}
                              </div>
                            </Card>
                          </DraggableCard>
                        ))}
                      </DroppableColumn>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : viewMode === 'grouped' ? (
          /* Grouped Pipeline View */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(STAGE_GROUPS).map(([groupKey, group]) => {
              const groupOpportunities = opportunities.filter(opp =>
                group.stages.includes(opp.stage)
              );

              return (
                <div key={groupKey} className="flex-shrink-0 w-[320px]">
                  {/* Group Header */}
                  <div className="mb-3 bg-muted/50 backdrop-blur-xl rounded-xl border border-white/10 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{group.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-base">{group.label}</h3>
                        <p className="text-xs text-muted-foreground">
                          {groupOpportunities.length} opportunities
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Group Cards */}
                  <div className="space-y-2">
                    {groupOpportunities.map(opp => (
                      <Card
                        key={opp.id}
                        className="p-3 cursor-pointer hover:shadow-lg transition-all text-xs rounded-xl border-white/10 bg-background/50 backdrop-blur-sm"
                        onClick={() => handleCardClick(opp.id)}
                      >
                        {/* Stage Badge */}
                        <div className="mb-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                            {STAGE_CONFIG[opp.stage].emoji} {STAGE_CONFIG[opp.stage].label}
                          </Badge>
                        </div>

                        {/* Title & Priority */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm line-clamp-2 flex-1">{opp.title}</h4>
                          {opp.priority === 'high' || opp.priority === 'urgent' ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                              {opp.priority_display}
                            </Badge>
                          ) : null}
                        </div>

                        {/* Account */}
                        <div className="text-xs text-muted-foreground mb-2 truncate">
                          {opp.account.display_name}
                        </div>

                        {/* Value */}
                        {opp.estimated_value && (
                          <div className="text-sm font-semibold text-green-600 mb-2">
                            {formatMoney(parseFloat(opp.estimated_value), opp.currency)}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span className="text-[10px]">{opp.owner.full_name}</span>
                          {opp.expected_close_date && (
                            <span className="text-[10px]">{formatDate(opp.expected_close_date)}</span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board */
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const stageConfig = STAGE_CONFIG[stage];
              const stageOpportunities = opportunitiesByStage[stage] || [];
              const isCollapsed = collapsedColumns.has(stage);

              return (
                <div
                  key={stage}
                  className={`flex-shrink-0 transition-all duration-300 ${
                    isCollapsed ? 'w-[50px]' : 'w-[280px]'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`mb-3 ${isCollapsed ? '' : 'flex items-center justify-between'}`}>
                    {isCollapsed ? (
                      <button
                        onClick={() => toggleColumn(stage)}
                        className="w-full h-[100px] bg-card border border-white/10 rounded-xl p-2 hover:bg-accent transition-colors flex items-center justify-center backdrop-blur-sm"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-lg">{stageConfig.emoji}</span>
                          <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="text-xs font-semibold">
                            {stageConfig.label}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {stageOpportunities.length}
                          </Badge>
                        </div>
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xl">{stageConfig.emoji}</span>
                          <div>
                            <h3 className="font-semibold text-sm">{stageConfig.label}</h3>
                            <p className="text-xs text-muted-foreground">{stageOpportunities.length}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleColumn(stage)}
                          title="Collapse column"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Cards */}
                  {!isCollapsed && (
                    <DroppableColumn stage={stage}>
                      {stageOpportunities.map(opp => (
                        <DraggableCard
                          key={opp.id}
                          opportunity={opp}
                          onClick={() => handleCardClick(opp.id)}
                        >
                        <Card
                          className="p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all text-xs rounded-xl border-white/10 bg-background/50 backdrop-blur-sm"
                          onClick={() => handleCardClick(opp.id)}
                        >
                          {/* Title & Priority */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-sm line-clamp-2 flex-1">{opp.title}</h4>
                            {opp.priority === 'high' || opp.priority === 'urgent' ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                {opp.priority_display}
                              </Badge>
                            ) : null}
                          </div>

                          {/* Account */}
                          <div className="text-xs text-muted-foreground mb-2 truncate">
                            {opp.account.display_name}
                          </div>

                          {/* Value */}
                          {opp.estimated_value && (
                            <div className="text-sm font-semibold text-green-600 mb-2">
                              {formatMoney(parseFloat(opp.estimated_value), opp.currency)}
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span className="text-[10px]">{opp.owner.full_name}</span>
                            {opp.expected_close_date && (
                              <span className="text-[10px]">{formatDate(opp.expected_close_date)}</span>
                            )}
                          </div>
                        </Card>
                        </DraggableCard>
                      ))}
                    </DroppableColumn>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Priority</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => (
                  <TableRow
                    key={opp.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCardClick(opp.id)}
                  >
                    <TableCell>
                      {(opp.priority === 'high' || opp.priority === 'urgent') && (
                        <Badge variant="destructive" className="text-xs">
                          {opp.priority_display}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{opp.title}</TableCell>
                    <TableCell>{opp.account.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {STAGE_CONFIG[opp.stage].emoji} {STAGE_CONFIG[opp.stage].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {opp.estimated_value && (
                        <span className="font-semibold text-green-600">
                          {formatMoney(parseFloat(opp.estimated_value), opp.currency)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{opp.owner.full_name}</TableCell>
                    <TableCell className="text-sm">
                      {opp.expected_close_date ? formatDate(opp.expected_close_date) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/opportunities/${opp.id}/edit`);
                      }}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
      </DndContext>
    </AppLayout>
  );
}
