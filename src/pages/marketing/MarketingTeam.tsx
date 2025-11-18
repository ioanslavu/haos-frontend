import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Grid3x3, UserCircle, Loader2, Settings } from 'lucide-react';
import { useMarketingTeam, useAssignableArtists, useAssignments } from '@/api/hooks/useAssignments';
import { AssignArtistsDialog } from './components/AssignArtistsDialog';
import { TeamMember } from '@/api/types/assignments';

const MarketingTeam = () => {
  const [activeView, setActiveView] = useState<'members' | 'matrix' | 'artists'>('members');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Fetch data
  const { data: teamMembers, isLoading: isLoadingTeam, error: teamError } = useMarketingTeam();
  const { data: artists, isLoading: isLoadingArtists } = useAssignableArtists();
  const { data: allAssignments } = useAssignments();

  const isLoading = isLoadingTeam || isLoadingArtists;

  const handleManageAssignments = (member: TeamMember) => {
    setSelectedMember(member);
    setAssignDialogOpen(true);
  };

  // Get assignments for a specific member
  const getMemberAssignments = (memberId: number) => {
    return allAssignments?.filter(
      (assignment) => assignment.social_media_manager === memberId && assignment.is_active
    ) || [];
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage artist assignments for social media managers
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
            <TabsList>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members
              </TabsTrigger>
              <TabsTrigger value="matrix" className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                Assignment Matrix
              </TabsTrigger>
              <TabsTrigger value="artists" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Artists
              </TabsTrigger>
            </TabsList>

            {/* Team Members View */}
            <TabsContent value="members" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Team Members</CardTitle>
                  <CardDescription>
                    View and manage artist assignments for each team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers && teamMembers.length > 0 ? (
                      teamMembers.map((member) => {
                        const assignments = getMemberAssignments(member.id);
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {member.profile_picture ? (
                                <img
                                  src={member.profile_picture}
                                  alt={member.full_name}
                                  className="w-12 h-12 rounded-full"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {member.first_name?.[0]}{member.last_name?.[0]}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{member.full_name}</p>
                                {assignments.length > 0 ? (
                                  <div className="mt-1">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Managing {assignments.length} {assignments.length === 1 ? 'artist' : 'artists'}:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {assignments.map((assignment) => (
                                        <Badge key={assignment.id} variant="secondary" className="text-xs">
                                          {assignment.artist_detail.display_name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground mt-1">No artists assigned</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageAssignments(member)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Manage Creatives
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        {teamError ? (
                          <div>
                            <p className="text-destructive font-medium">Error loading team members</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {teamError instanceof Error ? teamError.message : 'Unknown error'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No team members found</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Matrix View */}
            <TabsContent value="matrix" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Matrix</CardTitle>
                  <CardDescription>
                    Overview of all assignments between team members and artists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teamMembers && artists && teamMembers.length > 0 && artists.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="border p-3 bg-muted text-left font-semibold sticky left-0 bg-background z-10">
                              Team Member
                            </th>
                            {artists.map((artist) => (
                              <th
                                key={artist.id}
                                className="border p-3 bg-muted text-center font-medium min-w-[120px]"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  {artist.profile_photo ? (
                                    <img
                                      src={artist.profile_photo}
                                      alt={artist.display_name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="text-xs">{artist.display_name}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {teamMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-muted/50">
                              <td className="border p-3 font-medium sticky left-0 bg-background">
                                <div className="flex items-center gap-2">
                                  {member.profile_picture ? (
                                    <img
                                      src={member.profile_picture}
                                      alt={member.full_name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-xs font-medium">
                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-sm">{member.full_name}</span>
                                </div>
                              </td>
                              {artists.map((artist) => {
                                const isAssigned = allAssignments?.some(
                                  (assignment) =>
                                    assignment.social_media_manager === member.id &&
                                    assignment.artist === artist.id &&
                                    assignment.is_active
                                );
                                return (
                                  <td key={artist.id} className="border p-3 text-center">
                                    <div className="flex items-center justify-center">
                                      {isAssigned ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                          <span className="text-white text-xs">✓</span>
                                        </div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-muted" />
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No data available for matrix view
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Artists View */}
            <TabsContent value="artists" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Internal Creatives</CardTitle>
                  <CardDescription>
                    View all internal creative people (artists, producers, lyricists) and their assigned social media managers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {artists && artists.length > 0 ? (
                      artists.map((artist) => {
                        const artistAssignments = allAssignments?.filter(
                          (assignment) => assignment.artist === artist.id && assignment.is_active
                        ) || [];
                        return (
                          <div
                            key={artist.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {artist.profile_photo ? (
                                <img
                                  src={artist.profile_photo}
                                  alt={artist.display_name}
                                  className="w-12 h-12 rounded-full"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{artist.display_name}</p>
                                  {artist.rate_tier && (
                                    <Badge variant="outline" className="text-xs">
                                      Tier {artist.rate_tier}
                                    </Badge>
                                  )}
                                </div>
                                {artist.stage_name && (
                                  <p className="text-sm text-muted-foreground">
                                    {artist.stage_name}
                                  </p>
                                )}
                                {artistAssignments.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {artistAssignments.slice(0, 3).map((assignment) => (
                                      <Badge key={assignment.id} variant="secondary" className="text-xs">
                                        {assignment.social_media_manager_detail.full_name}
                                      </Badge>
                                    ))}
                                    {artistAssignments.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{artistAssignments.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {artistAssignments.length} {artistAssignments.length === 1 ? 'manager' : 'managers'}
                                </p>
                                <p className="text-xs text-muted-foreground">assigned</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No internal creative people found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Assignment Dialog */}
        <AssignArtistsDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          member={selectedMember}
        />
      </div>
    </AppLayout>
  );
};

export default MarketingTeam;
