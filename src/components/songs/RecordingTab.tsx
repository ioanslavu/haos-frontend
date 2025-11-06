import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Music,
  Clock,
  FileAudio,
  Users,
  DollarSign,
  Plus,
  Edit,
  Upload,
  UserPlus,
  Percent,
  AlertCircle,
  CheckCircle2,
  Play,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchSongRecordings } from '@/api/songApi';
import { useAuthStore } from '@/stores/authStore';
import { Recording, Credit, SimplifiedCredit, Split } from '@/types/song';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { EditRecordingDialog } from './recording/EditRecordingDialog';
import { AddCreditDialog } from './recording/AddCreditDialog';
import { AddMasterSplitDialog } from './recording/AddMasterSplitDialog';
import { AudioUploadDialog } from './recording/AudioUploadDialog';
import { CreateRecordingDialog } from './CreateRecordingDialog';
import { cn } from '@/lib/utils';

interface RecordingTabProps {
  songId: number;
  songStage?: string;
  songTitle: string;
  workId?: number;
}

export function RecordingTab({ songId, songStage, songTitle, workId }: RecordingTabProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [addingCreditToRecording, setAddingCreditToRecording] = useState<number | null>(null);
  const [addingSplitToRecording, setAddingSplitToRecording] = useState<number | null>(null);
  const [uploadingToRecording, setUploadingToRecording] = useState<number | null>(null);
  const [showCreateRecordingDialog, setShowCreateRecordingDialog] = useState(false);

  const { data: recordingsData, isLoading } = useQuery({
    queryKey: ['song-recordings', songId],
    queryFn: () => fetchSongRecordings(songId),
  });

  const recordings = Array.isArray(recordingsData?.data) ? recordingsData.data : [];

  // Determine user permissions based on department
  const userDepartment = user?.department?.toLowerCase() || '';
  const isAdmin = user?.permissions_summary?.is_superuser || user?.role === 'administrator';
  const canCreateRecording =
    (userDepartment === 'label' && songStage === 'label_recording') ||
    isAdmin;
  const canEditRecording = userDepartment === 'label' && songStage === 'label_recording';
  const canViewSplits = userDepartment === 'label';
  const canViewTechnicalDetails = ['label', 'digital'].includes(userDepartment);
  const canUploadAudio = ['label', 'digital'].includes(userDepartment);
  const canManageCredits = userDepartment === 'label';
  const canManageSplits = userDepartment === 'label';

  // Filter credits based on department permissions
  const filterCredits = (credits: (Credit | SimplifiedCredit)[]) => {
    if (userDepartment === 'label') {
      return credits; // Full access
    }
    if (userDepartment === 'digital') {
      return credits; // Can see names only (already simplified)
    }
    if (userDepartment === 'marketing') {
      // Limited: only featured performers
      return credits.filter(c =>
        c.role.toLowerCase().includes('performer') ||
        c.role.toLowerCase().includes('vocalist')
      );
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No recordings created yet.</p>
            {canCreateRecording && (
              <Button onClick={() => setShowCreateRecordingDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recording
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Create Recording Dialog */}
        <CreateRecordingDialog
          open={showCreateRecordingDialog}
          onOpenChange={setShowCreateRecordingDialog}
          songId={songId}
          songTitle={songTitle}
          workId={workId}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons Header */}
      {canCreateRecording && (
        <Card className="border-dashed border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Recording Management</h3>
                <p className="text-sm text-muted-foreground">
                  {recordings.length === 0
                    ? 'Create your first recording to get started'
                    : `${recordings.length} ${recordings.length === 1 ? 'recording' : 'recordings'} linked to this song`}
                </p>
              </div>
              <Button onClick={() => setShowCreateRecordingDialog(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Recording
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {recordings.map((recording) => {
        const filteredCredits = recording.credits ? filterCredits(recording.credits) : [];
        const splitsTotal = recording.splits?.reduce((sum, s) => sum + s.share, 0) || 0;
        const splitsComplete = Math.abs(splitsTotal - 100) < 0.01;
        const hasMasterAudio = recording.assets?.some(a => a.is_master && (a.kind === 'audio' || a.kind === 'master'));

        return (
          <div key={recording.id} className="space-y-4">
            {/* Recording Details Card */}
            <Card className="overflow-hidden border-white/20 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    <CardTitle>{recording.title}</CardTitle>
                    {recording.type === 'audio_master' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Master
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline">{recording.type.replace('_', ' ')}</Badge>
                    <Badge variant="secondary">{recording.status}</Badge>
                    {recording.isrc ? (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ISRC: {recording.isrc}
                      </span>
                    ) : (
                      <span className="text-sm text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        No ISRC
                      </span>
                    )}
                    {canViewSplits && recording.splits && recording.splits.length > 0 && (
                      splitsComplete ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Splits Complete
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Splits Incomplete ({splitsTotal.toFixed(1)}%)
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEditRecording && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRecording(recording)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {canUploadAudio && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadingToRecording(recording.id)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Audio
                    </Button>
                  )}
                </div>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recording.formatted_duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{recording.formatted_duration}</p>
                    </div>
                  </div>
                )}

                {canViewTechnicalDetails && recording.bpm && (
                  <div>
                    <p className="text-sm text-muted-foreground">BPM</p>
                    <p className="font-medium">{recording.bpm}</p>
                  </div>
                )}

                {canViewTechnicalDetails && recording.key && (
                  <div>
                    <p className="text-sm text-muted-foreground">Key</p>
                    <p className="font-medium">{recording.key}</p>
                  </div>
                )}

                {canViewTechnicalDetails && recording.studio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Studio</p>
                    <p className="font-medium">{recording.studio}</p>
                  </div>
                )}

                {canViewTechnicalDetails && recording.recording_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Recording Date</p>
                    <p className="font-medium">
                      {new Date(recording.recording_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {recording.version && (
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-medium">{recording.version}</p>
                  </div>
                )}
              </div>

              {recording.notes && canViewTechnicalDetails && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{recording.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Player Card */}
          {recording.assets && recording.assets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5" />
                  Audio Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recording.assets
                  .filter((asset) => asset.kind === 'audio' || asset.kind === 'master')
                  .map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{asset.file_name}</p>
                          {asset.is_master && <Badge variant="default">Master</Badge>}
                          {asset.is_public && <Badge variant="outline">Public</Badge>}
                        </div>
                        {canViewTechnicalDetails && (
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {asset.sample_rate && <span>{asset.sample_rate} Hz</span>}
                            {asset.bit_depth && <span>{asset.bit_depth}-bit</span>}
                            {asset.formatted_file_size && <span>{asset.formatted_file_size}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={asset.file_path} target="_blank" rel="noopener noreferrer">
                            Preview
                          </a>
                        </Button>
                        {canViewTechnicalDetails && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={asset.file_path} download>
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Credits Card */}
          {filteredCredits.length > 0 && (
            <Card className="border-white/20 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>Credits</CardTitle>
                  </div>
                  {canManageCredits && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingCreditToRecording(recording.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Credit
                    </Button>
                  )}
                </div>
                <CardDescription>
                  {userDepartment === 'marketing'
                    ? 'Featured performers only'
                    : 'All recording contributors'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      {canViewSplits && <TableHead>Type</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCredits.map((credit, index) => {
                      const isSimplified = 'entity_name' in credit;
                      const name = isSimplified
                        ? (credit as SimplifiedCredit).entity_name
                        : (credit as Credit).entity.name;
                      const entityType = !isSimplified ? (credit as Credit).entity.type : null;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{credit.role}</Badge>
                          </TableCell>
                          {canViewSplits && (
                            <TableCell>
                              {entityType && (
                                <span className="text-sm text-muted-foreground capitalize">
                                  {entityType}
                                </span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Master Splits Card (Label Department Only) */}
          {canViewSplits && (
            <Card className="border-white/20 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <CardTitle>Master Splits</CardTitle>
                  </div>
                  {canManageSplits && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingSplitToRecording(recording.id)}
                    >
                      <Percent className="h-4 w-4 mr-2" />
                      Add Split
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Master recording ownership and revenue distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!recording.splits || recording.splits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No master splits defined yet</p>
                    {canManageSplits && (
                      <p className="text-xs mt-1">Add splits to define ownership</p>
                    )}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entity</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Share (%)</TableHead>
                          {recording.splits.some((s) => s.territory) && (
                            <TableHead>Territory</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recording.splits.map((split) => (
                          <TableRow key={split.id}>
                            <TableCell className="font-medium">{split.entity.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {split.entity.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {split.share.toFixed(2)}%
                            </TableCell>
                            {split.territory && <TableCell>{split.territory}</TableCell>}
                          </TableRow>
                        ))}
                        <TableRow className={cn(
                          "font-semibold border-t-2",
                          splitsComplete
                            ? "bg-green-50 dark:bg-green-950/20"
                            : "bg-amber-50 dark:bg-amber-950/20"
                        )}>
                          <TableCell colSpan={2} className="flex items-center gap-2">
                            Total
                            {splitsComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {splitsTotal.toFixed(2)}%
                          </TableCell>
                          {recording.splits.some((s) => s.territory) && <TableCell />}
                        </TableRow>
                      </TableBody>
                    </Table>
                    {!splitsComplete && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Master splits must total 100% before distribution
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        );
      })}

      {/* Dialogs */}
      {editingRecording && (
        <EditRecordingDialog
          recording={editingRecording}
          open={!!editingRecording}
          onOpenChange={(open) => !open && setEditingRecording(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['song-recordings', songId] });
            setEditingRecording(null);
            toast({
              title: 'Recording Updated',
              description: 'Recording details have been updated successfully.',
            });
          }}
        />
      )}

      {addingCreditToRecording && (
        <AddCreditDialog
          recordingId={addingCreditToRecording}
          open={!!addingCreditToRecording}
          onOpenChange={(open) => !open && setAddingCreditToRecording(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['song-recordings', songId] });
            setAddingCreditToRecording(null);
            toast({
              title: 'Credit Added',
              description: 'Recording credit has been added successfully.',
            });
          }}
        />
      )}

      {addingSplitToRecording && (
        <AddMasterSplitDialog
          recordingId={addingSplitToRecording}
          open={!!addingSplitToRecording}
          onOpenChange={(open) => !open && setAddingSplitToRecording(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['song-recordings', songId] });
            setAddingSplitToRecording(null);
            toast({
              title: 'Master Split Added',
              description: 'Master split has been added successfully.',
            });
          }}
        />
      )}

      {uploadingToRecording && (
        <AudioUploadDialog
          recordingId={uploadingToRecording}
          open={!!uploadingToRecording}
          onOpenChange={(open) => !open && setUploadingToRecording(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['song-recordings', songId] });
            setUploadingToRecording(null);
            toast({
              title: 'Audio Uploaded',
              description: 'Audio file has been uploaded successfully.',
            });
          }}
        />
      )}

      {/* Create Recording Dialog */}
      <CreateRecordingDialog
        open={showCreateRecordingDialog}
        onOpenChange={setShowCreateRecordingDialog}
        songId={songId}
        songTitle={songTitle}
        workId={workId}
      />
    </div>
  );
}
