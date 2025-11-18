import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, X } from 'lucide-react';
import { useDepartmentUsersForTeam } from '@/api/hooks/useTeams';

interface DepartmentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture: string | null;
}

interface TeamMemberSelectorProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  disabled?: boolean;
}

export const TeamMemberSelector = ({
  selectedIds,
  onSelectionChange,
  disabled = false,
}: TeamMemberSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading } = useDepartmentUsersForTeam();

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (user: DepartmentUser) =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Get selected users for display
  const selectedUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user: DepartmentUser) => selectedIds.includes(user.id));
  }, [users, selectedIds]);

  const handleToggleUser = (userId: number) => {
    if (disabled) return;

    if (selectedIds.includes(userId)) {
      onSelectionChange(selectedIds.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedIds, userId]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    if (disabled) return;
    onSelectionChange(selectedIds.filter((id) => id !== userId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected members badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user: DepartmentUser) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="text-xs">{user.full_name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search department members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>

      {/* User list */}
      <ScrollArea className="h-64 border rounded-md">
        <div className="p-2 space-y-1">
          {filteredUsers && filteredUsers.length > 0 ? (
            filteredUsers.map((user: DepartmentUser) => (
              <div
                key={user.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Checkbox
                  id={`user-${user.id}`}
                  checked={selectedIds.includes(user.id)}
                  onCheckedChange={() => handleToggleUser(user.id)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`user-${user.id}`}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </Label>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4 text-sm">
              {searchQuery
                ? 'No members found matching your search'
                : 'No department members available'}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Selection count */}
      <p className="text-xs text-muted-foreground">
        {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
};
