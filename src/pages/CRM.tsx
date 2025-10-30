import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, LayoutGrid, LayoutList, Loader2, Phone, Mail, Building2, Calendar, Package, DollarSign, User, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { CampaignFormDialog } from './crm/components/CampaignFormDialog';
import { CampaignDetailsSheet } from './crm/components/CampaignDetailsSheet';
import { ModernCampaignKanban } from './crm/components/ModernCampaignKanban';
import { CampaignTableView } from './crm/components/CampaignTableView';
import { BrandAnalytics } from './crm/components/BrandAnalytics';
import { ArtistAnalytics } from './crm/components/ArtistAnalytics';
import { ClientAnalytics } from './crm/components/ClientAnalytics';
import { Campaign, CampaignStatus, CAMPAIGN_STATUS_LABELS } from '@/types/campaign';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
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
    setSelectedCampaign(campaign);
    setCampaignFormOpen(true);
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
    setSelectedCampaign(null);
    setCampaignFormOpen(true);
  };

  const handleCloseCampaignForm = () => {
    setSelectedCampaign(null);
    setCampaignFormOpen(false);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">CRM</h1>
            <p className="text-muted-foreground">Manage clients, campaigns, and brands</p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'clients' && (
              <Button size="sm" onClick={() => setFormDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            )}
            {activeTab === 'campaigns' && (
              <Button size="sm" onClick={handleNewCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            )}
            {activeTab === 'brands' && (
              <Button size="sm" onClick={() => setFormDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Brand
              </Button>
            )}
            {activeTab === 'artists' && (
              <Button size="sm" onClick={() => setFormDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Artist
              </Button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as any);
          navigate(`/crm?tab=${v}`);
        }}>
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
          </TabsList>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="space-y-4">
            {/* Stats Cards */}
            {campaignStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{campaignStats.total_campaigns}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${parseFloat(campaignStats.total_value).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                {Object.entries(campaignStats.by_status).slice(0, 2).map(([status, count]) => (
                  <Card key={status}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {CAMPAIGN_STATUS_LABELS[status as CampaignStatus]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count as number}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Filters and View Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                <Button
                  variant={campaignViewMode === 'kanban' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setCampaignViewMode('kanban')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={campaignViewMode === 'table' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setCampaignViewMode('table')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Campaigns View */}
            {campaignsLoading ? (
              campaignViewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, colIndex) => (
                    <div key={colIndex} className="space-y-4">
                      {Array.from({ length: 2 }).map((_, cardIndex) => (
                        <Card key={cardIndex} className="hover-lift">
                          <CardHeader>
                            <Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
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
                <NoCampaignsEmptyState
                  onPrimaryAction={handleNewCampaign}
                />
              )
            ) : campaignViewMode === 'kanban' ? (
              <ModernCampaignKanban
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
          <TabsContent value="clients" className="space-y-4">
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
                <ClientAnalytics
                  clientId={selectedClientId}
                  onCampaignEdit={handleEditCampaign}
                  onCampaignDelete={handleDeleteCampaign}
                  onCampaignClick={handleCampaignClick}
                />
              </div>
            ) : (
              <>
                <div className="flex gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search clients..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {clientsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="hover-lift">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
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
                    <NoClientsEmptyState
                      onPrimaryAction={() => setFormDialogOpen(true)}
                    />
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                      <Card
                        key={client.id}
                        className="hover-lift transition-smooth cursor-pointer"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          navigate(`/crm?tab=clients&clientId=${client.id}`);
                        }}
                      >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={`https://avatar.vercel.sh/${client.display_name}`}
                            />
                            <AvatarFallback>{getInitials(client.display_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{client.display_name}</CardTitle>
                            {client.kind === 'PJ' && (
                              <CardDescription className="mt-1">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  <span>Company</span>
                                </div>
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{client.phone}</span>
                          </div>
                        )}
                        {client.contact_persons && client.contact_persons.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="font-medium">Contacts ({client.contact_persons.length})</span>
                            </div>
                            <div className="space-y-1.5">
                              {client.contact_persons.slice(0, 3).map((contact: any) => (
                                <div key={contact.id} className="text-xs">
                                  <div className="font-medium text-foreground">{contact.name}</div>
                                  {contact.emails && contact.emails.length > 0 && (
                                    <div className="text-muted-foreground truncate">
                                      {contact.emails[0].email}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {client.contact_persons.length > 3 && (
                                <div className="text-xs text-muted-foreground italic">
                                  +{client.contact_persons.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm pt-2 border-t">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">
                            Added {format(new Date(client.created_at), 'PP')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ARTISTS TAB */}
          <TabsContent value="artists" className="space-y-4">
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
                <div className="flex gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search artists..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {artistsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="hover-lift">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
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
                      description="Start building your artist roster by adding your first artist."
                      icon={Music}
                      primaryAction={{
                        label: 'Add First Artist',
                        onClick: () => setFormDialogOpen(true),
                      }}
                      tips={[
                        'Artists can be linked to campaigns for promotion tracking',
                        'Track artist performance and engagement',
                        'Manage artist contracts and agreements',
                      ]}
                    />
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArtists.map((artist) => (
                      <Card
                        key={artist.id}
                        className="hover-lift transition-smooth cursor-pointer"
                        onClick={() => {
                          setSelectedArtistId(artist.id);
                          navigate(`/crm?tab=artists&artistId=${artist.id}`);
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={`https://avatar.vercel.sh/${artist.display_name}`} />
                              <AvatarFallback>{getInitials(artist.display_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{artist.display_name}</CardTitle>
                              <CardDescription>
                                <Badge variant="secondary" icon={Music} size="sm">Artist</Badge>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            Click to view analytics
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* BRANDS TAB */}
          <TabsContent value="brands" className="space-y-4">
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
                <div className="flex gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search brands..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {brandsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="hover-lift">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
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
                      description="Start managing your brand partnerships by adding your first brand."
                      icon={Package}
                      primaryAction={{
                        label: 'Add First Brand',
                        onClick: () => setFormDialogOpen(true),
                      }}
                      tips={[
                        'Brands can be linked to sponsorship campaigns',
                        'Track brand partnerships and deals',
                        'Manage brand contracts and deliverables',
                      ]}
                    />
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBrands.map((brand) => (
                      <Card
                        key={brand.id}
                        className="hover-lift transition-smooth cursor-pointer"
                        onClick={() => {
                          setSelectedBrandId(brand.id);
                          navigate(`/crm?tab=brands&brandId=${brand.id}`);
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={`https://avatar.vercel.sh/${brand.display_name}`} />
                              <AvatarFallback>{getInitials(brand.display_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{brand.display_name}</CardTitle>
                              <CardDescription>
                                <Badge variant="secondary" icon={Package} size="sm">Brand</Badge>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            Click to view analytics
                          </div>
                        </CardContent>
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

        <CampaignFormDialog
          open={campaignFormOpen}
          onOpenChange={handleCloseCampaignForm}
          campaign={selectedCampaign}
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
                Are you sure you want to delete "{campaignToDelete?.campaign_name}"? This action
                cannot be undone.
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
