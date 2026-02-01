/**
 * OpportunityHeader - Compact header card with inline editing
 */

import { Link } from 'react-router-dom'
import {
  Building2,
  Calendar as CalendarIcon,
  Check,
  CheckCircle,
  ChevronRight,
  DollarSign,
  Edit2,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Target,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import {
  STAGE_CONFIG,
  PRIORITY_CONFIG,
  type OpportunityStage,
} from '@/types/opportunities'
import type { Opportunity } from '@/types/opportunities'
import { STAGE_FLOW } from '../hooks/useOpportunityDetail'

interface OpportunityHeaderProps {
  opportunity: Opportunity
  isTerminalStage: boolean
  currentStageIndex: number
  expectedCloseDateOpen: boolean
  setExpectedCloseDateOpen: (open: boolean) => void
  isSavingDates: boolean
  canTransitionTo: (stage: OpportunityStage) => boolean
  onStageChange: (stage: OpportunityStage) => void
  onSaveExpectedCloseDate: (date: Date | undefined) => void
  onMarkWon: () => void
  onMarkLost: () => void
  onDelete: () => void
  navigate: (path: string) => void
}

export function OpportunityHeader({
  opportunity,
  isTerminalStage,
  currentStageIndex,
  expectedCloseDateOpen,
  setExpectedCloseDateOpen,
  isSavingDates,
  canTransitionTo,
  onStageChange,
  onSaveExpectedCloseDate,
  onMarkWon,
  onMarkLost,
  onDelete,
  navigate,
}: OpportunityHeaderProps) {
  const stageConfig = STAGE_CONFIG[opportunity.stage]
  const priorityConfig = PRIORITY_CONFIG[opportunity.priority]

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
      <div className="p-5 space-y-4">
        {/* Row 1: Title, Client, Stage Flow, Actions */}
        <div className="flex items-center justify-between gap-6">
          {/* Left: Title and Client */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{opportunity.title}</h1>
                <Badge className={cn('text-xs', priorityConfig.color)}>
                  {priorityConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-xs font-mono">{opportunity.opportunity_number}</span>
                <span className="text-muted-foreground/50">-</span>
                <Link
                  to={`/entities/${opportunity.client.id}`}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{opportunity.client.display_name}</span>
                </Link>
                {opportunity.contact_person && (
                  <>
                    <span className="text-muted-foreground/50">-</span>
                    <span>{opportunity.contact_person.full_name}</span>
                  </>
                )}
                <span className="text-muted-foreground/50">-</span>
                {/* Expected Close Date */}
                <Popover open={expectedCloseDateOpen} onOpenChange={setExpectedCloseDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50',
                        !opportunity.expected_close_date && 'text-amber-500'
                      )}
                      disabled={isSavingDates}
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {opportunity.expected_close_date
                        ? formatDate(opportunity.expected_close_date)
                        : 'Set close date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        opportunity.expected_close_date
                          ? new Date(opportunity.expected_close_date)
                          : undefined
                      }
                      onSelect={onSaveExpectedCloseDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Center: Stage Flow */}
          <StageFlow
            currentStage={opportunity.stage}
            isTerminalStage={isTerminalStage}
            currentStageIndex={currentStageIndex}
            canTransitionTo={canTransitionTo}
            onStageChange={onStageChange}
          />

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isTerminalStage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkWon}
                  className="rounded-lg border-green-500/30 text-green-500 hover:bg-green-500/10"
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Won
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkLost}
                  className="rounded-lg border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Lost
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-white/10"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/opportunities/${opportunity.id}/edit`)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Opportunity
                </DropdownMenuItem>
                {isTerminalStage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onStageChange('brief')}
                      className="text-blue-500"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reopen Opportunity
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Opportunity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Key Stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-6 flex-1">
            <StatItem
              icon={DollarSign}
              color="emerald"
              label="Est. Value"
              value={
                opportunity.estimated_value
                  ? formatMoney(parseFloat(opportunity.estimated_value), opportunity.currency)
                  : '-'
              }
            />
            <StatItem
              icon={Target}
              color="blue"
              label="Probability"
              value={`${opportunity.probability}%`}
            />
            <StatItem
              icon={Users}
              color="purple"
              label="Owner"
              value={opportunity.owner.full_name}
            />
            {opportunity.team && (
              <StatItem
                icon={TrendingUp}
                color="amber"
                label="Team"
                value={opportunity.team.name}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function StatItem({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: any
  color: string
  label: string
  value: string
}) {
  const bgColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/20',
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    amber: 'bg-amber-500/20',
  }
  const textColorMap: Record<string, string> = {
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    amber: 'text-amber-500',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn('p-1.5 rounded-md', bgColorMap[color])}>
        <Icon className={cn('h-3.5 w-3.5', textColorMap[color])} />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function StageFlow({
  currentStage,
  isTerminalStage,
  currentStageIndex,
  canTransitionTo,
  onStageChange,
}: {
  currentStage: OpportunityStage
  isTerminalStage: boolean
  currentStageIndex: number
  canTransitionTo: (stage: OpportunityStage) => boolean
  onStageChange: (stage: OpportunityStage) => void
}) {
  const stageConfig = STAGE_CONFIG[currentStage]

  if (isTerminalStage) {
    return (
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
        <Badge className={cn('text-xs px-3 py-1.5', stageConfig.color)}>
          {stageConfig.emoji} {stageConfig.label}
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl">
      {STAGE_FLOW.slice(0, 6).map((stage, index) => {
        const config = STAGE_CONFIG[stage]
        const isCompleted = index < currentStageIndex
        const isCurrent = stage === currentStage
        const isClickable = canTransitionTo(stage) && !isCurrent

        return (
          <div key={stage} className="flex items-center">
            <button
              onClick={() => isClickable && onStageChange(stage)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                isCurrent &&
                  'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md',
                isCompleted && 'bg-primary/10 text-primary',
                !isCompleted && !isCurrent && 'text-muted-foreground/60',
                isClickable && !isCurrent && 'cursor-pointer hover:bg-muted/50'
              )}
              title={isClickable ? `Click to change to ${config.label}` : config.label}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-sm">{config.emoji}</span>
              )}
              <span className={cn(isCurrent ? 'inline' : 'hidden sm:inline')}>
                {config.label.split(' ')[0]}
              </span>
            </button>
            {index < 5 && (
              <ChevronRight
                className={cn(
                  'h-3 w-3 mx-0.5 shrink-0',
                  index < currentStageIndex ? 'text-primary' : 'text-muted-foreground/30'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
