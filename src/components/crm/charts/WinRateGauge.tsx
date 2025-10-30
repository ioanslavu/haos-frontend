import { useMemo } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface WinRateGaugeProps {
  won: number
  lost: number
  title?: string
  description?: string
  showComparison?: boolean
  previousPeriod?: { won: number; lost: number }
}

export function WinRateGauge({
  won,
  lost,
  title = 'Win Rate',
  description,
  showComparison = false,
  previousPeriod,
}: WinRateGaugeProps) {
  const winRate = useMemo(() => {
    const total = won + lost
    if (total === 0) return 0
    return (won / total) * 100
  }, [won, lost])

  const comparison = useMemo(() => {
    if (!showComparison || !previousPeriod) return null

    const prevTotal = previousPeriod.won + previousPeriod.lost
    if (prevTotal === 0) return null

    const prevWinRate = (previousPeriod.won / prevTotal) * 100
    const change = winRate - prevWinRate

    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNeutral: Math.abs(change) < 0.5,
    }
  }, [winRate, previousPeriod, showComparison])

  const chartData = [
    {
      name: 'Win Rate',
      value: winRate,
      fill: winRate >= 70 ? 'hsl(142, 76%, 36%)' : winRate >= 50 ? 'hsl(43, 96%, 56%)' : 'hsl(0, 84%, 60%)',
    },
  ]

  const getWinRateColor = () => {
    if (winRate >= 70) return 'text-green-600 dark:text-green-400'
    if (winRate >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {comparison && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                comparison.isNeutral
                  ? 'text-muted-foreground'
                  : comparison.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {comparison.isNeutral ? (
                <Minus className="h-4 w-4" />
              ) : comparison.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{comparison.value}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <ResponsiveContainer width={200} height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                data={chartData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  animationDuration={1000}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-bold ${getWinRateColor()}`}>
                {winRate.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Win Rate</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{won}</p>
            <p className="text-xs text-muted-foreground mt-1">Won</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lost}</p>
            <p className="text-xs text-muted-foreground mt-1">Lost</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
