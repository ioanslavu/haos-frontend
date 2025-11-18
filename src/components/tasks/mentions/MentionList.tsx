import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SuggestionProps } from '@tiptap/suggestion';
import { useDepartmentUsers } from '@/api/hooks/useUsers';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MentionListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const MentionList = forwardRef<MentionListRef, SuggestionProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users from department with search
  const { data: usersData, isLoading } = useDepartmentUsers({
    search: searchQuery,
    is_active: true,
    page_size: 10,
  });

  const users = usersData?.results || [];

  // Update search query when query prop changes
  useEffect(() => {
    setSearchQuery(props.query);
    setSelectedIndex(0);
  }, [props.query]);

  const selectItem = (index: number) => {
    const user = users[index];

    if (user) {
      props.command({
        id: user.id.toString(),
        label: `${user.first_name} ${user.last_name} (@${user.username})`,
      });
    }
  };

  const upHandler = () => {
    setSelectedIndex((prevIndex) => (prevIndex + users.length - 1) % users.length);
  };

  const downHandler = () => {
    setSelectedIndex((prevIndex) => (prevIndex + 1) % users.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  // Don't render anything if search query is too short
  if (searchQuery.length < 2) {
    return null;
  }

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden w-[260px] pointer-events-auto z-[9999] relative">
      <Command className="bg-transparent">
        <CommandList className="max-h-[200px]">
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching users...</span>
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6">
                <UserX className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No users found matching "{searchQuery}"
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Only users in your department are shown
                </p>
              </div>
            </CommandEmpty>
          )}

          {!isLoading && users.length > 0 && (
            <CommandGroup>
              {users.map((user, index) => (
                <CommandItem
                  key={user.id}
                  value={user.id.toString()}
                  onSelect={() => selectItem(index)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 cursor-pointer',
                    index === selectedIndex && 'bg-accent'
                  )}
                >
                  {/* Avatar or initials */}
                  <div className="flex-shrink-0">
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.full_name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-primary">
                          {user.first_name[0]}
                          {user.last_name[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">{user.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      @{user.username}
                      {user.department_detail && ` · ${user.department_detail.name}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
});

MentionList.displayName = 'MentionList';
