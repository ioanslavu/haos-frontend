import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppLayout } from '@/components/layout/AppLayout'
import { useOpportunities, useOpportunityPipeline } from '@/api/hooks/useArtistSales'
import {
  Opportunity,
  OpportunityStage,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
} from '@/types/artist-sales'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function OpportunityList() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'list' | 'pipeline'>('list')

  const { data: opportunitiesData, isLoading } = useOpportunities()
  const { data: pipeline } = useOpportunityPipeline()
  const opportunities = opportunitiesData?.results || []

  const filteredOpportunities = opportunities.filter((opp) =>
    opp.opp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.account.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedByStage = filteredOpportunities.reduce((acc, opp) => {
    if (!acc[opp.stage]) acc[opp.stage] = []
    acc[opp.stage].push(opp)
    return acc
  }, {} as Record<OpportunityStage, Opportunity[]>)

  return (
    <AppLayout
      title="Opportunities"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/artist-sales/opportunities/pipeline')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Pipeline View
          </Button>
          <Button onClick={() => navigate('/artist-sales/opportunities/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Opportunity
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipeline?.total_opportunities || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Number(pipeline?.total_value || 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(pipeline?.weighted_value || 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'pipeline')}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
            </TabsList>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="list" className="space-y-4 mt-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : filteredOpportunities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No opportunities found</p>
                </CardContent>
              </Card>
            ) : (
              filteredOpportunities.map((opp) => (
                <Card
                  key={opp.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/artist-sales/opportunities/${opp.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{opp.opp_name}</h3>
                          <Badge className={cn(OPPORTUNITY_STAGE_COLORS[opp.stage])}>
                            {OPPORTUNITY_STAGE_LABELS[opp.stage]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {opp.account.display_name}
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                          {opp.amount_expected && (
                            <div>
                              <span className="text-muted-foreground">Value: </span>
                              <span className="font-medium">
                                {formatCurrency(Number(opp.amount_expected))} {opp.currency}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Probability: </span>
                            <span className="font-medium">{opp.probability_percent}%</span>
                          </div>
                          {opp.expected_close_date && (
                            <div>
                              <span className="text-muted-foreground">Expected Close: </span>
                              <span className="font-medium">{formatDate(opp.expected_close_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pipeline" className="mt-6">
            <div className="grid grid-cols-3 gap-4">
              {(['qualified', 'proposal', 'negotiation', 'contract_sent', 'po_received', 'in_execution', 'completed', 'closed_lost'] as OpportunityStage[]).map((stage) => (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{OPPORTUNITY_STAGE_LABELS[stage]}</h3>
                    <Badge variant="outline">{groupedByStage[stage]?.length || 0}</Badge>
                  </div>
                  <div className="space-y-2">
                    {groupedByStage[stage]?.map((opp) => (
                      <Card
                        key={opp.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => navigate(`/artist-sales/opportunities/${opp.id}`)}
                      >
                        <CardContent className="p-3">
                          <p className="font-medium text-sm mb-1">{opp.opp_name}</p>
                          <p className="text-xs text-muted-foreground mb-2">{opp.account.display_name}</p>
                          {opp.amount_expected && (
                            <p className="text-xs font-medium">
                              {formatCurrency(Number(opp.amount_expected))} {opp.currency}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
