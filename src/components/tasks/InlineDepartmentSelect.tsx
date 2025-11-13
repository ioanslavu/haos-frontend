import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Building2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Department {
  id: number;
  name: string;
}

interface InlineDepartmentSelectProps {
  value: number | null;
  departments: Department[];
  onSave: (value: number | null) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

export function InlineDepartmentSelect({
  value,
  departments = [],
  onSave,
  placeholder = 'Select department',
  className,
  isLoading = false,
}: InlineDepartmentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedDepartment = departments.find((d) => d.id === value);

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDepartment = async (deptId: number) => {
    setIsSaving(true);
    try {
      await onSave(deptId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update department:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDepartment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      await onSave(null);
    } catch (error) {
      console.error('Failed to remove department:', error);
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
          disabled={isSaving || isLoading}
        >
          {selectedDepartment ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-accent rounded-md px-2 py-0.5">
                <Building2 className="h-4 w-4" />
                <span className="text-xs">{selectedDepartment.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveDepartment}
                  className="h-4 w-4 hover:bg-background rounded-sm flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {placeholder}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[60]" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading departments...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              {departments.length === 0 ? 'No departments available' : 'No departments found'}
            </div>
          ) : (
            filteredDepartments.map((dept) => {
              const isSelected = value === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md',
                    'hover:bg-accent transition-colors duration-150',
                    isSelected && 'bg-accent/50'
                  )}
                  disabled={isSaving}
                >
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{dept.name}</div>
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
