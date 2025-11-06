import { useNavigate } from 'react-router-dom'
import { Loader2, TrendingUp, DollarSign, Percent, ArrowLeft } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOpportunityPipeline } from '@/api/hooks/useArtistSales'
import { formatMoney } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const STAGE_ORDER = [
  'qualified',
  'proposal',
  'shortlist',
  'negotiation',
  'contract_sent',
  'po_received',
  'in_execution',
  'completed',
  'closed_lost',
]

const STAGE_LABELS: Record<string, string> = {
  qualified: 'Qualified',
  proposal: 'Proposal',
  shortlist: 'Shortlist',
  negotiation: 'Negotiation',
  contract_sent: 'Contract Sent',
  po_received: 'PO Received',
  in_execution: 'In Execution',
  completed: 'Completed',
  closed_lost: 'Closed Lost',
}

const STAGE_COLORS: Record<string, string> = {
  qualified: 'bg-blue-500',
  proposal: 'bg-purple-500',
  shortlist: 'bg-yellow-500',
  negotiation: 'bg-orange-500',
  contract_sent: 'bg-pink-500',
  po_received: 'bg-indigo-500',
  in_execution: 'bg-cyan-500',
  completed: 'bg-green-500',
  closed_lost: 'bg-red-500',
}

export default function OpportunityPipeline() {
  const navigate = useNavigate()
  const { data: pipelineData, isLoading } = useOpportunityPipeline()

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  const pipeline = pipelineData || {
    total_opportunities: 0,
    total_value: '0',
    weighted_value: '0',
    by_stage: {},
  }

  // Get max count for scaling
  const maxCount = Math.max(
    ...Object.values(pipeline.by_stage).map((stage: any) => stage.count),
    1
  )

  // Filter and sort stages that have opportunities
  const activeStages = STAGE_ORDER.filter((stage) => pipeline.by_stage[stage])

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/opportunities')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
              <p className="text-muted-foreground mt-2">
                Opportunity funnel visualization with weighted forecasting
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipeline.total_opportunities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMoney(parseFloat(pipeline.total_value), 'EUR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weighted Forecast</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMoney(parseFloat(pipeline.weighted_value), 'EUR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on probability %
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>
              Opportunities by stage - bar width represents count, value shown below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeStages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No opportunities in pipeline
              </div>
            ) : (
              <div className="space-y-4">
                {activeStages.map((stage) => {
                  const stageData = pipeline.by_stage[stage]
                  const widthPercent = (stageData.count / maxCount) * 100

                  return (
                    <div key={stage} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{STAGE_LABELS[stage]}</Badge>
                          <span className="text-muted-foreground">
                            {stageData.count} {stageData.count === 1 ? 'opportunity' : 'opportunities'}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatMoney(parseFloat(stageData.total_value), 'EUR')}
                        </span>
                      </div>

                      {/* Funnel Bar */}
                      <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                        <div
                          className={`h-full ${STAGE_COLORS[stage]} transition-all duration-300 flex items-center justify-center text-white font-semibold`}
                          style={{ width: `${widthPercent}%`, minWidth: '80px' }}
                          onClick={() => navigate(`/artist-sales/opportunities?stage=${stage}`)}
                        >
                          <button
                            className="hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/artist-sales/opportunities?stage=${stage}`)
                            }}
                          >
                            {stageData.count}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeStages.map((stage, index) => {
                if (index === activeStages.length - 1) return null

                const currentStage = pipeline.by_stage[stage]
                const nextStage = pipeline.by_stage[activeStages[index + 1]]

                if (!currentStage || !nextStage) return null

                const conversionRate = ((nextStage.count / currentStage.count) * 100).toFixed(1)

                return (
                  <div key={stage} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm font-medium">{STAGE_LABELS[activeStages[index + 1]]}</span>
                    </div>
                    <Badge variant={parseFloat(conversionRate) >= 50 ? 'default' : 'secondary'}>
                      {conversionRate}% conversion
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
