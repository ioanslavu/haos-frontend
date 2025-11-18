import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useTeams } from '@/api/hooks/useTeams';
import { Team } from '@/api/types/team';
import {
  TeamList,
  TeamDetailPanel,
} from '@/components/teams';

const TeamsPage = () => {
  const [showInactive, setShowInactive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const { data: teams, isLoading, error } = useTeams({
    include_inactive: showInactive,
  });

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsCreateMode(true);
    setPanelOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsCreateMode(false);
    setPanelOpen(true);
  };

  const handleManageMembers = (team: Team) => {
    // Open panel in edit mode - same as edit
    setSelectedTeam(team);
    setIsCreateMode(false);
    setPanelOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    // Open panel in edit mode - delete is handled in the panel
    setSelectedTeam(team);
    setIsCreateMode(false);
    setPanelOpen(true);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage teams within your department
            </p>
          </div>
          <Button onClick={handleCreateTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              Show inactive teams
            </Label>
          </div>
        </div>

        {/* Team List */}
        <TeamList
          teams={teams}
          isLoading={isLoading}
          error={error}
          onEdit={handleEditTeam}
          onDelete={handleDeleteTeam}
          onManageMembers={handleManageMembers}
        />
      </div>

      {/* Team Detail Panel (Create/Edit) */}
      <TeamDetailPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        team={selectedTeam}
        createMode={isCreateMode}
      />
    </AppLayout>
  );
};

export default TeamsPage;
