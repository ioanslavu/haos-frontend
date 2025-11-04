import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { distributionsService } from '@/api/services/distributions.service'
import { Distribution, DistributionFilters } from '@/types/distribution'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const dealStatusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_negotiation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

const dealTypeColors = {
  artist: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  label: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  aggregator: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

export default function DistributionsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<DistributionFilters>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['distributions', filters, search, page],
    queryFn: () => distributionsService.getDistributions({ ...filters, search, page, page_size: 20 }),
  })

  const handleRowClick = (distribution: Distribution) => {
    navigate(`/digital/distributions/${distribution.id}`)
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Distributions
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Manage long-term distribution deals
              </p>
            </div>
            <Button
              onClick={() => navigate('/digital/distributions/new')}
              size="lg"
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Distribution
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.results?.filter((d) => d.deal_status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Negotiation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data?.results?.filter((d) => d.deal_status === 'in_negotiation').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.results?.reduce((sum, d) => sum + d.track_count, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Glassmorphic Filters */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by entity name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-background/50 border-white/10 focus:border-blue-500/50 transition-all duration-300"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Select
            value={filters.deal_status?.[0] || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, deal_status: value === 'all' ? undefined : [value as any] })
            }
          >
            <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in_negotiation">In Negotiation</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.deal_type?.[0] || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, deal_type: value === 'all' ? undefined : [value as any] })
            }
          >
            <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
              <SelectValue placeholder="Deal Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="label">Label</SelectItem>
              <SelectItem value="aggregator">Aggregator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead>Deal Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revenue Share</TableHead>
                <TableHead>Tracks</TableHead>
                <TableHead>Signing Date</TableHead>
                <TableHead>Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No distributions found
                  </TableCell>
                </TableRow>
              ) : (
                data?.results?.map((distribution) => (
                  <TableRow
                    key={distribution.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(distribution)}
                  >
                    <TableCell className="font-medium">{distribution.entity.display_name}</TableCell>
                    <TableCell>
                      <Badge className={dealTypeColors[distribution.deal_type]}>
                        {distribution.deal_type_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={dealStatusColors[distribution.deal_status]}>
                        {distribution.deal_status_display}
                      </Badge>
                    </TableCell>
                    <TableCell>{distribution.global_revenue_share_percentage}%</TableCell>
                    <TableCell>{distribution.track_count}</TableCell>
                    <TableCell>{new Date(distribution.signing_date).toLocaleDateString()}</TableCell>
                    <TableCell>€{parseFloat(distribution.total_revenue).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data && data.count > 20 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.count)} of {data.count} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!data.previous}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!data.next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}
