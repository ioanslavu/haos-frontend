import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CampaignStatus, CAMPAIGN_STATUS_LABELS } from '@/types/campaign'

interface StatusDistributionChartProps {
  data: Record<CampaignStatus, number>
  title?: string
  description?: string
  height?: number
  showLegend?: boolean
}

const STATUS_COLORS: Record<CampaignStatus, string> = {
  lead: 'hsl(217, 91%, 60%)',
  negotiation: 'hsl(43, 96%, 56%)',
  confirmed: 'hsl(142, 76%, 36%)',
  active: 'hsl(271, 91%, 65%)',
  completed: 'hsl(215, 20%, 65%)',
  lost: 'hsl(0, 84%, 60%)',
}

export function StatusDistributionChart({
  data,
  title = 'Campaign Distribution',
  description,
  height = 300,
  showLegend = true,
}: StatusDistributionChartProps) {
  const chartData = useMemo(() => {
    return (Object.entries(data) as [CampaignStatus, number][])
      .map(([status, count]) => ({
        name: CAMPAIGN_STATUS_LABELS[status],
        value: count,
        fill: STATUS_COLORS[status],
      }))
      .filter((item) => item.value > 0)
  }, [data])

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0)
  }, [chartData])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]
    const percentage = ((data.value / total) * 100).toFixed(1)

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-lg font-bold">{data.value} campaigns</p>
        <p className="text-sm text-muted-foreground">{percentage}% of total</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-sm">
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
