import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useDepartmentUsers } from '@/api/hooks/useUsers';
import { assignChecklistItem } from '@/api/songApi';
import { SongChecklistItem } from '@/types/song';

interface AssignChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: number;
  checklistItem: SongChecklistItem | null;
}

const PRIORITY_OPTIONS = [
  { value: '1', label: 'Low' },
  { value: '2', label: 'Normal' },
  { value: '3', label: 'High' },
  { value: '4', label: 'Urgent' },
];

export const AssignChecklistDialog = ({
  open,
  onOpenChange,
  songId,
  checklistItem,
}: AssignChecklistDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [priority, setPriority] = useState<string>('2'); // Normal priority
  const [dueDate, setDueDate] = useState<string>('');

  // Fetch users from department (accessible to managers)
  const { data: usersData, isLoading: usersLoading } = useDepartmentUsers({ is_active: true });
  const users = usersData?.results || [];

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!checklistItem) throw new Error('No checklist item selected');
      if (!selectedUserId) throw new Error('Please select a user');

      return assignChecklistItem(songId, checklistItem.id, {
        user_id: Number(selectedUserId),
        priority: Number(priority),
        due_date: dueDate || undefined,
      });
    },
    onSuccess: () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-for-departments'] });
      // Invalidate song-related queries
      queryClient.invalidateQueries({ queryKey: ['song-checklist', songId] });
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      // Invalidate department users in case assignment counts changed
      queryClient.invalidateQueries({ queryKey: ['department-users'] });
      toast.success('Task created and assigned successfully');
      onOpenChange(false);
      // Reset form
      setSelectedUserId('');
      setPriority('2');
      setDueDate('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to assign checklist item');
    },
  });

  const handleAssign = () => {
    assignMutation.mutate();
  };

  if (!checklistItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Checklist Item</DialogTitle>
          <DialogDescription>
            Assign this checklist item to a user and create a task for them to complete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Checklist Item Info */}
          <div className="space-y-2">
            <Label>Checklist Item</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{checklistItem.item_name}</p>
              <p className="text-xs text-muted-foreground mt-1">{checklistItem.description}</p>
              {checklistItem.recording_title && (
                <p className="text-xs text-blue-600 mt-1">
                  Recording: {checklistItem.recording_title}
                </p>
              )}
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">Assign To *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user">
                <SelectValue placeholder={usersLoading ? 'Loading users...' : 'Select a user'} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date (Optional)</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedUserId || assignMutation.isPending}>
            {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign & Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
