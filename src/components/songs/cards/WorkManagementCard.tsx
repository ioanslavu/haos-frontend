import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Link2, ExternalLink, AlertCircle, CheckCircle2, Music, Users, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useWork } from '@/api/hooks/useSongs';
import { Song } from '@/types/song';
// import { LinkWorkDialog } from './LinkWorkDialog'; // TODO: Component not found

interface WorkManagementCardProps {
  song: Song;
}

export function WorkManagementCard({ song }: WorkManagementCardProps) {
  const navigate = useNavigate();
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const { data: work, isLoading, error } = useWork(song.work?.id || 0, !!song.work?.id);
  const hasWork = !!song.work;

  // Loading state
  if (isLoading && hasWork) {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No work linked
  if (!hasWork) {
    return (
      <>
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Musical Work
            </CardTitle>
            <CardDescription>
              Link or create a musical work for publishing administration
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <FileText className="h-12 w-12 text-primary opacity-50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Work Linked</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                A musical work represents the composition and lyrics. Link an existing work or create a new one to manage publishing rights.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setShowLinkDialog(true)}
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Link Existing Work
                </Button>
                <Button
                  onClick={() => navigate(`/songs/${song.id}/work/create`)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Work
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <LinkWorkDialog
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          songId={song.id}
          onSuccess={() => {
            setShowLinkDialog(false);
          }}
        /> */}
      </>
    );
  }

  // Work linked - show details
  return (
    <div className="space-y-6">
      {/* Work Details Card */}
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Musical Work
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </CardTitle>
              <CardDescription>
                Publishing composition and rights information
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/songs/${song.id}/work`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {error ? (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Error loading work details</p>
                <p className="text-sm">Work ID: {song.work!.id}</p>
              </div>
            </div>
          ) : work ? (
            <div className="space-y-6">
              {/* Work Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Work Title
                  </p>
                  <p className="font-semibold text-lg">{work.title || 'Untitled Work'}</p>
                </div>

                {work.iswc && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ISWC Code</p>
                    <p className="font-mono font-semibold text-lg">{work.iswc}</p>
                  </div>
                )}

                {work.registration_date && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Registration Date
                    </p>
                    <p className="font-medium">
                      {new Date(work.registration_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {work.status && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={work.status === 'registered' ? 'default' : 'secondary'} className="capitalize">
                      {work.status}
                    </Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* Writers/Composers */}
              {work.splits && work.splits.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Writers & Composers ({work.splits.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {work.splits.slice(0, 5).map((split: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-accent/30 border border-border/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{split.entity?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {split.share?.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {work.splits.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/songs/${song.id}/work`)}
                        className="text-xs"
                      >
                        View all {work.splits.length} writers
                      </Button>
                    )}
                  </div>

                  {/* Splits Completion Check */}
                  {work.splits.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(() => {
                        const total = work.splits.reduce((sum: number, s: any) => sum + (s.share || 0), 0);
                        const isComplete = Math.abs(total - 100) < 0.01;
                        return isComplete ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">
                              Publishing splits total 100%
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="text-amber-600 dark:text-amber-400">
                              Publishing splits total {total.toFixed(1)}% (should be 100%)
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Publisher Info */}
              {work.publisher && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>Publisher</span>
                    </div>
                    <div className="p-3 bg-accent/30 border border-border/50 rounded-lg">
                      <p className="font-medium">{work.publisher.name}</p>
                      {work.publisher.type && (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{work.publisher.type}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Work ID: {song.work!.id}</p>
              {song.work!.iswc && (
                <p className="text-sm text-muted-foreground">ISWC: {song.work!.iswc}</p>
              )}
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/songs/${song.id}/work`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Work Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/songs/${song.id}/work`)}
            className="rounded-xl"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Work Details
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/songs/${song.id}/work/edit`)}
            className="rounded-xl"
          >
            <FileText className="h-4 w-4 mr-2" />
            Edit Work
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLinkDialog(true)}
            className="rounded-xl"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Change Work
          </Button>
        </CardContent>
      </Card>

      {/* <LinkWorkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        songId={song.id}
        currentWorkId={song.work?.id}
        onSuccess={() => {
          setShowLinkDialog(false);
        }}
      /> */}
    </div>
  );
}
