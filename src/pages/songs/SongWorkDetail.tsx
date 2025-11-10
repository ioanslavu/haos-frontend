import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Music, Users, DollarSign, FileText, Plus, CheckCircle2, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useWorkDetails } from '@/api/hooks/useCatalog';
import { useSplitsByObject } from '@/api/hooks/useRights';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddISWCDialog } from '../catalog/components/AddISWCDialog';
import { AddCreditDialog } from '../catalog/components/AddCreditDialog';
import { AddSplitDialog } from '../catalog/components/AddSplitDialog';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export default function SongWorkDetail() {
  const { id: songIdParam } = useParams();
  const navigate = useNavigate();
  const songId = parseInt(songIdParam || '0', 10);

  // Fetch song to get work ID
  const { data: songData, isLoading: songLoading } = useQuery({
    queryKey: ['song', songId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/songs/${songId}/`);
      return response.data;
    },
    enabled: !!songId,
  });

  const song = songData?.data || songData;
  const workId = song?.work?.id;

  const { data: workDetails, isLoading: workLoading } = useWorkDetails(workId, { enabled: !!workId });
  const { data: writerSplits } = useSplitsByObject('work', workId, 'writer');
  const { data: publisherSplits } = useSplitsByObject('work', workId, 'publisher');

  // Dialog states
  const [iswcDialogOpen, setIswcDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [writerSplitDialogOpen, setWriterSplitDialogOpen] = useState(false);
  const [publisherSplitDialogOpen, setPublisherSplitDialogOpen] = useState(false);

  if (songLoading || workLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!song || !workId || !workDetails) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/songs/${songId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Work Details</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No work linked to this song</p>
            <Button className="mt-4" onClick={() => navigate(`/songs/${songId}`)}>
              Back to Song
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const work = workDetails.work;
  const credits = workDetails.credits;
  const recordings = workDetails.recordings;

  // Calculate total split percentages
  const writerTotal = writerSplits?.reduce((sum, split) => sum + split.share, 0) || 0;
  const publisherTotal = publisherSplits?.reduce((sum, split) => sum + split.share, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/songs">Songs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/songs/${songId}`}>{song.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Work Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/songs/${songId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{work.title}</h1>
            <p className="text-muted-foreground mt-1">Work for: {song.title}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/songs/${songId}/work/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Work
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ISWC Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {work.iswc ? (
                  <div className="text-2xl font-bold font-mono">{work.iswc}</div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIswcDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" /> Add ISWC
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credits?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Contributors</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recordings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordings?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Versions</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Publishing</CardTitle>
            </CardHeader>
            <CardContent>
              {work.has_complete_publishing_splits ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Complete</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Incomplete</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="splits">Publishing Splits</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle>Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Title</p>
                    <p className="text-lg font-semibold">{work.title}</p>
                  </div>
                  {work.language && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Language</p>
                      <p className="text-lg">{work.language}</p>
                    </div>
                  )}
                  {work.genre && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Genre</p>
                      <Badge variant="secondary">{work.genre}</Badge>
                    </div>
                  )}
                  {work.year_composed && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Year Composed</p>
                      <p className="text-lg">{work.year_composed}</p>
                    </div>
                  )}
                </div>

                {work.lyrics && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Lyrics</p>
                    <div className="p-4 bg-accent/30 rounded-lg">
                      <pre className="text-sm font-mono whitespace-pre-wrap">{work.lyrics}</pre>
                    </div>
                  </div>
                )}

                {work.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Internal Notes</p>
                    <div className="p-4 bg-accent/30 rounded-lg">
                      <p className="text-sm">{work.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Credits
                  </CardTitle>
                  <Button size="sm" onClick={() => setCreditDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {credits && credits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credits.map((credit: any) => (
                        <TableRow key={credit.id}>
                          <TableCell className="font-medium">{credit.entity?.name || 'Unknown'}</TableCell>
                          <TableCell><Badge variant="outline">{credit.role}</Badge></TableCell>
                          <TableCell className="text-muted-foreground capitalize">{credit.entity?.type || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No credits added yet</p>
                    <Button className="mt-4" onClick={() => setCreditDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Credit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Splits Tab */}
          <TabsContent value="splits" className="space-y-6">
            {/* Writer Splits */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Writer Splits
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={writerTotal} className="w-32" />
                      <span className="text-sm font-medium">{writerTotal.toFixed(1)}%</span>
                      {Math.abs(writerTotal - 100) < 0.01 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setWriterSplitDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Split
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {writerSplits && writerSplits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Writer</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead>Territory</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {writerSplits.map((split: any) => (
                        <TableRow key={split.id}>
                          <TableCell className="font-medium">{split.entity?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge>{split.share}%</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{split.territory || 'Worldwide'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No writer splits defined</p>
                    <Button className="mt-4" onClick={() => setWriterSplitDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Writer Split
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publisher Splits */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Publisher Splits
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={publisherTotal} className="w-32" />
                      <span className="text-sm font-medium">{publisherTotal.toFixed(1)}%</span>
                      {Math.abs(publisherTotal - 100) < 0.01 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setPublisherSplitDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Split
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {publisherSplits && publisherSplits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Publisher</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead>Territory</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publisherSplits.map((split: any) => (
                        <TableRow key={split.id}>
                          <TableCell className="font-medium">{split.entity?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge>{split.share}%</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{split.territory || 'Worldwide'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No publisher splits defined</p>
                    <Button className="mt-4" onClick={() => setPublisherSplitDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Publisher Split
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recordings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recordings && recordings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>ISRC</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordings.map((recording: any) => (
                        <TableRow key={recording.id}>
                          <TableCell className="font-medium">{recording.title}</TableCell>
                          <TableCell><Badge variant="outline">{recording.type}</Badge></TableCell>
                          <TableCell className="font-mono text-sm">{recording.isrc || '-'}</TableCell>
                          <TableCell><Badge>{recording.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No recordings yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {workId && (
          <>
            <AddISWCDialog
              open={iswcDialogOpen}
              onOpenChange={setIswcDialogOpen}
              workId={workId}
              onSuccess={() => setIswcDialogOpen(false)}
            />
            <AddCreditDialog
              open={creditDialogOpen}
              onOpenChange={setCreditDialogOpen}
              objectType="work"
              objectId={workId}
              onSuccess={() => setCreditDialogOpen(false)}
            />
            <AddSplitDialog
              open={writerSplitDialogOpen}
              onOpenChange={setWriterSplitDialogOpen}
              objectType="work"
              objectId={workId}
              rightType="writer"
              onSuccess={() => setWriterSplitDialogOpen(false)}
            />
            <AddSplitDialog
              open={publisherSplitDialogOpen}
              onOpenChange={setPublisherSplitDialogOpen}
              objectType="work"
              objectId={workId}
              rightType="publisher"
              onSuccess={() => setPublisherSplitDialogOpen(false)}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
