import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mic, Plus, Lock, Unlock, FileAudio, Upload, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useRecordingDetails } from '@/api/hooks/useCatalog';
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
import { AddISRCDialog } from './components/AddISRCDialog';
import { AddCreditDialog } from './components/AddCreditDialog';
import { AddSplitDialog } from './components/AddSplitDialog';

export default function RecordingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recordingId = parseInt(id || '0', 10);

  const { data: recordingDetails, isLoading } = useRecordingDetails(recordingId);
  const { data: masterSplits } = useSplitsByObject('recording', recordingId, 'master');

  // Dialog states
  const [isrcDialogOpen, setIsrcDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [masterSplitDialogOpen, setMasterSplitDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!recordingDetails) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Recording not found</p>
        </div>
      </AppLayout>
    );
  }

  const recording = recordingDetails.recording;
  const work = recordingDetails.work;
  const releases = recordingDetails.releases;
  const credits = recordingDetails.credits;
  const assets = recordingDetails.assets;
  const publications = recordingDetails.publications;
  const stats = recordingDetails.statistics;

  // Calculate total split percentage
  const masterTotal = masterSplits?.reduce((sum, split) => sum + split.share, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/catalog/recordings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{recording.title}</h1>
            {recording.version && (
              <p className="text-muted-foreground">{recording.version}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/catalog/recordings/${recordingId}/generate-contract`)}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Contract
            </Button>
            <Button variant="outline" onClick={() => navigate(`/catalog/recordings/${recordingId}/generate-coprod-contract`)}>
              <Users className="mr-2 h-4 w-4" />
              Co-Prod Contract
            </Button>
            <Button onClick={() => navigate(`/catalog/recordings/${recordingId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Recording
            </Button>
          </div>
        </div>

        {/* Recording Info Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ISRC</CardTitle>
              <FileAudio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {recording.isrc || <span className="text-muted-foreground">Not Set</span>}
                </div>
                {!recording.isrc && (
                  <Button size="sm" variant="outline" onClick={() => setIsrcDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Type</CardTitle>
              <Badge variant="outline">{recording.type?.replace('_', ' ')}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{recording.status}</div>
              {recording.formatted_duration && (
                <p className="text-sm text-muted-foreground">{recording.formatted_duration}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Releases</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_releases}</div>
              <p className="text-xs text-muted-foreground">{stats.total_assets} assets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publications</CardTitle>
              <Badge variant="outline">{stats.total_publications}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.platforms_covered.length}</div>
              <p className="text-xs text-muted-foreground">platforms</p>
            </CardContent>
          </Card>
        </div>

        {/* Work Info */}
        {work && (
          <Card>
            <CardHeader>
              <CardTitle>Musical Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{work.title}</h3>
                  {work.iswc && (
                    <p className="text-sm text-muted-foreground">ISWC: {work.iswc}</p>
                  )}
                </div>
                <Button variant="outline" onClick={() => navigate(`/catalog/works/${work.id}`)}>
                  View Work
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="releases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="releases">Releases</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="splits">Master Splits</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
          </TabsList>

          {/* Releases Tab */}
          <TabsContent value="releases">
            <Card>
              <CardHeader>
                <CardTitle>Releases</CardTitle>
              </CardHeader>
              <CardContent>
                {releases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Not included in any releases yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Release</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>UPC</TableHead>
                        <TableHead>Track #</TableHead>
                        <TableHead>Release Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {releases.map((release) => (
                        <TableRow key={release.id}>
                          <TableCell className="font-medium">{release.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{release.type}</Badge>
                          </TableCell>
                          <TableCell>{release.upc || '—'}</TableCell>
                          <TableCell>
                            {release.track_info?.disc_number && `${release.track_info.disc_number}-`}
                            {release.track_info?.track_number || '—'}
                          </TableCell>
                          <TableCell>{release.release_date || '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/catalog/releases/${release.id}`)}
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

          {/* Credits Tab */}
          <TabsContent value="credits">
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Master Splits Tab */}
          <TabsContent value="splits">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Master Splits</CardTitle>
                <Button size="sm" onClick={() => setMasterSplitDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Master Split
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Allocated</span>
                    <span className={masterTotal === 100 ? "text-green-600" : "text-amber-600"}>
                      {masterTotal}%
                    </span>
                  </div>
                  <Progress value={masterTotal} className="h-2" />
                  {masterTotal !== 100 && (
                    <p className="text-xs text-amber-600">
                      {masterTotal < 100 ? `Missing ${100 - masterTotal}%` : `Exceeds by ${masterTotal - 100}%`}
                    </p>
                  )}
                </div>
                {masterSplits && masterSplits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {masterSplits.map((split) => (
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
                    No master splits defined
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assets</CardTitle>
                <Button size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Asset
                </Button>
              </CardHeader>
              <CardContent>
                {assets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No assets uploaded yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Master</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.file_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{asset.kind}</Badge>
                          </TableCell>
                          <TableCell>{asset.formatted_file_size || '—'}</TableCell>
                          <TableCell>
                            {asset.sample_rate && asset.bit_depth
                              ? `${asset.sample_rate}Hz / ${asset.bit_depth}bit`
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {asset.is_master && <Badge>Master</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publications Tab */}
          <TabsContent value="publications">
            <Card>
              <CardHeader>
                <CardTitle>Publications</CardTitle>
              </CardHeader>
              <CardContent>
                {publications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Not published on any platforms yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead>Territory</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Monetized</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publications.map((pub) => (
                        <TableRow key={pub.id}>
                          <TableCell className="font-medium">
                            {pub.platform_display || pub.platform}
                          </TableCell>
                          <TableCell>{pub.territory_display || pub.territory}</TableCell>
                          <TableCell>
                            <Badge>{pub.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            {pub.is_monetized && <Badge variant="default" className="bg-green-500">Yes</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddISRCDialog
          recordingId={recordingId}
          open={isrcDialogOpen}
          onOpenChange={setIsrcDialogOpen}
        />
        <AddCreditDialog
          scope="recording"
          objectId={recordingId}
          open={creditDialogOpen}
          onOpenChange={setCreditDialogOpen}
        />
        <AddSplitDialog
          scope="recording"
          objectId={recordingId}
          rightType="master"
          open={masterSplitDialogOpen}
          onOpenChange={setMasterSplitDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
