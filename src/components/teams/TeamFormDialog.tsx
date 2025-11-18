import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Team, TeamCreateInput, TeamUpdateInput } from '@/api/types/team';
import { useCreateTeam, useUpdateTeam } from '@/api/hooks/useTeams';
import { TeamMemberSelector } from './TeamMemberSelector';

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null; // If provided, we're editing; otherwise creating
}

export const TeamFormDialog = ({
  open,
  onOpenChange,
  team,
}: TeamFormDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();

  const isEditing = !!team;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Initialize form when team changes or dialog opens
  useEffect(() => {
    if (open) {
      if (team) {
        setName(team.name);
        setDescription(team.description || '');
        setIsActive(team.is_active);
        setSelectedMemberIds(team.members.map((m) => m.id));
      } else {
        setName('');
        setDescription('');
        setIsActive(true);
        setSelectedMemberIds([]);
      }
    }
  }, [open, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      if (isEditing && team) {
        const data: TeamUpdateInput = {
          name: name.trim(),
          description: description.trim(),
          is_active: isActive,
          member_ids: selectedMemberIds,
        };
        await updateMutation.mutateAsync({ id: team.id, data });
      } else {
        const data: TeamCreateInput = {
          name: name.trim(),
          description: description.trim(),
          is_active: isActive,
          member_ids: selectedMemberIds,
        };
        await createMutation.mutateAsync(data);
      }

      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the mutation hooks
      console.error('Failed to save team:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Team' : 'Create Team'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the team details and members.'
                : 'Create a new team and add members from your department.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                placeholder="Enter team name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter team description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive teams won't appear in assignment dropdowns
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isSaving}
              />
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <Label>Team Members</Label>
              <TeamMemberSelector
                selectedIds={selectedMemberIds}
                onSelectionChange={setSelectedMemberIds}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update Team'
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
