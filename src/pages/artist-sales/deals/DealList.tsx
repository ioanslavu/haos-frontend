import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, DollarSign, Calendar, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layout/AppLayout'
import { useDeals, useDealStats } from '@/api/hooks/useArtistSales'
import { Deal, DEAL_STATUS_LABELS, DEAL_STATUS_COLORS } from '@/types/artist-sales'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function DealList() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: dealsData, isLoading } = useDeals()
  const { data: stats } = useDealStats()
  const deals = dealsData?.results || []

  const filteredDeals = deals.filter((deal) =>
    deal.deal_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.account.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppLayout
      title="Deals"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/artist-sales/deals/kanban')}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Kanban View
          </Button>
          <Button onClick={() => navigate('/artist-sales/deals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_deals || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Number(stats?.total_value || 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.by_status?.active?.count || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.expiring_soon || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredDeals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No deals found</p>
              </CardContent>
            </Card>
          ) : (
            filteredDeals.map((deal) => (
              <Card
                key={deal.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(`/artist-sales/deals/${deal.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{deal.deal_title}</h3>
                        <Badge className={cn(DEAL_STATUS_COLORS[deal.deal_status])}>
                          {DEAL_STATUS_LABELS[deal.deal_status]}
                        </Badge>
                        <Badge variant="outline">{deal.contract_number}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {deal.account.display_name}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Value: </span>
                          <span className="font-medium">
                            {formatCurrency(Number(deal.fee_total))} {deal.currency}
                          </span>
                        </div>
                        {deal.start_date && (
                          <div>
                            <span className="text-muted-foreground">Start: </span>
                            <span className="font-medium">{formatDate(deal.start_date)}</span>
                          </div>
                        )}
                        {deal.end_date && (
                          <div>
                            <span className="text-muted-foreground">End: </span>
                            <span className="font-medium">{formatDate(deal.end_date)}</span>
                          </div>
                        )}
                        {deal.artists_count && (
                          <Badge variant="outline">{deal.artists_count} Artist(s)</Badge>
                        )}
                        {deal.deliverables_count && (
                          <Badge variant="outline">{deal.deliverables_count} Deliverable(s)</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}
