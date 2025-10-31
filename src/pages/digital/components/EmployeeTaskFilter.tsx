import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsersList } from '@/api/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { Users, X } from 'lucide-react';

interface EmployeeTaskFilterProps {
  selectedEmployees: number[];
  onSelectionChange: (employeeIds: number[]) => void;
}

export function EmployeeTaskFilter({
  selectedEmployees,
  onSelectionChange,
}: EmployeeTaskFilterProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  // Only show this component if user is a manager
  const isManager = currentUser?.profile?.is_manager;
  if (!isManager) return null;

  // Fetch digital department users
  const { data: usersData } = useUsersList({ department: 'digital' });
  const users = usersData?.results || [];

  const toggleEmployee = (userId: number) => {
    if (selectedEmployees.includes(userId)) {
      onSelectionChange(selectedEmployees.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedEmployees, userId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(users.map((u: any) => u.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const selectedUsers = users.filter((u: any) => selectedEmployees.includes(u.id));

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Employee Filter
            {selectedEmployees.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedEmployees.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filter by Employee</h4>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 rounded-lg hover:bg-accent p-2 cursor-pointer"
                  onClick={() => toggleEmployee(user.id)}
                >
                  <Checkbox
                    checked={selectedEmployees.includes(user.id)}
                    onCheckedChange={() => toggleEmployee(user.id)}
                  />
                  <label className="flex-1 text-sm cursor-pointer">
                    {user.full_name || user.email}
                  </label>
                </div>
              ))}
            </div>

            {selectedEmployees.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''}{' '}
                  selected
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected employees badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.slice(0, 3).map((user: any) => (
            <Badge key={user.id} variant="secondary" className="gap-1">
              {user.full_name || user.email}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleEmployee(user.id)}
              />
            </Badge>
          ))}
          {selectedUsers.length > 3 && (
            <Badge variant="secondary">+{selectedUsers.length - 3} more</Badge>
          )}
        </div>
      )}
    </div>
  );
}
