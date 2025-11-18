import { Loader2, Users } from 'lucide-react';
import { Team } from '@/api/types/team';
import { TeamCard } from './TeamCard';

interface TeamListProps {
  teams: Team[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onManageMembers: (team: Team) => void;
}

export const TeamList = ({
  teams,
  isLoading,
  error,
  onEdit,
  onDelete,
  onManageMembers,
}: TeamListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">Error loading teams</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message || 'An unexpected error occurred'}
        </p>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No teams found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new team to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          onEdit={onEdit}
          onDelete={onDelete}
          onManageMembers={onManageMembers}
        />
      ))}
    </div>
  );
};
