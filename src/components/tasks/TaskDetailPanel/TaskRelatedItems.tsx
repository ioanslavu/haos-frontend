import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { SongSearchCombobox } from '@/components/songs'
import { CampaignSearchCombobox } from '@/components/campaigns/CampaignSearchCombobox'
import { DistributionSearchCombobox } from '@/components/distributions/DistributionSearchCombobox'
import { useEntity } from '@/api/hooks/useEntities'
import { useCampaign, useSubCampaigns } from '@/api/hooks/useCampaigns'
import { useDistribution } from '@/api/hooks/useDistributions'
import { useSong } from '@/api/hooks/useSongs'
import { useLinkTaskToDomain, useUnlinkTaskFromDomain } from '@/api/hooks/useTasks'
import { useAuthStore } from '@/stores/authStore'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import { PLATFORM_CONFIG } from '@/types/campaign'
import {
  Link as LinkIcon,
  Plus,
  Users,
  Building2,
  Music,
  Briefcase,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskRelatedItemsProps } from './types'

export function TaskRelatedItems({
  task,
  createdTaskId,
  isCreateMode,
  localArtist,
  setLocalArtist,
  localClient,
  setLocalClient,
  localEntity,
  setLocalEntity,
  localSong,
  setLocalSong,
  localCampaign,
  setLocalCampaign,
  localSubcampaign,
  setLocalSubcampaign,
  localDistribution,
  setLocalDistribution,
  showArtistSearch,
  setShowArtistSearch,
  showClientSearch,
  setShowClientSearch,
  showSongSearch,
  setShowSongSearch,
  showCampaignSearch,
  setShowCampaignSearch,
  showDistributionSearch,
  setShowDistributionSearch,
  showAddRelatedItemMenu,
  setShowAddRelatedItemMenu,
  visibleRelatedFields,
  setVisibleRelatedFields,
  setShowAddArtistModal,
  setShowAddClientModal,
  setShowCreateSongDialog,
  setShowCreateCampaignDialog,
  onUpdateField,
  onOpenChange,
}: TaskRelatedItemsProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const linkToDomain = useLinkTaskToDomain()
  const unlinkFromDomain = useUnlinkTaskFromDomain()

  // Computed IDs
  const effectiveCampaignId = localCampaign
    || (task?.domain_info?.domain_type === 'campaign' ? task.domain_info.entity_id : null)
    || task?.campaign
    || null

  const effectiveSubcampaignId = localSubcampaign
    || (task?.domain_info?.domain_type === 'campaign' ? task.domain_info.extra?.subcampaign?.id : null)
    || null

  const effectiveDistributionId = localDistribution
    || (task?.domain_info?.domain_type === 'distribution' ? task.domain_info.entity_id : null)
    || null

  // Data fetching
  const { data: selectedArtistData } = useEntity(localArtist || 0, !!localArtist && !task?.entity_detail)
  const { data: selectedClientData } = useEntity(localClient || 0, !!localClient && !task?.entity_detail)
  const { data: selectedSongData } = useSong(localSong || 0, !!localSong && !task?.song_detail)
  const { data: selectedCampaignData } = useCampaign(effectiveCampaignId || 0, !!effectiveCampaignId)
  const { data: subcampaignsData } = useSubCampaigns(effectiveCampaignId || 0, undefined, !!effectiveCampaignId)
  const subcampaigns = subcampaignsData?.results || []
  const { data: selectedDistributionData } = useDistribution(effectiveDistributionId || 0, !!effectiveDistributionId)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          Related Items
        </h4>
        <DropdownMenu open={showAddRelatedItemMenu} onOpenChange={setShowAddRelatedItemMenu}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Plus className="h-3 w-3 mr-1" />Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!visibleRelatedFields.has('artist') && !localArtist && !localClient && (
              <DropdownMenuItem onClick={() => { setVisibleRelatedFields(new Set([...visibleRelatedFields, 'artist'])); setShowArtistSearch(true); setShowAddRelatedItemMenu(false); }}>
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />Artist
              </DropdownMenuItem>
            )}
            {!visibleRelatedFields.has('client') && !localClient && !localArtist && (
              <DropdownMenuItem onClick={() => { setVisibleRelatedFields(new Set([...visibleRelatedFields, 'client'])); setShowClientSearch(true); setShowAddRelatedItemMenu(false); }}>
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />Client
              </DropdownMenuItem>
            )}
            {!visibleRelatedFields.has('song') && !localSong && (
              <DropdownMenuItem onClick={() => { setVisibleRelatedFields(new Set([...visibleRelatedFields, 'song'])); setShowSongSearch(true); setShowAddRelatedItemMenu(false); }}>
                <Music className="h-4 w-4 mr-2 text-muted-foreground" />Song
              </DropdownMenuItem>
            )}
            {!visibleRelatedFields.has('campaign') && !effectiveCampaignId && !(user?.department?.name?.toLowerCase() === 'marketing' || (user?.department as any)?.toLowerCase?.() === 'marketing') && (
              <DropdownMenuItem onClick={() => { setVisibleRelatedFields(new Set([...visibleRelatedFields, 'campaign'])); setShowCampaignSearch(true); setShowAddRelatedItemMenu(false); }}>
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />Campaign
              </DropdownMenuItem>
            )}
            {!visibleRelatedFields.has('distribution') && !effectiveDistributionId && (
              <DropdownMenuItem onClick={() => { setVisibleRelatedFields(new Set([...visibleRelatedFields, 'distribution'])); setShowDistributionSearch(true); setShowAddRelatedItemMenu(false); }}>
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />Distribution
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Artist */}
      {(visibleRelatedFields.has('artist') || localArtist) && (
        <RelatedItemSection
          label="Artist"
          showSearch={showArtistSearch && !localArtist && !localClient}
          searchComponent={
            <EntitySearchCombobox
              value={localArtist}
              onValueChange={async (entityId) => {
                if (entityId) {
                  setLocalArtist(entityId); setLocalEntity(entityId); setLocalClient(null); setShowArtistSearch(false)
                  if (!isCreateMode && (task || createdTaskId)) await onUpdateField('entity', entityId)
                }
              }}
              filter={{ classification: 'CREATIVE', entity_type: 'artist' }}
              allowAddEntity={true}
              onCreateNew={() => setShowAddArtistModal(true)}
              placeholder="Search artists..."
            />
          }
          onCancelSearch={() => { setShowArtistSearch(false); const newFields = new Set(visibleRelatedFields); newFields.delete('artist'); setVisibleRelatedFields(newFields) }}
          displayComponent={
            (localArtist && (task?.entity_detail || selectedArtistData)) && (
              <RelatedItemDisplay
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                title={(task?.entity_detail?.display_name || selectedArtistData?.display_name) ?? ''}
                onClick={() => { if (task?.entity) { navigate(`/entities/${task.entity}`); onOpenChange(false) } }}
                onRemove={async () => { setLocalArtist(null); setLocalEntity(null); if (!isCreateMode && (task || createdTaskId)) await onUpdateField('entity', null) }}
                showNavigation={!!task?.entity_detail}
              />
            )
          }
        />
      )}

      {/* Client */}
      {(visibleRelatedFields.has('client') || localClient) && (
        <RelatedItemSection
          label="Client"
          showSearch={showClientSearch && !localClient && !localArtist}
          searchComponent={
            <EntitySearchCombobox
              value={localClient}
              onValueChange={async (entityId) => {
                if (entityId) {
                  setLocalClient(entityId); setLocalEntity(entityId); setLocalArtist(null); setShowClientSearch(false)
                  if (!isCreateMode && (task || createdTaskId)) await onUpdateField('entity', entityId)
                }
              }}
              filter={{ classification: 'CLIENT' }}
              allowAddEntity={true}
              onCreateNew={() => setShowAddClientModal(true)}
              placeholder="Search clients..."
            />
          }
          onCancelSearch={() => { setShowClientSearch(false); const newFields = new Set(visibleRelatedFields); newFields.delete('client'); setVisibleRelatedFields(newFields) }}
          displayComponent={
            (localClient && (task?.entity_detail || selectedClientData)) && (
              <RelatedItemDisplay
                icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                title={(task?.entity_detail?.display_name || selectedClientData?.display_name) ?? ''}
                onClick={() => { if (task?.entity) { navigate(`/entities/${task.entity}`); onOpenChange(false) } }}
                onRemove={async () => { setLocalClient(null); setLocalEntity(null); if (!isCreateMode && (task || createdTaskId)) await onUpdateField('entity', null) }}
                showNavigation={!!task?.entity_detail}
              />
            )
          }
        />
      )}

      {/* Song */}
      {(visibleRelatedFields.has('song') || localSong) && (
        <RelatedItemSection
          label="Song"
          showSearch={showSongSearch && !localSong}
          searchComponent={
            <SongSearchCombobox
              value={localSong}
              onValueChange={async (songId) => {
                if (songId) {
                  setLocalSong(songId); setShowSongSearch(false)
                  if (!isCreateMode && (task || createdTaskId)) await onUpdateField('song', songId)
                }
              }}
              onCreateNew={() => setShowCreateSongDialog(true)}
            />
          }
          onCancelSearch={() => { setShowSongSearch(false); const newFields = new Set(visibleRelatedFields); newFields.delete('song'); setVisibleRelatedFields(newFields) }}
          displayComponent={
            (task?.song_detail || (localSong && selectedSongData)) && (
              <RelatedItemDisplay
                icon={<Music className="h-4 w-4 text-muted-foreground" />}
                title={task?.song_detail?.title || selectedSongData?.title || ''}
                subtitle={task?.song_detail?.artist?.display_name || selectedSongData?.artist?.display_name}
                onClick={() => { if (task?.song) { navigate(`/songs/${task.song}`); onOpenChange(false) } }}
                onRemove={async () => { setLocalSong(null); if (!isCreateMode && (task || createdTaskId)) await onUpdateField('song', null) }}
                showNavigation={!!task?.song_detail}
              />
            )
          }
        />
      )}

      {/* Campaign */}
      {(visibleRelatedFields.has('campaign') || effectiveCampaignId) && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Campaign</span>
          {showCampaignSearch && !effectiveCampaignId && (
            <div className="space-y-2">
              <CampaignSearchCombobox
                value={localCampaign}
                onValueChange={async (campaignId) => {
                  if (campaignId) {
                    setLocalCampaign(campaignId); setShowCampaignSearch(false)
                    const taskId = task?.id || createdTaskId
                    if (!isCreateMode && taskId) {
                      await linkToDomain.mutateAsync({ taskId, domainType: 'campaign', entityId: campaignId })
                    }
                  }
                }}
                onCreateNew={() => setShowCreateCampaignDialog(true)}
              />
              <Button variant="ghost" size="sm" onClick={() => { setShowCampaignSearch(false); const newFields = new Set(visibleRelatedFields); newFields.delete('campaign'); setVisibleRelatedFields(newFields) }} className="h-7 px-2 text-xs">Cancel</Button>
            </div>
          )}
          {effectiveCampaignId && selectedCampaignData && (
            <div className="space-y-2">
              <button
                onClick={() => { navigate(`/campaigns/${effectiveCampaignId}`); onOpenChange(false) }}
                className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left group relative"
              >
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedCampaignData.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">{selectedCampaignData.status_display || selectedCampaignData.status}</Badge>
                    {effectiveSubcampaignId && (() => {
                      const sc = subcampaigns.find(s => s.id === effectiveSubcampaignId)
                      if (!sc) return null
                      const PlatformIcon = PLATFORM_ICONS[sc.platform]
                      const colorClass = PLATFORM_TEXT_COLORS[sc.platform]
                      return (
                        <Badge variant="secondary" className="text-xs gap-1">
                          {PlatformIcon && <PlatformIcon className={cn("h-3 w-3", colorClass)} />}
                          {PLATFORM_CONFIG[sc.platform]?.label || sc.platform}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
                <button
                  onClick={async (e) => {
                    e.stopPropagation(); setLocalCampaign(null); setLocalSubcampaign(null)
                    const taskId = task?.id || createdTaskId
                    if (!isCreateMode && taskId) await unlinkFromDomain.mutateAsync({ taskId, domainType: 'campaign' })
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {subcampaigns.length > 0 && (
                <div className="pl-6">
                  <p className="text-xs text-muted-foreground mb-1.5">Platform (optional)</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={async () => {
                        const prevSubcampaign = localSubcampaign || effectiveSubcampaignId
                        setLocalSubcampaign(null)
                        const taskId = task?.id || createdTaskId
                        if (!isCreateMode && taskId && prevSubcampaign) {
                          await linkToDomain.mutateAsync({ taskId, domainType: 'campaign', entityId: effectiveCampaignId })
                        }
                      }}
                      className={cn("px-2 py-1 rounded-md text-xs transition-colors", !effectiveSubcampaignId ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}
                    >None</button>
                    {subcampaigns.map((sc) => {
                      const PlatformIcon = PLATFORM_ICONS[sc.platform]
                      const colorClass = PLATFORM_TEXT_COLORS[sc.platform]
                      const isSelected = effectiveSubcampaignId === sc.id
                      return (
                        <button
                          key={sc.id}
                          onClick={async () => {
                            setLocalSubcampaign(sc.id)
                            const taskId = task?.id || createdTaskId
                            if (!isCreateMode && taskId) {
                              await linkToDomain.mutateAsync({ taskId, domainType: 'campaign', entityId: effectiveCampaignId, extra: { subcampaign_id: sc.id } })
                            }
                          }}
                          className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors", isSelected ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}
                        >
                          {PlatformIcon && <PlatformIcon className={cn("h-3 w-3", isSelected ? "" : colorClass)} />}
                          {PLATFORM_CONFIG[sc.platform]?.label || sc.platform}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Distribution */}
      {(visibleRelatedFields.has('distribution') || effectiveDistributionId) && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Distribution</span>
          {showDistributionSearch && !effectiveDistributionId && (
            <div className="space-y-2">
              <DistributionSearchCombobox
                value={localDistribution}
                onValueChange={async (distributionId) => {
                  if (distributionId) {
                    setLocalDistribution(distributionId); setShowDistributionSearch(false)
                    const taskId = task?.id || createdTaskId
                    if (!isCreateMode && taskId) {
                      await linkToDomain.mutateAsync({ taskId, domainType: 'distribution', entityId: distributionId })
                    }
                  }
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => { setShowDistributionSearch(false); const newFields = new Set(visibleRelatedFields); newFields.delete('distribution'); setVisibleRelatedFields(newFields) }} className="h-7 px-2 text-xs">Cancel</Button>
            </div>
          )}
          {effectiveDistributionId && selectedDistributionData && (
            <button
              onClick={() => { navigate(`/distributions/${effectiveDistributionId}`); onOpenChange(false) }}
              className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left group relative"
            >
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedDistributionData.entity?.display_name || `Distribution #${selectedDistributionData.id}`}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">{selectedDistributionData.deal_status_display || selectedDistributionData.deal_status}</Badge>
                  <Badge variant="secondary" className="text-xs">{selectedDistributionData.deal_type_display || selectedDistributionData.deal_type}</Badge>
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation(); setLocalDistribution(null)
                  const taskId = task?.id || createdTaskId
                  if (!isCreateMode && taskId) await unlinkFromDomain.mutateAsync({ taskId, domainType: 'distribution' })
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
              >
                <X className="h-3 w-3 text-destructive" />
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Existing Read-only Items */}
      {task && (task.opportunity_detail || task.contract_detail) && (
        <div className="space-y-2">
          {task.opportunity_detail && (
            <button onClick={() => { navigate(`/sales/opportunities/${task.opportunity}`); onOpenChange(false) }} className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left">
              <span className="text-sm font-medium">Opportunity:</span>
              <span className="text-sm">{task.opportunity_detail.title}</span>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </button>
          )}
          {task.contract_detail && (
            <button onClick={() => { navigate(`/contracts/${task.contract}`); onOpenChange(false) }} className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer w-full text-left">
              <span className="text-sm font-medium">Contract:</span>
              <span className="text-sm">{task.contract_detail.title}</span>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Helper components
function RelatedItemSection({ label, showSearch, searchComponent, onCancelSearch, displayComponent }: {
  label: string
  showSearch: boolean
  searchComponent: React.ReactNode
  onCancelSearch: () => void
  displayComponent: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      {showSearch && (
        <div className="space-y-2">
          {searchComponent}
          <Button variant="ghost" size="sm" onClick={onCancelSearch} className="h-7 px-2 text-xs">Cancel</Button>
        </div>
      )}
      {displayComponent}
    </div>
  )
}

function RelatedItemDisplay({ icon, title, subtitle, onClick, onRemove, showNavigation }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  onClick: () => void
  onRemove: () => Promise<void>
  showNavigation: boolean
}) {
  return (
    <button
      onClick={showNavigation ? onClick : undefined}
      className={cn("flex items-center gap-2 p-2 rounded-lg bg-accent/50 transition-colors w-full text-left group relative", showNavigation && "hover:bg-accent cursor-pointer")}
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <button onClick={async (e) => { e.stopPropagation(); await onRemove() }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded">
        <X className="h-3 w-3 text-destructive" />
      </button>
      {showNavigation && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  )
}
