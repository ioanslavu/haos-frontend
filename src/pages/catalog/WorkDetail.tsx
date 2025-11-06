import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Music, Users, DollarSign, FileText, Plus, Lock, Unlock, CheckCircle2, AlertTriangle, Home } from 'lucide-react';
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
import { AddISWCDialog } from './components/AddISWCDialog';
import { AddCreditDialog } from './components/AddCreditDialog';
import { AddSplitDialog } from './components/AddSplitDialog';
import { ActivityFeed, Activity } from '@/components/ui/activity-feed';

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workId = parseInt(id || '0', 10);

  const { data: workDetails, isLoading } = useWorkDetails(workId);
  const { data: writerSplits } = useSplitsByObject('work', workId, 'writer');
  const { data: publisherSplits } = useSplitsByObject('work', workId, 'publisher');

  // Dialog states
  const [iswcDialogOpen, setIswcDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [writerSplitDialogOpen, setWriterSplitDialogOpen] = useState(false);
  const [publisherSplitDialogOpen, setPublisherSplitDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Skeleton */}
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!workDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Work not found</p>
      </div>
    );
  }

  const work = workDetails.work;
  const credits = workDetails.credits;
  const recordings = workDetails.recordings;
  const stats = workDetails.statistics;

  // Mock activity data (in production, this would come from API)
  const activities: Activity[] = [
    {
      id: '1',
      type: 'edit',
      user: { name: 'Sarah Johnson', initials: 'SJ' },
      action: 'updated the ISWC code for',
      target: work?.title || 'this work',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      metadata: { category: 'Metadata' },
    },
    {
      id: '2',
      type: 'create',
      user: { name: 'Michael Chen', initials: 'MC' },
      action: 'added a new credit to',
      target: work?.title || 'this work',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      metadata: { category: 'Credits' },
    },
    {
      id: '3',
      type: 'assign',
      user: { name: 'Emily Davis', initials: 'ED' },
      action: 'assigned publishing split to',
      target: 'Universal Music',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      metadata: { category: 'Rights', status: '50%' },
    },
    {
      id: '4',
      type: 'create',
      user: { name: 'Alex Thompson', initials: 'AT' },
      action: 'created',
      target: work?.title || 'this work',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      metadata: { status: 'New Work' },
    },
  ];

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
              <Link to="/catalog">Catalog</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/catalog/works">Works</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{work.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/catalog/works')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{work.title}</h1>
          {work.alternate_titles && (
            <p className="text-muted-foreground text-base">{work.alternate_titles}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/catalog/works/${workId}/generate-contract`)}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Contract
          </Button>
          <Button onClick={() => navigate(`/catalog/works/${workId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Work
          </Button>
        </div>
      </div>

      {/* Work Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ISWC</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {work.iswc || <span className="text-muted-foreground">Not Set</span>}
              </div>
              {!work.iswc && (
                <Button size="sm" variant="outline" onClick={() => setIswcDialogOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Language</CardTitle>
            <Badge variant="outline">{work.language?.toUpperCase() || 'N/A'}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{work.genre || 'Not specified'}</div>
            {work.sub_genre && (
              <p className="text-sm text-muted-foreground">{work.sub_genre}</p>
            )}
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recordings</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_recordings}</div>
            <p className="text-xs text-muted-foreground">{stats.total_releases} releases</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year Composed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{work.year_composed || '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="credits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="splits">Rights & Splits</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-4">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Credits</CardTitle>
              <Button size="sm" onClick={() => setCreditDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Credit
              </Button>
            </CardHeader>
            <CardContent>
              {credits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No credits added yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Credited As</TableHead>
                      <TableHead>Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.map((credit) => (
                      <TableRow key={credit.id} className="hover-lift transition-smooth">
                        <TableCell className="font-medium">
                          {credit.entity_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" size="sm">{credit.role_display || credit.role}</Badge>
                        </TableCell>
                        <TableCell>{credit.credited_as || '—'}</TableCell>
                        <TableCell>
                          {credit.share_value ? (
                            <span>
                              {credit.share_value}
                              {credit.share_kind === 'percentage' && '%'}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Splits Tab */}
        <TabsContent value="splits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Writer Splits */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Writer Splits</CardTitle>
                <Button size="sm" onClick={() => setWriterSplitDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Writer
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm items-center">
                    <span>Total Allocated</span>
                    <Badge
                      variant={writerTotal === 100 ? "success" : "warning"}
                      icon={writerTotal === 100 ? CheckCircle2 : AlertTriangle}
                      size="sm"
                    >
                      {writerTotal}%
                    </Badge>
                  </div>
                  <Progress value={writerTotal} className="h-2" />
                  {writerTotal !== 100 && (
                    <p className="text-xs text-muted-foreground">
                      {writerTotal < 100 ? `Missing ${100 - writerTotal}%` : `Exceeds by ${writerTotal - 100}%`}
                    </p>
                  )}
                </div>
                {writerSplits && writerSplits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Writer</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {writerSplits.map((split) => (
                        <TableRow key={split.id} className="hover-lift transition-smooth">
                          <TableCell className="font-medium">
                            {split.entity_name}
                          </TableCell>
                          <TableCell>{split.share}%</TableCell>
                          <TableCell>
                            {split.is_locked ? (
                              <Badge variant="secondary" size="sm" icon={Lock}>Locked</Badge>
                            ) : (
                              <Badge variant="outline" size="sm" icon={Unlock}>Unlocked</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No writer splits defined
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publisher Splits */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Publisher Splits</CardTitle>
                <Button size="sm" onClick={() => setPublisherSplitDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Publisher
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm items-center">
                    <span>Total Allocated</span>
                    <Badge
                      variant={publisherTotal === 100 ? "success" : "warning"}
                      icon={publisherTotal === 100 ? CheckCircle2 : AlertTriangle}
                      size="sm"
                    >
                      {publisherTotal}%
                    </Badge>
                  </div>
                  <Progress value={publisherTotal} className="h-2" />
                  {publisherTotal !== 100 && (
                    <p className="text-xs text-muted-foreground">
                      {publisherTotal < 100 ? `Missing ${100 - publisherTotal}%` : `Exceeds by ${publisherTotal - 100}%`}
                    </p>
                  )}
                </div>
                {publisherSplits && publisherSplits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Publisher</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publisherSplits.map((split) => (
                        <TableRow key={split.id}>
                          <TableCell className="font-medium">
                            {split.entity_name}
                          </TableCell>
                          <TableCell>{split.share}%</TableCell>
                          <TableCell>
                            {split.is_locked ? (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Unlock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No publisher splits defined
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recordings</CardTitle>
              <Button size="sm" onClick={() => navigate(`/catalog/recordings/create?work=${workId}`)}>
                <Plus className="mr-2 h-4 w-4" />
                New Recording
              </Button>
            </CardHeader>
            <CardContent>
              {recordings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recordings of this work yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ISRC</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordings.map((recording) => (
                      <TableRow key={recording.id}>
                        <TableCell className="font-medium">
                          {recording.title}
                          {recording.version && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({recording.version})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{recording.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{recording.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {recording.isrc || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>{recording.formatted_duration || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/catalog/recordings/${recording.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lyrics Tab */}
        <TabsContent value="lyrics">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lyrics</CardTitle>
              <Button size="sm" onClick={() => navigate(`/catalog/works/${workId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Lyrics
              </Button>
            </CardHeader>
            <CardContent>
              {work.lyrics ? (
                <pre className="whitespace-pre-wrap font-mono text-sm">{work.lyrics}</pre>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No lyrics added yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ActivityFeed activities={activities} maxHeight="600px" />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddISWCDialog
        workId={workId}
        open={iswcDialogOpen}
        onOpenChange={setIswcDialogOpen}
      />
      <AddCreditDialog
        scope="work"
        objectId={workId}
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
      />
      <AddSplitDialog
        scope="work"
        objectId={workId}
        rightType="writer"
        open={writerSplitDialogOpen}
        onOpenChange={setWriterSplitDialogOpen}
      />
      <AddSplitDialog
        scope="work"
        objectId={workId}
        rightType="publisher"
        open={publisherSplitDialogOpen}
        onOpenChange={setPublisherSplitDialogOpen}
      />
    </div>
    </AppLayout>
  );
}