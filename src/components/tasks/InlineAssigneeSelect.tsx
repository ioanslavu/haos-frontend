import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { User, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsersList } from '@/api/hooks/useUsers';

interface InlineAssigneeSelectProps {
  value: number[];
  onSave: (value: number[]) => Promise<void> | void;
  placeholder?: string;
  label?: string;
  className?: string;
  multiple?: boolean;
  compact?: boolean; // Show only avatar circles, no names
}

export function InlineAssigneeSelect({
  value = [],
  onSave,
  placeholder = 'Add assignee',
  label,
  className,
  multiple = true,
  compact = false,
}: InlineAssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useUsersList({ is_active: true });
  const users = usersData?.results || [];

  // Debug logging
  if (isOpen && usersData) {
    console.log('Users data in assignee select:', usersData);
    console.log('Users array:', users);
    console.log('Users count:', users.length);
  }
  if (isOpen && usersError) {
    console.error('Error loading users:', usersError);
  }

  const assignedUsers = users.filter((u) => value.includes(u.id));

  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleToggleUser = async (userId: number) => {
    setIsSaving(true);
    try {
      let newValue: number[];
      if (multiple) {
        newValue = value.includes(userId)
          ? value.filter((id) => id !== userId)
          : [...value, userId];
      } else {
        newValue = [userId];
        setIsOpen(false);
      }
      await onSave(newValue);
    } catch (error) {
      console.error('Failed to update assignees:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveUser = async (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      await onSave(value.filter((id) => id !== userId));
    } catch (error) {
      console.error('Failed to remove assignee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-auto py-1 px-2 justify-start hover:bg-accent/50 transition-colors duration-200',
            className
          )}
          disabled={isSaving}
        >
          {assignedUsers.length > 0 ? (
            compact ? (
              // Compact mode: Only show overlapping avatar circles
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1.5">
                  {assignedUsers.slice(0, 3).map((user) => (
                    <Avatar key={user.id} className="h-5 w-5 border border-background">
                      <AvatarFallback className="text-[10px] font-medium">
                        {(user.full_name || user.email || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {assignedUsers.length > 3 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    +{assignedUsers.length - 3}
                  </span>
                )}
              </div>
            ) : (
              // Full mode: Show avatar + name + remove button
              <div className="flex items-center gap-2 flex-wrap">
                {label && <span className="text-xs font-medium mr-1">{label}</span>}
                {assignedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1 bg-accent rounded-md px-2 py-0.5"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {(user.full_name || user.email || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user.full_name || user.email}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveUser(user.id, e)}
                      className="h-4 w-4 hover:bg-background rounded-sm flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              {placeholder}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[60]" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {isLoadingUsers ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading users...
            </div>
          ) : usersError ? (
            <div className="text-sm text-destructive text-center py-4">
              Error loading users
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              {users.length === 0 ? 'No users available' : 'No users found'}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = value.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => handleToggleUser(user.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md',
                    'hover:bg-accent transition-colors duration-150',
                    isSelected && 'bg-accent/50'
                  )}
                  disabled={isSaving}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {(user.full_name || user.email || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  {isSelected && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
