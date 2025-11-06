import { useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Deal } from '@/types/artist-sales'
import { formatDate } from '@/lib/utils'
import { ClipboardList, Target, FileCheck, Handshake } from 'lucide-react'

interface DealTimelineProps {
  deal: Deal
}

interface TimelineNodeData {
  label: string
  icon: React.ReactNode
  data: any
  type: 'brief' | 'opportunity' | 'proposal' | 'deal'
  status?: string
  date?: string
}

const nodeTypes = {
  timeline: TimelineNode,
}

function TimelineNode({ data }: { data: TimelineNodeData }) {
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'brief':
        return 'bg-blue-50 border-blue-200'
      case 'opportunity':
        return 'bg-purple-50 border-purple-200'
      case 'proposal':
        return 'bg-yellow-50 border-yellow-200'
      case 'deal':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className={`w-[250px] ${getNodeColor(data.type)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {data.icon}
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.data && (
          <>
            <div className="text-sm font-semibold line-clamp-2">
              {data.data.title || data.data.name}
            </div>
            {data.status && (
              <Badge variant="secondary" className="text-xs">
                {data.status}
              </Badge>
            )}
            {data.date && (
              <div className="text-xs text-muted-foreground">
                {formatDate(data.date)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function DealTimeline({ deal }: DealTimelineProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    let yPosition = 100

    // Brief Node
    if (deal.brief) {
      nodes.push({
        id: 'brief',
        type: 'timeline',
        position: { x: 250, y: yPosition },
        data: {
          label: 'Brief',
          icon: <ClipboardList className="h-4 w-4" />,
          data: {
            title: deal.brief.campaign_title,
          },
          type: 'brief',
          status: deal.brief.brief_status_display,
          date: deal.brief.received_date,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })
      yPosition += 200
    }

    // Opportunity Node
    if (deal.opportunity) {
      nodes.push({
        id: 'opportunity',
        type: 'timeline',
        position: { x: 250, y: yPosition },
        data: {
          label: 'Opportunity',
          icon: <Target className="h-4 w-4" />,
          data: {
            title: deal.opportunity.opp_name,
          },
          type: 'opportunity',
          status: deal.opportunity.stage_display,
          date: deal.opportunity.created_at,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })

      if (deal.brief) {
        edges.push({
          id: 'brief-opportunity',
          source: 'brief',
          target: 'opportunity',
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        })
      }

      yPosition += 200
    }

    // Proposal Node
    if (deal.proposal) {
      nodes.push({
        id: 'proposal',
        type: 'timeline',
        position: { x: 250, y: yPosition },
        data: {
          label: 'Proposal',
          icon: <FileCheck className="h-4 w-4" />,
          data: {
            title: deal.proposal.proposal_title,
          },
          type: 'proposal',
          status: deal.proposal.status_display,
          date: deal.proposal.proposal_date,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })

      if (deal.opportunity) {
        edges.push({
          id: 'opportunity-proposal',
          source: 'opportunity',
          target: 'proposal',
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        })
      }

      yPosition += 200
    }

    // Deal Node
    nodes.push({
      id: 'deal',
      type: 'timeline',
      position: { x: 250, y: yPosition },
      data: {
        label: 'Deal',
        icon: <Handshake className="h-4 w-4" />,
        data: {
          title: deal.deal_name,
          name: deal.contract_number,
        },
        type: 'deal',
        status: deal.status_display,
        date: deal.contract_date,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    })

    if (deal.proposal) {
      edges.push({
        id: 'proposal-deal',
        source: 'proposal',
        target: 'deal',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      })
    } else if (deal.opportunity) {
      edges.push({
        id: 'opportunity-deal',
        source: 'opportunity',
        target: 'deal',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      })
    } else if (deal.brief) {
      edges.push({
        id: 'brief-deal',
        source: 'brief',
        target: 'deal',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      })
    }

    return { nodes, edges }
  }, [deal])

  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No timeline data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '600px', width: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  )
}
