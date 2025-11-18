import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import { Team } from '@/api/types/team';
import {
  useAddTeamMembers,
  useRemoveTeamMembers,
  useDepartmentUsersForTeam,
} from '@/api/hooks/useTeams';

interface DepartmentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture: string | null;
}

interface TeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export const TeamMembersDialog = ({
  open,
  onOpenChange,
  team,
}: TeamMembersDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users, isLoading: isLoadingUsers } = useDepartmentUsersForTeam();
  const addMembersMutation = useAddTeamMembers();
  const removeMembersMutation = useRemoveTeamMembers();

  const isSaving = addMembersMutation.isPending || removeMembersMutation.isPending;

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (user: DepartmentUser) =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Initialize selected members from team
  useEffect(() => {
    if (team && open) {
      setSelectedIds(team.members.map((m) => m.id));
      setSearchQuery('');
    }
  }, [team, open]);

  const handleToggleUser = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!team) return;

    try {
      const currentMemberIds = team.members.map((m) => m.id);

      // Calculate changes
      const toAdd = selectedIds.filter((id) => !currentMemberIds.includes(id));
      const toRemove = currentMemberIds.filter((id) => !selectedIds.includes(id));

      // Execute changes
      if (toRemove.length > 0) {
        await removeMembersMutation.mutateAsync({
          id: team.id,
          data: { user_profile_ids: toRemove },
        });
      }

      if (toAdd.length > 0) {
        await addMembersMutation.mutateAsync({
          id: team.id,
          data: { user_profile_ids: toAdd },
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update team members:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>
            Add or remove members from {team?.name}
          </DialogDescription>
        </DialogHeader>

        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search department members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-96 pr-4">
              <div className="space-y-2">
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user: DepartmentUser) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        id={`member-${user.id}`}
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
                      <Label
                        htmlFor={`member-${user.id}`}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={user.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    {searchQuery
                      ? 'No members found matching your search'
                      : 'No department members available'}
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Selection count */}
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
            </p>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoadingUsers}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
