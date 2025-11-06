import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layout/AppLayout'
import { useProposals } from '@/api/hooks/useArtistSales'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '@/types/artist-sales'
import { formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ProposalList() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: proposalsData, isLoading } = useProposals()
  const proposals = proposalsData?.results || []

  const filteredProposals = proposals.filter((proposal) =>
    proposal.opportunity.opp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.opportunity.account_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppLayout
      title="Proposals"
      actions={
        <Button onClick={() => navigate('/artist-sales/proposals/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Proposal
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No proposals found</p>
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => (
              <Card
                key={proposal.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(`/artist-sales/proposals/${proposal.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{proposal.opportunity.opp_name}</h3>
                        <Badge variant="outline">v{proposal.version}</Badge>
                        <Badge className={cn(PROPOSAL_STATUS_COLORS[proposal.proposal_status])}>
                          {PROPOSAL_STATUS_LABELS[proposal.proposal_status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {proposal.opportunity.account_name}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Gross: </span>
                          <span className="font-medium">
                            {formatCurrency(Number(proposal.fee_gross))} {proposal.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net: </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(Number(proposal.fee_net))} {proposal.currency}
                          </span>
                        </div>
                        {proposal.sent_date && (
                          <div>
                            <span className="text-muted-foreground">Sent: </span>
                            <span className="font-medium">{formatDate(proposal.sent_date)}</span>
                          </div>
                        )}
                        {proposal.valid_until && (
                          <div>
                            <span className="text-muted-foreground">Valid Until: </span>
                            <span className="font-medium">{formatDate(proposal.valid_until)}</span>
                          </div>
                        )}
                        {proposal.artists_count && (
                          <Badge variant="outline">{proposal.artists_count} Artist(s)</Badge>
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
