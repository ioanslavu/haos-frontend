import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, ExternalLink, AlertCircle, CheckCircle2, Clock, TrendingUp, Disc3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ReleaseDetailsCard } from './ReleaseDetailsCard';
import { PlatformDistributionList } from './PlatformDistributionList';
import { PublicationStatusTimeline } from './PublicationStatusTimeline';
import { EditReleaseDialog } from './EditReleaseDialog';
import { AddPlatformDialog } from './AddPlatformDialog';
import { EditPublicationDialog } from './EditPublicationDialog';
import { DistributionChecklist } from './DistributionChecklist';
import { LinkReleaseDialog } from './LinkReleaseDialog';
import apiClient from '@/api/client';
import { fetchReleasePublications } from '@/api/songApi';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Publication, ReleaseDetails } from '@/types/song';
import { format, addDays } from 'date-fns';

interface ReleaseTabProps {
  songId: number;
  releaseId?: number;
  onCreateRelease?: () => void;
}

export function ReleaseTab({ songId, releaseId, onCreateRelease }: ReleaseTabProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditReleaseDialog, setShowEditReleaseDialog] = useState(false);
  const [showAddPlatformDialog, setShowAddPlatformDialog] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [showLinkReleaseDialog, setShowLinkReleaseDialog] = useState(false);

  // Query release details
  const { data: releaseData, isLoading: releaseLoading } = useQuery({
    queryKey: ['release', releaseId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/releases/${releaseId}/`);
      return response.data;
    },
    enabled: !!releaseId,
  });

  // Query publications
  const { data: publicationsData, isLoading: publicationsLoading } = useQuery({
    queryKey: ['release-publications', releaseId],
    queryFn: () => fetchReleasePublications(releaseId!),
    enabled: !!releaseId,
  });

  const release = releaseData as ReleaseDetails | undefined;
  const publications = Array.isArray(publicationsData?.data) ? publicationsData.data : [];

  // Check permissions
  const isDigitalTeam = user?.profile?.department?.code === 'Digital';
  const isLabelTeam = user?.profile?.department?.code === 'Label';
  const isMarketingTeam = user?.profile?.department?.code === 'Marketing';
  const isAdmin = user?.profile?.role?.level >= 1000;

  const canEdit = isDigitalTeam || isLabelTeam || isAdmin;
  const canAddPlatform = isDigitalTeam || isAdmin;
  const canViewFull = isDigitalTeam || isLabelTeam || isMarketingTeam || isAdmin;

  // Calculate distribution metrics
  const distributionMetrics = {
    totalPlatforms: publications.length,
    livePlatforms: publications.filter(p => p.status === 'live').length,
    processingPlatforms: publications.filter(p => ['processing', 'submitted'].includes(p.status)).length,
    plannedPlatforms: publications.filter(p => p.status === 'planned').length,
    issuesPlatforms: publications.filter(p => ['blocked', 'taken_down'].includes(p.status)).length,
  };

  const completionPercentage = distributionMetrics.totalPlatforms > 0
    ? Math.round((distributionMetrics.livePlatforms / distributionMetrics.totalPlatforms) * 100)
    : 0;

  // Handle edit publication
  const handleEditPublication = (publication: Publication) => {
    setSelectedPublication(publication);
  };

  // No release yet
  if (!releaseId) {
    return (
      <>
        <div className="space-y-6">
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle>Release Information</CardTitle>
              <CardDescription>
                {canEdit
                  ? 'Create a release to start distribution'
                  : 'No release created yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground mb-4">
                  This song has not been set up for release yet.
                </p>
                {canEdit && (
                  <div className="flex items-center justify-center gap-3">
                    {onCreateRelease && (
                      <Button
                        onClick={onCreateRelease}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Release
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowLinkReleaseDialog(true)}
                      size="lg"
                      variant="outline"
                    >
                      <Disc3 className="h-5 w-5 mr-2" />
                      Link Existing Release
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link Release Dialog */}
        <LinkReleaseDialog
          open={showLinkReleaseDialog}
          onOpenChange={setShowLinkReleaseDialog}
          songId={songId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['song', songId] });
          }}
        />
      </>
    );
  }

  // Loading state
  if (releaseLoading || publicationsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Failed to load
  if (!release) {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Unable to load release details. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate deadlines
  const releaseDate = release.release_date ? new Date(release.release_date) : null;
  const submissionDeadline = releaseDate ? addDays(releaseDate, -14) : null;
  const urgentDeadline = releaseDate ? addDays(releaseDate, -7) : null;

  return (
    <div className="space-y-6">
      {/* Distribution Overview Card */}
      <Card className="rounded-2xl border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Distribution Overview</CardTitle>
              <CardDescription>
                Platform distribution status and metrics
              </CardDescription>
            </div>
            {canAddPlatform && (
              <Button
                onClick={() => setShowAddPlatformDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Platform
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="rounded-xl bg-background/50 backdrop-blur-xl border border-white/10 p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Platforms</p>
              <p className="text-2xl font-bold">{distributionMetrics.totalPlatforms}</p>
            </div>
            <div className="rounded-xl bg-background/50 backdrop-blur-xl border border-green-500/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                <p className="text-xs text-muted-foreground">Live</p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {distributionMetrics.livePlatforms}
              </p>
            </div>
            <div className="rounded-xl bg-background/50 backdrop-blur-xl border border-blue-500/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {distributionMetrics.processingPlatforms}
              </p>
            </div>
            <div className="rounded-xl bg-background/50 backdrop-blur-xl border border-gray-500/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                <p className="text-xs text-muted-foreground">Planned</p>
              </div>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {distributionMetrics.plannedPlatforms}
              </p>
            </div>
            <div className="rounded-xl bg-background/50 backdrop-blur-xl border border-red-500/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {distributionMetrics.issuesPlatforms}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Distribution Progress</span>
              <span className="font-semibold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Deadlines Warning */}
      {releaseDate && submissionDeadline && (
        <Card className="rounded-2xl border-yellow-500/20 bg-yellow-500/10 backdrop-blur-xl shadow-xl">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Release Deadlines
                </p>
                <div className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                  <p>
                    Recommended submission deadline: {format(submissionDeadline, 'MMM dd, yyyy')} (14 days before release)
                  </p>
                  {urgentDeadline && (
                    <p>
                      Urgent deadline: {format(urgentDeadline, 'MMM dd, yyyy')} (7 days before release)
                    </p>
                  )}
                  <p>
                    Release date: {format(releaseDate, 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Release Details */}
      <ReleaseDetailsCard
        release={release}
        canEdit={canEdit}
        onEdit={() => setShowEditReleaseDialog(true)}
      />

      {/* Distribution Checklist */}
      {canViewFull && (
        <DistributionChecklist
          publications={publications}
          releaseDate={release.release_date}
        />
      )}

      {/* Platform Distribution List */}
      {canViewFull && publications.length > 0 && (
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>
              Distribution status across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {publications.map((publication) => (
                <div
                  key={publication.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {publication.status === 'live' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                    {['processing', 'submitted'].includes(publication.status) && (
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {publication.status === 'planned' && (
                      <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                    {['blocked', 'taken_down'].includes(publication.status) && (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold">{publication.platform.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={
                            publication.status === 'live'
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                              : ['processing', 'submitted'].includes(publication.status)
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                              : publication.status === 'planned'
                              ? 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
                              : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                          }
                        >
                          {publication.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {publication.territory && publication.territory !== 'GLOBAL' && (
                          <span className="text-xs text-muted-foreground">
                            {publication.territory}
                          </span>
                        )}
                      </div>
                      {publication.published_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Published {new Date(publication.published_at).toLocaleDateString()}
                        </p>
                      )}
                      {publication.scheduled_for && !publication.published_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Scheduled for {new Date(publication.scheduled_for).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {publication.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={publication.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </a>
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPublication(publication)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publication Timeline */}
      {canViewFull && publications.length > 0 && (
        <PublicationStatusTimeline publications={publications} />
      )}

      {/* Quick Actions */}
      {canEdit && (
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditReleaseDialog(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Release Details
            </Button>
            {canAddPlatform && (
              <Button
                variant="outline"
                onClick={() => setShowAddPlatformDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Distribution Platform
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.open(`/analytics/releases/${releaseId}`, '_blank')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Release Dialog */}
      <EditReleaseDialog
        open={showEditReleaseDialog}
        onOpenChange={setShowEditReleaseDialog}
        release={release}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['release', releaseId] });
          toast({
            title: 'Success',
            description: 'Release details updated successfully.',
          });
        }}
      />

      {/* Add Platform Dialog */}
      <AddPlatformDialog
        open={showAddPlatformDialog}
        onOpenChange={setShowAddPlatformDialog}
        releaseId={releaseId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['release-publications', releaseId] });
          toast({
            title: 'Success',
            description: 'Platform added successfully.',
          });
        }}
      />

      {/* Edit Publication Dialog */}
      {selectedPublication && (
        <EditPublicationDialog
          open={!!selectedPublication}
          onOpenChange={(open) => !open && setSelectedPublication(null)}
          publication={selectedPublication}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['release-publications', releaseId] });
            setSelectedPublication(null);
            toast({
              title: 'Success',
              description: 'Publication updated successfully.',
            });
          }}
        />
      )}
    </div>
  );
}
