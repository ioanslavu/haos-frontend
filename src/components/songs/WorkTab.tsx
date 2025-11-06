import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Edit, Calendar, Music, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { WorkWithSplits } from '@/types/catalog';
import { formatDistanceToNow } from 'date-fns';
import { EditWorkDialog } from './EditWorkDialog';
import { AddSplitDialog } from './AddSplitDialog';
import { EditSplitDialog } from './EditSplitDialog';
import { SplitVisualization } from './SplitVisualization';

interface WorkTabProps {
  songId: number;
  work: WorkWithSplits | null;
  isLoading: boolean;
  error: Error | null;
  canEdit: boolean;
  canViewSplits: boolean;
  onWorkUpdated: () => void;
}

export function WorkTab({
  songId,
  work,
  isLoading,
  error,
  canEdit,
  canViewSplits,
  onWorkUpdated,
}: WorkTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditWork, setShowEditWork] = useState(false);
  const [showAddWriterSplit, setShowAddWriterSplit] = useState(false);
  const [showAddPublisherSplit, setShowAddPublisherSplit] = useState(false);
  const [editingSplit, setEditingSplit] = useState<any>(null);

  // Calculate split totals
  const writerSplitTotal = work?.writer_splits
    ? work.writer_splits.reduce((sum, s) => sum + parseFloat(s.share), 0)
    : 0;

  const publisherSplitTotal = work?.publisher_splits
    ? work.publisher_splits.reduce((sum, s) => sum + parseFloat(s.share), 0)
    : 0;

  const isWriterComplete = Math.abs(writerSplitTotal - 100) < 0.01;
  const isPublisherComplete = Math.abs(publisherSplitTotal - 100) < 0.01;

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading work details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground mb-4">
            Failed to load work details. Please try again.
          </p>
          <div className="flex justify-center">
            <Button onClick={onWorkUpdated} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No work state
  if (!work) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground mb-4">
            No work linked to this song yet.
          </p>
          {canEdit && (
            <div className="flex justify-center">
              <Button onClick={() => navigate(`/catalog/works/create?song_id=${songId}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Work
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Work Details Card */}
      <Card className="border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">{work.title}</CardTitle>
              </div>
              {work.iswc && (
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    ISWC: {work.iswc}
                  </Badge>
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditWork(true)}
                  className="backdrop-blur-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Work
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/catalog/works/${work.id}`)}
                className="backdrop-blur-sm"
              >
                View Full Details
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Language</p>
              <p className="font-medium">{work.language || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Genre</p>
              <p className="font-medium">{work.genre || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Year Composed</p>
              <p className="font-medium">{work.year_composed || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created
              </p>
              <p className="font-medium text-sm">
                {formatDistanceToNow(new Date(work.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {work.notes && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{work.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Visualization */}
      {canViewSplits && (work.writer_splits || work.publisher_splits) && (
        <Card className="border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Split Overview</CardTitle>
            </div>
            <CardDescription>Visual breakdown of royalty distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <SplitVisualization
              writerSplits={work.writer_splits || []}
              publisherSplits={work.publisher_splits || []}
              writerTotal={writerSplitTotal}
              publisherTotal={publisherSplitTotal}
            />
          </CardContent>
        </Card>
      )}

      {/* Writer Splits */}
      {canViewSplits && work.writer_splits ? (
        <Card className="border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Writer Splits</CardTitle>
                <CardDescription>Compositional ownership and royalty distribution</CardDescription>
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => setShowAddWriterSplit(true)}
                  className="backdrop-blur-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Writer Split
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {work.writer_splits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No writer splits defined yet.
              </p>
            ) : (
              <div className="rounded-lg overflow-hidden border border-white/20">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Entity</TableHead>
                      <TableHead>Share</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {work.writer_splits.map((split) => (
                      <TableRow key={split.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{split.entity_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {parseFloat(split.share).toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {split.source || 'Manual'}
                        </TableCell>
                        <TableCell>
                          {split.is_locked ? (
                            <Badge variant="secondary">Locked</Badge>
                          ) : (
                            <Badge variant="outline">Editable</Badge>
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSplit(split)}
                              disabled={split.is_locked}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/70">
                      <TableCell>Total</TableCell>
                      <TableCell>
                        <Badge
                          variant={isWriterComplete ? 'default' : 'destructive'}
                          className="font-mono"
                        >
                          {writerSplitTotal.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell colSpan={canEdit ? 3 : 2}>
                        {isWriterComplete ? (
                          <Badge variant="default" className="bg-green-500">
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Incomplete (Missing {(100 - writerSplitTotal).toFixed(2)}%)
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !canViewSplits && work.writer_splits ? (
        <Card className="border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70">
          <CardHeader>
            <CardTitle>Writers</CardTitle>
            <CardDescription>Compositional contributors (splits hidden)</CardDescription>
          </CardHeader>
          <CardContent>
            {work.writer_splits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No writers defined yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {work.writer_splits.map((split, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                    {split.entity_name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Publisher Splits */}
      {canViewSplits && work.publisher_splits && work.publisher_splits.length > 0 ? (
        <Card className="border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Publisher Splits</CardTitle>
                <CardDescription>Publishing rights and royalty distribution</CardDescription>
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => setShowAddPublisherSplit(true)}
                  className="backdrop-blur-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Publisher Split
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-white/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Entity</TableHead>
                    <TableHead>Share</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {work.publisher_splits.map((split) => (
                    <TableRow key={split.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{split.entity_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {parseFloat(split.share).toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {split.source || 'Manual'}
                      </TableCell>
                      <TableCell>
                        {split.is_locked ? (
                          <Badge variant="secondary">Locked</Badge>
                        ) : (
                          <Badge variant="outline">Editable</Badge>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSplit(split)}
                            disabled={split.is_locked}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/70">
                    <TableCell>Total</TableCell>
                    <TableCell>
                      <Badge
                        variant={isPublisherComplete ? 'default' : 'destructive'}
                        className="font-mono"
                      >
                        {publisherSplitTotal.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell colSpan={canEdit ? 3 : 2}>
                      {isPublisherComplete ? (
                        <Badge variant="default" className="bg-green-500">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Incomplete (Missing {(100 - publisherSplitTotal).toFixed(2)}%)
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : !canViewSplits && work.publisher_splits && work.publisher_splits.length > 0 ? (
        <Card className="border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70">
          <CardHeader>
            <CardTitle>Publishers</CardTitle>
            <CardDescription>Publishing representatives (splits hidden)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {work.publisher_splits.map((split, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                  {split.entity_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* No Permission Message */}
      {!canViewSplits && !work.writer_splits && !work.publisher_splits && (
        <Card className="border-white/20 backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70">
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              You do not have permission to view work splits.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {showEditWork && (
        <EditWorkDialog
          work={work}
          open={showEditWork}
          onClose={() => setShowEditWork(false)}
          onSuccess={() => {
            setShowEditWork(false);
            onWorkUpdated();
            toast({
              title: 'Work Updated',
              description: 'Work details have been updated successfully.',
            });
          }}
        />
      )}

      {showAddWriterSplit && work && (
        <AddSplitDialog
          workId={work.id}
          rightType="writer"
          open={showAddWriterSplit}
          onClose={() => setShowAddWriterSplit(false)}
          onSuccess={() => {
            setShowAddWriterSplit(false);
            onWorkUpdated();
            toast({
              title: 'Writer Split Added',
              description: 'Writer split has been added successfully.',
            });
          }}
        />
      )}

      {showAddPublisherSplit && work && (
        <AddSplitDialog
          workId={work.id}
          rightType="publisher"
          open={showAddPublisherSplit}
          onClose={() => setShowAddPublisherSplit(false)}
          onSuccess={() => {
            setShowAddPublisherSplit(false);
            onWorkUpdated();
            toast({
              title: 'Publisher Split Added',
              description: 'Publisher split has been added successfully.',
            });
          }}
        />
      )}

      {editingSplit && (
        <EditSplitDialog
          split={editingSplit}
          open={!!editingSplit}
          onClose={() => setEditingSplit(null)}
          onSuccess={() => {
            setEditingSplit(null);
            onWorkUpdated();
            toast({
              title: 'Split Updated',
              description: 'Split has been updated successfully.',
            });
          }}
        />
      )}
    </div>
  );
}
