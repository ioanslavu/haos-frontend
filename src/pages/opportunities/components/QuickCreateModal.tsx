/**
 * QuickCreateModal - Simplified opportunity creation
 *
 * Just select a client and create - that's it!
 * Opportunity is created with BRIEF stage, auto-generated name.
 * All other details can be added on the opportunity detail page.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useEntities } from '@/api/hooks/useEntities'
import { useCreateOpportunity, useOpportunities } from '@/api/hooks/useOpportunities'
import { useAuthStore } from '@/stores/authStore'
import type { Entity } from '@/api/services/entities.service'

export function QuickCreateModal() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Fetch clients (entities)
  const { data: entitiesData, isLoading: isLoadingEntities } = useEntities({
    search: searchQuery,
    page_size: 20,
  })

  const entities = entitiesData?.results || []

  // Get recent opportunities to show clients with activity
  const { data: recentOpportunitiesData } = useOpportunities({
    ordering: '-created_at',
    page_size: 10,
  })

  const recentOpportunities = recentOpportunitiesData?.results || []

  // Get unique recent clients from opportunities
  const recentClients = Array.from(
    new Map(
      recentOpportunities
        .filter(o => o.account?.id && o.account?.display_name)
        .map(o => [o.account.id, o.account])
    ).values()
  ).slice(0, 5)

  const createOpportunity = useCreateOpportunity()

  const handleClientSelect = async (client: Entity) => {
    if (!client?.display_name) return

    setIsCreating(true)
    try {
      // Auto-generate opportunity name
      const date = new Date()
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const opportunityTitle = `${client.display_name} - ${monthYear}`

      // Create opportunity immediately with BRIEF stage
      const opportunity = await createOpportunity.mutateAsync({
        title: opportunityTitle,
        account: client.id, // Backend field is still 'account'
        owner: user?.id,
        stage: 'brief',
        priority: 'medium',
        currency: 'EUR',
      })

      setOpen(false)
      // Navigate to the new opportunity
      navigate(`/opportunities/${opportunity.id}`)
    } catch (error) {
      // Error handled by mutation
      setIsCreating(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isCreating) {
      setOpen(isOpen)
      // Reset state after animation
      if (!isOpen) {
        setTimeout(() => {
          setSearchQuery('')
        }, 200)
      }
    }
  }

  // Show recent clients when not searching
  const showRecentClients = !searchQuery && recentClients.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            New Opportunity
          </DialogTitle>
          <DialogDescription className="text-base">
            Who is this opportunity for?
          </DialogDescription>
        </DialogHeader>

        {/* Creating Overlay */}
        {isCreating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Creating opportunity...</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
              autoFocus
            />
          </div>

          {/* Recent Clients Section */}
          {showRecentClients && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <TrendingUp className="h-3 w-3" />
                Recent Clients
              </div>
              <div className="flex flex-wrap gap-2">
                {recentClients.map((client) => (
                  <Button
                    key={client.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 gap-2 hover:bg-primary/10 hover:border-primary/50"
                    onClick={() => handleClientSelect(client as Entity)}
                    disabled={isCreating}
                  >
                    <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 flex items-center justify-center">
                      <span className="text-[8px] font-semibold">
                        {client.display_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    {client.display_name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Client List */}
          <div className="space-y-2">
            {searchQuery && (
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Search Results
              </div>
            )}
            {!searchQuery && !showRecentClients && (
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                All Clients
              </div>
            )}
            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
              {isLoadingEntities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : entities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No clients found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                entities.map((entity) => (
                  <Card
                    key={entity.id}
                    className={cn(
                      "p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group",
                      "border-transparent bg-muted/30 hover:bg-muted/50"
                    )}
                    onClick={() => handleClientSelect(entity)}
                  >
                    <div className="flex items-center gap-3">
                      {entity.image_url ? (
                        <img
                          src={entity.image_url}
                          alt={entity.display_name || 'Client'}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <span className="text-lg font-semibold">
                            {entity.display_name?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{entity.display_name || 'Unknown'}</h4>
                        <p className="text-xs text-muted-foreground">
                          {entity.kind === 'PJ' ? 'Company' : 'Person'}
                          {entity.email && ` · ${entity.email}`}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Select a client to create a new opportunity. You can add details after.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
