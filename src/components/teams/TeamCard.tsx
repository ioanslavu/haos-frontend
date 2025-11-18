import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Users, UserPlus } from 'lucide-react';
import { Team } from '@/api/types/team';

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onManageMembers: (team: Team) => void;
}

export const TeamCard = ({
  team,
  onEdit,
  onDelete,
  onManageMembers,
}: TeamCardProps) => {
  // Get up to 5 members for avatar display
  const displayMembers = team.members.slice(0, 5);
  const remainingCount = team.members.length - 5;

  return (
    <Card className={!team.is_active ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{team.name}</CardTitle>
              {!team.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {team.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(team)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageMembers(team)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Manage Members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(team)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Member avatars */}
          <div className="flex items-center">
            {displayMembers.length > 0 ? (
              <div className="flex -space-x-2">
                {displayMembers.map((member) => (
                  <div
                    key={member.id}
                    className="relative"
                    title={member.full_name}
                  >
                    {member.profile_picture ? (
                      <img
                        src={member.profile_picture}
                        alt={member.full_name}
                        className="w-8 h-8 rounded-full border-2 border-background object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {member.first_name?.[0]}
                          {member.last_name?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">+{remainingCount}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">No members</span>
              </div>
            )}
          </div>

          {/* Member count */}
          <div className="text-right">
            <p className="text-sm font-medium">{team.member_count}</p>
            <p className="text-xs text-muted-foreground">
              {team.member_count === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Department badge */}
        <div className="mt-3 pt-3 border-t">
          <Badge variant="outline" className="text-xs">
            {team.department_detail.name}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
