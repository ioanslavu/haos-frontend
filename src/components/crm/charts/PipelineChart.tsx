import { useMemo } from 'react'
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CampaignStatus, CAMPAIGN_STATUS_LABELS } from '@/types/campaign'

interface PipelineChartProps {
  data: Record<CampaignStatus, { count: number; value: number }>
  title?: string
  description?: string
  height?: number
}

const STATUS_COLORS: Record<CampaignStatus, string> = {
  lead: 'hsl(217, 91%, 60%)',
  negotiation: 'hsl(43, 96%, 56%)',
  confirmed: 'hsl(142, 76%, 36%)',
  active: 'hsl(271, 91%, 65%)',
  completed: 'hsl(215, 20%, 65%)',
  lost: 'hsl(0, 84%, 60%)',
}

export function PipelineChart({
  data,
  title = 'Deal Pipeline',
  description,
  height = 400,
}: PipelineChartProps) {
  const funnelData = useMemo(() => {
    return (['lead', 'negotiation', 'confirmed', 'active', 'completed'] as CampaignStatus[])
      .map((status) => ({
        name: CAMPAIGN_STATUS_LABELS[status],
        value: data[status]?.count || 0,
        totalValue: data[status]?.value || 0,
        fill: STATUS_COLORS[status],
      }))
      .filter((item) => item.value > 0)
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-lg font-bold">{data.value} campaigns</p>
        <p className="text-sm text-muted-foreground">
          Total: ${data.totalValue.toLocaleString()}
        </p>
      </div>
    )
  }

  if (funnelData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
            No pipeline data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <FunnelChart>
            <Tooltip content={<CustomTooltip />} />
            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
              animationDuration={1000}
            >
              <LabelList
                position="right"
                fill="#000"
                stroke="none"
                dataKey="name"
                className="fill-foreground text-sm font-medium"
              />
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {funnelData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div
                className="h-2 rounded-full"
                style={{ backgroundColor: item.fill, opacity: 0.3 }}
              />
              <p className="text-xs font-medium">{item.name}</p>
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">
                ${(item.totalValue / 1000).toFixed(0)}k
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
