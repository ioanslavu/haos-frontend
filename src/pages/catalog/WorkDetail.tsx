import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Music, Users, DollarSign, FileText, Plus, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useWorkDetails } from '@/api/hooks/useCatalog';
import { useSplitsByObject } from '@/api/hooks/useRights';
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
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

  // Calculate total split percentages
  const writerTotal = writerSplits?.reduce((sum, split) => sum + split.share, 0) || 0;
  const publisherTotal = publisherSplits?.reduce((sum, split) => sum + split.share, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
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
          <h1 className="text-3xl font-bold tracking-tight">{work.title}</h1>
          {work.alternate_titles && (
            <p className="text-muted-foreground">{work.alternate_titles}</p>
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
        <Card>
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
        <Card>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recordings</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_recordings}</div>
            <p className="text-xs text-muted-foreground">{stats.total_releases} releases</p>
          </CardContent>
        </Card>
        <Card>
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
        </TabsList>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-4">
          <Card>
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
                      <TableRow key={credit.id}>
                        <TableCell className="font-medium">
                          {credit.entity_name}
                        </TableCell>
                        <TableCell>
                          <Badge>{credit.role_display || credit.role}</Badge>
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Writer Splits</CardTitle>
                <Button size="sm" onClick={() => setWriterSplitDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Writer
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Allocated</span>
                    <span className={writerTotal === 100 ? "text-green-600" : "text-amber-600"}>
                      {writerTotal}%
                    </span>
                  </div>
                  <Progress value={writerTotal} className="h-2" />
                  {writerTotal !== 100 && (
                    <p className="text-xs text-amber-600">
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
                    No writer splits defined
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publisher Splits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Publisher Splits</CardTitle>
                <Button size="sm" onClick={() => setPublisherSplitDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Publisher
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Allocated</span>
                    <span className={publisherTotal === 100 ? "text-green-600" : "text-amber-600"}>
                      {publisherTotal}%
                    </span>
                  </div>
                  <Progress value={publisherTotal} className="h-2" />
                  {publisherTotal !== 100 && (
                    <p className="text-xs text-amber-600">
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
          <Card>
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
          <Card>
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