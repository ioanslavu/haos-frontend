import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDepartmentUsers } from '@/api/hooks/useUsers';
import { User } from '@/api/types/auth';

interface UserSearchComboboxProps {
  value?: number[];
  onValueChange: (userIds: number[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UserSearchCombobox({
  value = [],
  onValueChange,
  placeholder = 'Search users...',
  className,
  disabled = false,
}: UserSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch users from current user's department
  const { data: usersData, isLoading } = useDepartmentUsers();
  const users = usersData?.results || [];

  // Get selected users
  const selectedUsers = users.filter(user => value.includes(user.id));

  // Filter users based on search query and exclude already selected
  const filteredUsers = users.filter(user => {
    if (value.includes(user.id)) return false;
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const fullName = user.full_name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';

    return fullName.includes(query) || email.includes(query);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleAddUser = (userId: number) => {
    if (!value.includes(userId)) {
      onValueChange([...value, userId]);
      setSearchQuery('');
      inputRef.current?.focus();
    }
  };

  const handleRemoveUser = (userId: number) => {
    onValueChange(value.filter(id => id !== userId));
  };

  const getUserDisplay = (user: User) => {
    return user.full_name || user.email;
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          className="pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-white/20 dark:border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No users found' : 'No more users to add'}
            </div>
          ) : (
            <div className="py-1">
              {filteredUsers.slice(0, 50).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleAddUser(user.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 flex items-center gap-2 transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {user.full_name || user.email}
                    </div>
                    {user.full_name && (
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {filteredUsers.length > 50 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                  Showing first 50 results. Refine your search to see more.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Users as Badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              <UserIcon className="h-3 w-3" />
              <span>{getUserDisplay(user)}</span>
              <button
                type="button"
                onClick={() => handleRemoveUser(user.id)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && value.length === 0 && !open && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading users...
        </div>
      )}
    </div>
  );
}
