import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePendingReviewTasks, useReviewTask } from '@/api/hooks/useTasks';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  review_status: string;
  submitted_for_review_at: string;
  submitted_by_detail: {
    id: number;
    email: string;
    full_name: string;
  };
  song_detail?: {
    id: number;
    title: string;
  };
  input_values: Array<{
    id: number;
    field_label: string;
    field_type: string;
    value: any;
    value_text?: string;
    value_file?: string;
    value_number?: number;
    value_boolean?: boolean;
    value_date?: string;
  }>;
}

export default function TaskReviewDashboard() {
  const [reviewingTask, setReviewingTask] = useState<Task | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'changes_requested' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending review tasks using the hook
  const { data: tasksData, isLoading } = usePendingReviewTasks();

  const tasks = Array.isArray(tasksData) ? tasksData : tasksData?.results || [];

  // Review task mutation using the hook
  const reviewMutation = useReviewTask();

  const handleReview = () => {
    if (!reviewingTask || !reviewAction) return;

    reviewMutation.mutate(
      {
        taskId: reviewingTask.id,
        action: reviewAction,
        notes: reviewAction === 'rejected' ? rejectionReason : reviewNotes,
      },
      {
        onSuccess: () => {
          setReviewingTask(null);
          setReviewAction(null);
          setReviewNotes('');
          setRejectionReason('');
        },
      }
    );
  };

  const renderInputValue = (inputValue: Task['input_values'][0]) => {
    const { field_label, field_type, value_text, value_file, value_number, value_boolean, value_date } = inputValue;

    let displayValue: any = null;

    switch (field_type) {
      case 'text':
      case 'textarea':
      case 'url':
      case 'select':
        displayValue = value_text;
        break;
      case 'number':
        displayValue = value_number;
        break;
      case 'checkbox':
        displayValue = value_boolean ? 'Yes' : 'No';
        break;
      case 'date':
        displayValue = value_date ? new Date(value_date).toLocaleDateString() : null;
        break;
      case 'file_upload':
        displayValue = value_file ? (
          <a
            href={value_file}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            View File <ExternalLink className="h-3 w-3" />
          </a>
        ) : value_text;
        break;
    }

    return (
      <div key={inputValue.id} className="border-b pb-3 last:border-0">
        <div className="text-sm font-medium text-muted-foreground">{field_label}</div>
        <div className="mt-1 text-base">{displayValue || <span className="text-muted-foreground italic">No value</span>}</div>
      </div>
    );
  };

  return (
    <AppLayout
      header={{
        title: 'Task Review Dashboard',
        description: 'Review and approve submitted tasks',
        icon: CheckCircle2,
      }}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm">No tasks pending review at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task: Task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription>
                        {task.song_detail && (
                          <span className="mr-4">Song: {task.song_detail.title}</span>
                        )}
                        Submitted by {task.submitted_by_detail.full_name} •{' '}
                        {formatDistanceToNow(new Date(task.submitted_for_review_at), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-orange-50">
                      Pending Review
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}

                  {/* Submitted Values */}
                  {task.input_values && task.input_values.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="font-medium text-sm">Submitted Information:</div>
                      <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                        {task.input_values.map(renderInputValue)}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setReviewingTask(task);
                        setReviewAction('approved');
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setReviewingTask(task);
                        setReviewAction('changes_requested');
                      }}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setReviewingTask(task);
                        setReviewAction('rejected');
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewingTask} onOpenChange={() => setReviewingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approved' && 'Approve Task'}
              {reviewAction === 'rejected' && 'Reject Task'}
              {reviewAction === 'changes_requested' && 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {reviewingTask?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === 'rejected' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Rejection Reason *
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this task is being rejected..."
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notes {reviewAction !== 'rejected' && '(Optional)'}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending || (reviewAction === 'rejected' && !rejectionReason)}
              className={
                reviewAction === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : reviewAction === 'rejected'
                  ? 'bg-destructive'
                  : ''
              }
            >
              {reviewMutation.isPending ? 'Processing...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
