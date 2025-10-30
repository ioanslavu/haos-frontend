import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Building2, User, Filter, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEntities } from '@/api/hooks/useEntities';
import { EntityFormDialog } from './crm/components/EntityFormDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { NoClientsEmptyState, NoSearchResultsEmptyState } from '@/components/ui/empty-states-presets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Creative roles
const creativeRoles = [
  { value: 'artist', label: 'Artists', icon: User },
  { value: 'producer', label: 'Producers', icon: User },
  { value: 'composer', label: 'Composers', icon: User },
  { value: 'lyricist', label: 'Lyricists', icon: User },
  { value: 'audio_editor', label: 'Audio Editors', icon: User },
];

// Business roles
const businessRoles = [
  { value: 'label', label: 'Label', icon: Building2 },
  { value: 'booking', label: 'Booking', icon: Building2 },
  { value: 'endorsements', label: 'Endorsements', icon: Building2 },
  { value: 'publishing', label: 'Publishing', icon: Building2 },
  { value: 'productie', label: 'Productie', icon: Building2 },
  { value: 'new_business', label: 'New Business', icon: Building2 },
  { value: 'digital', label: 'Digital', icon: Building2 },
];

const allRoles = [
  { value: 'all', label: 'All', icon: Users },
  ...creativeRoles,
  ...businessRoles,
];

export default function Entities() {
  const { role: urlRole } = useParams<{ role?: string }>();
  const navigate = useNavigate();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<'all' | 'PF' | 'PJ'>('all');
  const [selectedRole, setSelectedRole] = useState<string>('artist');

  // Set role filter based on URL parameter
  useEffect(() => {
    if (urlRole) {
      // Map URL slugs to role values
      const roleMap: Record<string, string> = {
        artists: 'artist',
        producers: 'producer',
        composers: 'composer',
        lyricists: 'lyricist',
        audio_editors: 'audio_editor',
        label: 'label',
        booking: 'booking',
        endorsements: 'endorsements',
        publishing: 'publishing',
        productie: 'productie',
        new_business: 'new_business',
        digital: 'digital',
      };
      setRoleFilter(roleMap[urlRole] || 'all');
    } else {
      setRoleFilter('all');
    }
  }, [urlRole]);

  // Fetch entities based on role filter
  const { data: entitiesData, isLoading } = useEntities(
    roleFilter === 'all' ? {} : { has_role: roleFilter }
  );
  const entities = entitiesData?.results || [];

  // Filter entities based on search and kind
  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      const matchesSearch =
        !searchQuery ||
        entity.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesKind = kindFilter === 'all' || entity.kind === kindFilter;

      return matchesSearch && matchesKind;
    });
  }, [entities, searchQuery, kindFilter]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateEntity = () => {
    setSelectedRole(roleFilter === 'all' ? 'artist' : roleFilter);
    setFormDialogOpen(true);
  };

  // Group entities by role for statistics
  const roleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    entities.forEach((entity) => {
      if (entity.roles) {
        entity.roles.forEach((role) => {
          stats[role] = (stats[role] || 0) + 1;
        });
      }
    });
    return stats;
  }, [entities]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entity Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all people and organizations in your system
            </p>
          </div>
          <Button onClick={handleCreateEntity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Physical Persons</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entities.filter(e => e.kind === 'PF').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Legal Entities</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entities.filter(e => e.kind === 'PJ').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
              <Badge variant="outline">Total</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(roleStats).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Select value={kindFilter} onValueChange={(value: any) => setKindFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PF">Physical Persons</SelectItem>
                <SelectItem value="PJ">Legal Entities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Role Tabs */}
        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="space-y-4">
          <div className="space-y-2">
            {/* All Tab */}
            <TabsList className="w-auto">
              <TabsTrigger value="all">
                <Users className="h-4 w-4 mr-2" />
                All Entities
              </TabsTrigger>
            </TabsList>

            {/* Creative Roles */}
            <div>
              <p className="text-sm text-muted-foreground mb-2 px-1">Creative Roles</p>
              <TabsList className="grid w-auto grid-cols-5 gap-1">
                {creativeRoles.map((role) => (
                  <TabsTrigger key={role.value} value={role.value}>
                    {role.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Business Roles */}
            <div>
              <p className="text-sm text-muted-foreground mb-2 px-1">Business Roles</p>
              <TabsList className="grid w-auto grid-cols-4 lg:grid-cols-8 gap-1">
                {businessRoles.map((role) => (
                  <TabsTrigger key={role.value} value={role.value}>
                    {role.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Content for each tab */}
          {allRoles.map((role) => (
            <TabsContent key={role.value} value={role.value} className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="hover-lift">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredEntities.length === 0 ? (
                searchQuery || kindFilter !== 'all' ? (
                  <NoSearchResultsEmptyState
                    searchQuery={searchQuery}
                    onClearSearch={() => {
                      setSearchQuery('');
                      setKindFilter('all');
                    }}
                  />
                ) : (
                  <NoClientsEmptyState
                    title={`No ${role.label.toLowerCase()} yet`}
                    description={`Add your first ${role.label.slice(0, -1).toLowerCase()} to start managing ${role.value === 'all' ? 'entities' : role.label.toLowerCase()}.`}
                    icon={role.icon}
                    onPrimaryAction={handleCreateEntity}
                    tips={[
                      'Entities can have multiple roles',
                      'Track all contacts and relationships',
                      'Link entities to contracts and projects',
                    ]}
                  />
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredEntities.map((entity) => (
                    <Card
                      key={entity.id}
                      className="hover-lift transition-smooth cursor-pointer"
                      onClick={() => navigate(`/entity/${entity.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={`https://avatar.vercel.sh/${entity.display_name}`}
                              />
                              <AvatarFallback>
                                {getInitials(entity.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {entity.display_name}
                                {entity.stage_name && (
                                  <span className="text-muted-foreground font-normal ml-2">
                                    aka "{entity.stage_name}"
                                  </span>
                                )}
                              </h4>
                              {entity.kind === 'PJ' ? (
                                <Badge variant="outline" className="mt-1">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  Company
                                </Badge>
                              ) : (
                                <div className="flex gap-1 mt-1">
                                  {entity.roles?.map((r) => (
                                    <Badge key={r} variant="secondary" className="text-xs">
                                      {r}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {entity.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{entity.email}</span>
                            </div>
                          )}
                          {entity.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{entity.phone}</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground pt-2">
                            Added {format(new Date(entity.created_at), 'PP')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Dialogs */}
        <EntityFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          role={selectedRole}
        />
      </div>
    </AppLayout>
  );
}