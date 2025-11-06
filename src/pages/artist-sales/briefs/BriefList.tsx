import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, AlertCircle, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layout/AppLayout'
import { useBriefs, useBriefStats } from '@/api/hooks/useArtistSales'
import { Brief, BRIEF_STATUS_LABELS, BRIEF_STATUS_COLORS } from '@/types/artist-sales'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function BriefList() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: briefsData, isLoading } = useBriefs()
  const { data: stats } = useBriefStats()
  const briefs = briefsData?.results || []

  const filteredBriefs = briefs.filter((brief) =>
    brief.campaign_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brief.account.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppLayout
      title="Briefs"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/artist-sales/briefs/kanban')}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Kanban View
          </Button>
          <Button onClick={() => navigate('/artist-sales/briefs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Brief
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Briefs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_briefs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.overdue_count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.by_status?.new || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.by_status?.won || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search briefs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Briefs List */}
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredBriefs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No briefs found</p>
              </CardContent>
            </Card>
          ) : (
            filteredBriefs.map((brief) => (
              <Card
                key={brief.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(`/artist-sales/briefs/${brief.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{brief.campaign_title}</h3>
                        <Badge className={cn(BRIEF_STATUS_COLORS[brief.brief_status])}>
                          {BRIEF_STATUS_LABELS[brief.brief_status]}
                        </Badge>
                        {brief.is_overdue && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {brief.account.display_name}
                      </p>
                      {brief.brand_category && (
                        <Badge variant="outline" className="mb-3">
                          {brief.brand_category}
                        </Badge>
                      )}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Received: {formatDate(brief.received_date)}</span>
                        {brief.sla_due_date && (
                          <span>Due: {formatDate(brief.sla_due_date)}</span>
                        )}
                        {brief.budget_range_min && brief.budget_range_max && (
                          <span>
                            Budget: {brief.currency} {brief.budget_range_min} - {brief.budget_range_max}
                          </span>
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
