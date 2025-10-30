import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, LayoutGrid, LayoutList, Building2, User, Package, Music, Target, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  NoCampaignsEmptyState,
  NoClientsEmptyState,
  NoSearchResultsEmptyState,
} from '@/components/ui/empty-states-presets';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEntities } from '@/api/hooks/useEntities';
import { useCampaigns, useDeleteCampaign, useUpdateCampaign, useCampaignStats } from '@/api/hooks/useCampaigns';
import { EntityFormDialog } from './crm/components/EntityFormDialog';
import { EntityDetailsSheet } from './crm/components/EntityDetailsSheet';
import { CampaignDetailsSheet } from './crm/components/CampaignDetailsSheet';
import { ShadcnCampaignKanban } from './crm/components/ShadcnCampaignKanban';
import { CampaignTableView } from './crm/components/CampaignTableView';
import { BrandAnalytics } from './crm/components/BrandAnalytics';
import { ArtistAnalytics } from './crm/components/ArtistAnalytics';
import { EnhancedClientAnalytics } from './crm/components/EnhancedClientAnalytics';
import { Campaign, CampaignStatus, CAMPAIGN_STATUS_LABELS } from '@/types/campaign';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CRM() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get tab and ID from URL
  const tabFromUrl = (searchParams.get('tab') || 'campaigns') as 'clients' | 'campaigns' | 'brands' | 'artists';
  const clientIdFromUrl = searchParams.get('clientId') ? Number(searchParams.get('clientId')) : null;
  const brandIdFromUrl = searchParams.get('brandId') ? Number(searchParams.get('brandId')) : null;
  const artistIdFromUrl = searchParams.get('artistId') ? Number(searchParams.get('artistId')) : null;

  const [activeTab, setActiveTab] = useState<'clients' | 'campaigns' | 'brands' | 'artists'>(tabFromUrl);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(brandIdFromUrl);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(clientIdFromUrl);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(artistIdFromUrl);

  // Sync state with URL
  useEffect(() => {
    setActiveTab(tabFromUrl);
    setSelectedClientId(clientIdFromUrl);
    setSelectedBrandId(brandIdFromUrl);
    setSelectedArtistId(artistIdFromUrl);
  }, [tabFromUrl, clientIdFromUrl, brandIdFromUrl, artistIdFromUrl]);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [campaignDetailsId, setCampaignDetailsId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Campaign filters and view mode
  const [campaignViewMode, setCampaignViewMode] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch data
  const { data: clientsData, isLoading: clientsLoading } = useEntities({ has_role: 'client' });
  const clients = clientsData?.results || [];

  const { data: brandsData, isLoading: brandsLoading } = useEntities({ has_role: 'brand' });
  const brands = brandsData?.results || [];

  const { data: artistsData, isLoading: artistsLoading } = useEntities({ has_role: 'artist' });
  const artists = artistsData?.results || [];

  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns();
  const campaigns = campaignsData?.results || [];

  const { data: campaignStats } = useCampaignStats();

  const deleteCampaign = useDeleteCampaign();
  const updateCampaign = useUpdateCampaign();

  // Filtered data
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      return (
        !searchQuery ||
        client.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [clients, searchQuery]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !searchQuery ||
        campaign.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.client.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.artist.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.brand.display_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, statusFilter]);

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      return (
        !searchQuery ||
        brand.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [brands, searchQuery]);

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => {
      return (
        !searchQuery ||
        artist.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [artists, searchQuery]);

  // Handlers
  const handleEditCampaign = (campaign: Campaign) => {
    navigate(`/crm/campaigns/${campaign.id}/edit`);
  };

  const handleDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      toast.success('Campaign deleted successfully');
      setCampaignToDelete(null);
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: CampaignStatus) => {
    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        data: { status: newStatus },
      });
      toast.success('Campaign status updated');
    } catch (error) {
      toast.error('Failed to update campaign status');
    }
  };

  const handleNewCampaign = () => {
    navigate('/crm/campaigns/create');
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setCampaignDetailsId(campaign.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                CRM
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage campaigns, clients, artists, and brands
              </p>
            </div>
            <Button
              onClick={() => {
                if (activeTab === 'campaigns') handleNewCampaign();
                else setFormDialogOpen(true);
              }}
              size="lg"
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              New {activeTab === 'campaigns' ? 'Campaign' : activeTab === 'clients' ? 'Client' : activeTab === 'artists' ? 'Artist' : 'Brand'}
            </Button>
          </div>
        </div>

        {/* Modern iOS-style Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as any);
          setSearchQuery('');
          navigate(`/crm?tab=${v}`);
        }}>
          <TabsList className="grid w-full grid-cols-4 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-14 shadow-lg">
            <TabsTrigger
              value="campaigns"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="clients"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Clients
            </TabsTrigger>
            <TabsTrigger
              value="artists"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Artists
            </TabsTrigger>
            <TabsTrigger
              value="brands"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              Brands
            </TabsTrigger>
          </TabsList>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="space-y-6 mt-8">
            {/* Glassmorphic Stats Cards */}
            {campaignStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden rounded-2xl border-white/20 dark:border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent" />
                  <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
                    <div className="p-2 rounded-xl bg-blue-500/20 backdrop-blur-sm">
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {campaignStats.total_campaigns}
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden rounded-2xl border-white/20 dark:border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent" />
                  <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                    <div className="p-2 rounded-xl bg-emerald-500/20 backdrop-blur-sm">
                      <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      ${parseFloat(campaignStats.total_value).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {Object.entries(campaignStats.by_status).slice(0, 2).map(([status, count], idx) => {
                  const gradients = [
                    { from: 'from-orange-500/10', to: 'to-red-500/10', text: 'from-orange-600 to-red-600', bg: 'bg-orange-500/20', icon: 'text-orange-600 dark:text-orange-400', accent: 'from-orange-400/20' },
                    { from: 'from-pink-500/10', to: 'to-purple-500/10', text: 'from-pink-600 to-purple-600', bg: 'bg-pink-500/20', icon: 'text-pink-600 dark:text-pink-400', accent: 'from-pink-400/20' }
                  ];
                  const gradient = gradients[idx];

                  return (
                    <Card key={status} className={cn("relative overflow-hidden rounded-2xl border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br", gradient.from, gradient.to)}>
                      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent", gradient.accent)} />
                      <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {CAMPAIGN_STATUS_LABELS[status as CampaignStatus]}
                        </CardTitle>
                        <div className={cn("p-2 rounded-xl backdrop-blur-sm", gradient.bg)}>
                          <TrendingUp className={cn("h-4 w-4", gradient.icon)} />
                        </div>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className={cn("text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent", gradient.text)}>
                          {count as number}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Modern Glassmorphic Filters */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  className="pl-12 h-12 rounded-xl bg-background/50 border-white/10 focus:border-blue-500/50 transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px] h-12 rounded-xl bg-background/50 border-white/10">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2 p-1.5 rounded-xl bg-muted/50 backdrop-blur-sm border border-white/10">
                <Button
                  variant={campaignViewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCampaignViewMode('kanban')}
                  className={cn(
                    "h-9 px-4 rounded-lg transition-all duration-300",
                    campaignViewMode === 'kanban'
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "hover:bg-background/50"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={campaignViewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCampaignViewMode('table')}
                  className={cn(
                    "h-9 px-4 rounded-lg transition-all duration-300",
                    campaignViewMode === 'table'
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "hover:bg-background/50"
                  )}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Campaigns View */}
            {campaignsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              searchQuery || statusFilter !== 'all' ? (
                <NoSearchResultsEmptyState
                  searchQuery={searchQuery}
                  onClearSearch={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                />
              ) : (
                <NoCampaignsEmptyState onPrimaryAction={handleNewCampaign} />
              )
            ) : campaignViewMode === 'kanban' ? (
              <ShadcnCampaignKanban
                campaigns={filteredCampaigns}
                onEdit={handleEditCampaign}
                onDelete={handleDeleteCampaign}
                onStatusChange={handleStatusChange}
                onClick={handleCampaignClick}
              />
            ) : (
              <CampaignTableView
                campaigns={filteredCampaigns}
                onEdit={handleEditCampaign}
                onDelete={handleDeleteCampaign}
                onClick={handleCampaignClick}
              />
            )}
          </TabsContent>

          {/* CLIENTS TAB */}
          <TabsContent value="clients" className="space-y-6 mt-6">
            {selectedClientId ? (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedClientId(null);
                    navigate('/crm?tab=clients');
                  }}
                  className="mb-4"
                >
                  ← Back to Clients
                </Button>
                <EnhancedClientAnalytics
                  clientId={selectedClientId}
                  onCampaignEdit={handleEditCampaign}
                  onCampaignDelete={handleDeleteCampaign}
                  onCampaignClick={handleCampaignClick}
                />
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {clientsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <Skeleton className="h-5 w-32 mt-2" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : filteredClients.length === 0 ? (
                  searchQuery ? (
                    <NoSearchResultsEmptyState
                      searchQuery={searchQuery}
                      onClearSearch={() => setSearchQuery('')}
                    />
                  ) : (
                    <NoClientsEmptyState onPrimaryAction={() => setFormDialogOpen(true)} />
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => (
                      <Card
                        key={client.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          navigate(`/crm?tab=clients&clientId=${client.id}`);
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/10 font-semibold">
                                {getInitials(client.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{client.display_name}</h3>
                              {client.kind === 'PJ' && (
                                <Badge variant="secondary" className="mt-1">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  Company
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {client.contact_persons && client.contact_persons.length > 0 && (
                          <CardContent>
                            <div className="text-sm text-muted-foreground">
                              <User className="h-3 w-3 inline mr-1" />
                              {client.contact_persons.length} contact{client.contact_persons.length > 1 ? 's' : ''}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ARTISTS TAB */}
          <TabsContent value="artists" className="space-y-6 mt-6">
            {selectedArtistId ? (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedArtistId(null);
                    navigate('/crm?tab=artists');
                  }}
                  className="mb-4"
                >
                  ← Back to Artists
                </Button>
                <ArtistAnalytics
                  artistId={selectedArtistId}
                  onCampaignEdit={handleEditCampaign}
                  onCampaignDelete={handleDeleteCampaign}
                  onCampaignClick={handleCampaignClick}
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search artists..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {artistsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-12 w-12 rounded-full" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : filteredArtists.length === 0 ? (
                  searchQuery ? (
                    <NoSearchResultsEmptyState
                      searchQuery={searchQuery}
                      onClearSearch={() => setSearchQuery('')}
                    />
                  ) : (
                    <NoClientsEmptyState
                      title="No artists yet"
                      description="Start building your artist roster"
                      onPrimaryAction={() => setFormDialogOpen(true)}
                    />
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredArtists.map((artist) => (
                      <Card
                        key={artist.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedArtistId(artist.id);
                          navigate(`/crm?tab=artists&artistId=${artist.id}`);
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/10 font-semibold">
                                {getInitials(artist.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{artist.display_name}</h3>
                              <Badge variant="secondary" className="mt-1">
                                <Music className="h-3 w-3 mr-1" />
                                Artist
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* BRANDS TAB */}
          <TabsContent value="brands" className="space-y-6 mt-6">
            {selectedBrandId ? (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBrandId(null);
                    navigate('/crm?tab=brands');
                  }}
                  className="mb-4"
                >
                  ← Back to Brands
                </Button>
                <BrandAnalytics
                  brandId={selectedBrandId}
                  onCampaignEdit={handleEditCampaign}
                  onCampaignDelete={handleDeleteCampaign}
                  onCampaignClick={handleCampaignClick}
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search brands..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {brandsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-12 w-12 rounded-full" />
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : filteredBrands.length === 0 ? (
                  searchQuery ? (
                    <NoSearchResultsEmptyState
                      searchQuery={searchQuery}
                      onClearSearch={() => setSearchQuery('')}
                    />
                  ) : (
                    <NoClientsEmptyState
                      title="No brands yet"
                      description="Start managing brand partnerships"
                      onPrimaryAction={() => setFormDialogOpen(true)}
                    />
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBrands.map((brand) => (
                      <Card
                        key={brand.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedBrandId(brand.id);
                          navigate(`/crm?tab=brands&brandId=${brand.id}`);
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/10 font-semibold">
                                {getInitials(brand.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{brand.display_name}</h3>
                              <Badge variant="secondary" className="mt-1">
                                <Package className="h-3 w-3 mr-1" />
                                Brand
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs and Sheets */}
        <EntityFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          role={activeTab === 'clients' ? 'client' : activeTab === 'artists' ? 'artist' : 'brand'}
        />

        <EntityDetailsSheet
          entityId={selectedEntityId}
          open={!!selectedEntityId}
          onOpenChange={(open) => !open && setSelectedEntityId(null)}
        />

        <CampaignDetailsSheet
          campaignId={campaignDetailsId}
          open={!!campaignDetailsId}
          onOpenChange={(open) => !open && setCampaignDetailsId(null)}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaign}
        />

        <AlertDialog open={!!campaignToDelete} onOpenChange={() => setCampaignToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{campaignToDelete?.campaign_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCampaign}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
