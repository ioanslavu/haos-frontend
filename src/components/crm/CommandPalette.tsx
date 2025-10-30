import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  User,
  Music,
  Package,
  Target,
  Plus,
  Search,
  TrendingUp,
  Settings,
  FileText,
} from 'lucide-react'
import { Campaign } from '@/types/campaign'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaigns?: Campaign[]
  clients?: any[]
  artists?: any[]
  brands?: any[]
  onNewCampaign?: () => void
  onNewClient?: () => void
  onNewArtist?: () => void
  onNewBrand?: () => void
  onCampaignSelect?: (campaign: Campaign) => void
  onClientSelect?: (client: any) => void
  onArtistSelect?: (artist: any) => void
  onBrandSelect?: (brand: any) => void
}

export function CommandPalette({
  open,
  onOpenChange,
  campaigns = [],
  clients = [],
  artists = [],
  brands = [],
  onNewCampaign,
  onNewClient,
  onNewArtist,
  onNewBrand,
  onCampaignSelect,
  onClientSelect,
  onArtistSelect,
  onBrandSelect,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const filteredCampaigns = useMemo(() => {
    if (!search) return campaigns.slice(0, 5)
    return campaigns
      .filter((c) =>
        c.campaign_name.toLowerCase().includes(search.toLowerCase()) ||
        c.client.display_name.toLowerCase().includes(search.toLowerCase()) ||
        c.artist.display_name.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 8)
  }, [campaigns, search])

  const filteredClients = useMemo(() => {
    if (!search) return clients.slice(0, 5)
    return clients
      .filter((c) => c.display_name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 8)
  }, [clients, search])

  const filteredArtists = useMemo(() => {
    if (!search) return artists.slice(0, 5)
    return artists
      .filter((a) => a.display_name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 8)
  }, [artists, search])

  const filteredBrands = useMemo(() => {
    if (!search) return brands.slice(0, 5)
    return brands
      .filter((b) => b.display_name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 8)
  }, [brands, search])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search campaigns, clients, artists, brands..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {onNewCampaign && (
            <CommandItem
              onSelect={() => {
                onNewCampaign()
                onOpenChange(false)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Campaign</span>
            </CommandItem>
          )}
          {onNewClient && (
            <CommandItem
              onSelect={() => {
                onNewClient()
                onOpenChange(false)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Client</span>
            </CommandItem>
          )}
          {onNewArtist && (
            <CommandItem
              onSelect={() => {
                onNewArtist()
                onOpenChange(false)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Artist</span>
            </CommandItem>
          )}
          {onNewBrand && (
            <CommandItem
              onSelect={() => {
                onNewBrand()
                onOpenChange(false)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Brand</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          <CommandItem
            onSelect={() => {
              navigate('/crm?tab=campaigns')
              onOpenChange(false)
            }}
          >
            <Target className="mr-2 h-4 w-4" />
            <span>Campaigns</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/crm?tab=clients')
              onOpenChange(false)
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Clients</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/crm?tab=artists')
              onOpenChange(false)
            }}
          >
            <Music className="mr-2 h-4 w-4" />
            <span>Artists</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/crm?tab=brands')
              onOpenChange(false)
            }}
          >
            <Package className="mr-2 h-4 w-4" />
            <span>Brands</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/dashboard')
              onOpenChange(false)
            }}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              navigate('/contracts')
              onOpenChange(false)
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Contracts</span>
          </CommandItem>
        </CommandGroup>

        {/* Campaigns */}
        {filteredCampaigns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Campaigns">
              {filteredCampaigns.map((campaign) => (
                <CommandItem
                  key={campaign.id}
                  value={`campaign-${campaign.id}-${campaign.campaign_name}`}
                  onSelect={() => {
                    onCampaignSelect?.(campaign)
                    onOpenChange(false)
                  }}
                >
                  <Target className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{campaign.campaign_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {campaign.client.display_name} · {campaign.artist.display_name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Clients */}
        {filteredClients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client-${client.id}-${client.display_name}`}
                  onSelect={() => {
                    onClientSelect?.(client)
                    onOpenChange(false)
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{client.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Artists */}
        {filteredArtists.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Artists">
              {filteredArtists.map((artist) => (
                <CommandItem
                  key={artist.id}
                  value={`artist-${artist.id}-${artist.display_name}`}
                  onSelect={() => {
                    onArtistSelect?.(artist)
                    onOpenChange(false)
                  }}
                >
                  <Music className="mr-2 h-4 w-4" />
                  <span>{artist.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Brands */}
        {filteredBrands.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Brands">
              {filteredBrands.map((brand) => (
                <CommandItem
                  key={brand.id}
                  value={`brand-${brand.id}-${brand.display_name}`}
                  onSelect={() => {
                    onBrandSelect?.(brand)
                    onOpenChange(false)
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  <span>{brand.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
