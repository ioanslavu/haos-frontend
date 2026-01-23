/**
 * CreateDistributionModal - Simplified distribution creation
 *
 * Just select an entity and create - that's it!
 * Distribution is created with IN_NEGOTIATION status.
 * All other details can be added on the distribution detail page.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Loader2,
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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEntities } from '@/api/hooks/useEntities'
import { useCreateDistribution, useDistributions } from '@/api/hooks/useDistributions'
import type { Entity } from '@/api/services/entities.service'
import type { DealType } from '@/types/distribution'
import { DEAL_TYPE_CONFIG } from '@/types/distribution'

interface CreateDistributionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDistributionModal({ open, onOpenChange }: CreateDistributionModalProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Fetch entities
  const { data: entitiesData, isLoading: isLoadingEntities } = useEntities({
    search: searchQuery,
    page_size: 20,
  })

  const entities = entitiesData?.results || []

  // Get recent distributions to show entities with existing deals
  const { data: recentDistributionsData } = useDistributions({
    ordering: '-created_at',
    page_size: 10,
  })

  const recentDistributions = recentDistributionsData?.results || []

  // Get unique recent entities from distributions
  const recentEntities = Array.from(
    new Map(
      recentDistributions.map(d => [d.entity.id, d.entity])
    ).values()
  ).slice(0, 5)

  const createDistribution = useCreateDistribution()

  // Infer deal type from entity classification and type
  const inferDealType = (entity: Entity): DealType => {
    if (entity.entity_type === 'artist') return 'artist'
    if (entity.entity_type === 'label') return 'label'
    if (entity.entity_type === 'distributor') return 'aggregator'
    if (entity.classification === 'CLIENT') return 'company'
    return 'artist' // default
  }

  const handleEntitySelect = async (entity: Entity) => {
    if (!entity?.display_name) return

    setIsCreating(true)
    try {
      const dealType = inferDealType(entity)
      const today = new Date().toISOString().split('T')[0]

      // Create distribution immediately with IN_NEGOTIATION status
      const distribution = await createDistribution.mutateAsync({
        entity: entity.id,
        deal_type: dealType,
        deal_status: 'in_negotiation',
        global_revenue_share_percentage: '20.00', // Default 20%
        signing_date: today,
        includes_dsps_youtube: true,
      })

      onOpenChange(false)
      // Navigate to the new distribution
      navigate(`/distributions/${distribution.id}`)
    } catch (error) {
      // Error handled by mutation
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false)
      // Reset state after animation
      setTimeout(() => {
        setSearchQuery('')
      }, 200)
    }
  }

  // Show recent entities when not searching
  const validRecentEntities = recentEntities.filter(entity => entity?.display_name)
  const showRecentEntities = !searchQuery && validRecentEntities.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            New Distribution Deal
          </DialogTitle>
          <DialogDescription className="text-base">
            Who is this distribution deal with?
          </DialogDescription>
        </DialogHeader>

        {/* Creating Overlay */}
        {isCreating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Creating distribution...</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
              autoFocus
            />
          </div>

          {/* Recent Entities Section */}
          {showRecentEntities && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                <TrendingUp className="h-3 w-3" />
                Recent Partners
              </div>
              <div className="flex flex-wrap gap-2">
                {validRecentEntities.map((entity) => (
                  <Button
                    key={entity.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 gap-2 hover:bg-primary/10 hover:border-primary/50"
                    onClick={() => handleEntitySelect(entity)}
                    disabled={isCreating}
                  >
                    {entity.image_url ? (
                      <img
                        src={entity.image_url}
                        alt={entity.display_name}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 flex items-center justify-center">
                        <span className="text-[8px] font-semibold">
                          {entity.display_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    {entity.display_name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Entity List */}
          <div className="space-y-2">
            {searchQuery && (
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Search Results
              </div>
            )}
            {!searchQuery && !showRecentEntities && (
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                All Entities
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
                  <p>No entities found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                entities.map((entity) => {
                  const inferredType = inferDealType(entity)
                  const typeConfig = DEAL_TYPE_CONFIG[inferredType]

                  return (
                    <Card
                      key={entity.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group",
                        "border-transparent bg-muted/30 hover:bg-muted/50"
                      )}
                      onClick={() => handleEntitySelect(entity)}
                    >
                      <div className="flex items-center gap-3">
                        {entity.image_url ? (
                          <img
                            src={entity.image_url}
                            alt={entity.display_name || 'Entity'}
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn('text-[10px] h-5', typeConfig.bgColor, typeConfig.color)}>
                              {typeConfig.emoji} {typeConfig.label}
                            </Badge>
                            {entity.email && (
                              <span className="text-xs text-muted-foreground truncate">
                                {entity.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Select an entity to create a new distribution deal. You can add catalog items and details after.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
