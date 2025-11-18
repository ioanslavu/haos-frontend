import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssignableTeams } from '@/api/hooks/useTeams';
import { TaskTeamDetail } from '@/api/types/tasks';

interface InlineTeamSelectProps {
  value?: number | null;
  teamDetail?: TaskTeamDetail | null;
  onSave: (value: number | null) => Promise<void> | void;
  placeholder?: string;
  className?: string;
}

export function InlineTeamSelect({
  value,
  teamDetail,
  onSave,
  placeholder = 'Add team',
  className,
}: InlineTeamSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: teams = [], isLoading, error } = useAssignableTeams();

  const selectedTeam = teamDetail || teams.find((t) => t.id === value);

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSelectTeam = async (teamId: number | null) => {
    setIsSaving(true);
    try {
      await onSave(teamId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update team:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleSelectTeam(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-auto py-1 px-2 justify-start hover:bg-accent/50 transition-colors duration-200',
            className
          )}
          disabled={isSaving}
        >
          {selectedTeam ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-accent rounded-md px-2 py-0.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">{selectedTeam.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  ({selectedTeam.member_count})
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClear(e as any);
                    }
                  }}
                  className="h-4 w-4 hover:bg-background rounded-sm flex items-center justify-center cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              {placeholder}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-background border-border" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading teams...
            </div>
          ) : error ? (
            <div className="text-sm text-destructive text-center py-4">
              Error loading teams
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              {teams.length === 0 ? 'No teams available' : 'No teams found'}
            </div>
          ) : (
            filteredTeams.map((team) => {
              const isSelected = value === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md',
                    'hover:bg-accent transition-colors duration-150',
                    isSelected && 'bg-accent/50'
                  )}
                  disabled={isSaving}
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{team.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                    </div>
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
