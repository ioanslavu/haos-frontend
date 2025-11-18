import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Trash2,
  Users,
  Calendar,
  Search,
  X,
  Check,
} from 'lucide-react';
import { Team } from '@/api/types/team';
import {
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useDepartmentUsersForTeam,
} from '@/api/hooks/useTeams';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DepartmentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  profile_picture: string | null;
}

interface TeamDetailPanelProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createMode?: boolean;
}

export function TeamDetailPanel({
  team,
  open,
  onOpenChange,
  createMode = false,
}: TeamDetailPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localName, setLocalName] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localIsActive, setLocalIsActive] = useState(true);
  const [localMemberIds, setLocalMemberIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'creating'>('idle');
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState<number | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading: isLoadingUsers } = useDepartmentUsersForTeam();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const isCreateMode = createMode && !team && !createdTeamId;

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user: DepartmentUser) =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Get selected users for display
  const selectedUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user: DepartmentUser) => localMemberIds.includes(user.id));
  }, [users, localMemberIds]);

  // Focus name input in create mode
  useEffect(() => {
    if (open && isCreateMode && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, isCreateMode]);

  // Initialize local state when team changes or when opening
  useEffect(() => {
    if (open) {
      if (team) {
        setLocalName(team.name || '');
        setLocalDescription(team.description || '');
        setLocalIsActive(team.is_active);
        setLocalMemberIds(team.members.map((m) => m.id));
        setSaveState('idle');
        setCreatedTeamId(null);
      } else if (createMode) {
        setLocalName('');
        setLocalDescription('');
        setLocalIsActive(true);
        setLocalMemberIds([]);
        setSaveState('idle');
        setCreatedTeamId(null);
      }
      setSearchQuery('');
    }
  }, [team, open, createMode]);

  // Auto-save with debounce
  useEffect(() => {
    if (!open) return;
    if (!localName.trim()) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const needsCreate = isCreateMode && !createdTeamId;
    const needsUpdate =
      (team || createdTeamId) &&
      (localName !== (team?.name || '') ||
        localDescription !== (team?.description || '') ||
        localIsActive !== (team?.is_active ?? true) ||
        JSON.stringify(localMemberIds.sort()) !==
          JSON.stringify((team?.members.map((m) => m.id) || []).sort()));

    if (needsCreate || needsUpdate) {
      setSaveState(needsCreate ? 'creating' : 'dirty');

      debounceTimerRef.current = setTimeout(async () => {
        try {
          if (needsCreate) {
            setSaveState('creating');
            const newTeam = await createTeam.mutateAsync({
              name: localName,
              description: localDescription || undefined,
              is_active: localIsActive,
              member_ids: localMemberIds,
            });
            setCreatedTeamId(newTeam.id);
            setSaveState('idle');
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
          } else {
            setSaveState('saving');
            const teamId = team?.id || createdTeamId!;
            await updateTeam.mutateAsync({
              id: teamId,
              data: {
                name: localName,
                description: localDescription || undefined,
                is_active: localIsActive,
                member_ids: localMemberIds,
              },
            });
            setSaveState('idle');
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
          }
        } catch (error) {
          setSaveState('idle');
        }
      }, 1000);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    localName,
    localDescription,
    localIsActive,
    localMemberIds,
    team,
    createdTeamId,
    open,
    isCreateMode,
  ]);

  const handleClose = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);

      if (isCreateMode && localName.trim() && !createdTeamId) {
        createTeam.mutate(
          {
            name: localName,
            description: localDescription || undefined,
            is_active: localIsActive,
            member_ids: localMemberIds,
          },
          {
            onSuccess: (response) => {
              setCreatedTeamId(response.id);
              onOpenChange(false);
            },
          }
        );
      } else {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    const teamId = team?.id || createdTeamId;
    if (!teamId) return;

    try {
      await deleteTeam.mutateAsync(teamId);
      toast.success('Team deleted');
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch {
      toast.error('Failed to delete team');
    }
  };

  const handleToggleMember = (userId: number) => {
    setLocalMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemoveMember = (userId: number) => {
    setLocalMemberIds((prev) => prev.filter((id) => id !== userId));
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showDeleteDialog && (team || createdTeamId)) {
        handleClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && (team || createdTeamId)) {
        e.preventDefault();
        setShowDeleteDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, showDeleteDialog, team, createdTeamId]);

  if (!open || (!createMode && !team)) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          className={cn(
            'w-full sm:max-w-xl overflow-y-auto p-0',
            'animate-in slide-in-from-right duration-300 ease-out'
          )}
          onCloseAutoFocus={(e) => {
            // Ensure body pointer-events is restored when sheet closes
            document.body.style.pointerEvents = '';
          }}
        >
          <div className="px-6 py-6 space-y-6">
            {/* Save State Indicator */}
            <div className="flex items-center justify-end h-5">
              {saveState === 'saving' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveState === 'creating' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating...
                </span>
              )}
              {showSavedIndicator && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>

            {/* Team Name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">
                Team Name {isCreateMode && '*'}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder={isCreateMode ? 'Team name...' : 'Team name'}
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full text-3xl font-bold bg-transparent px-1 py-2 placeholder:text-muted-foreground/30"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              />
              {isCreateMode && !localName && (
                <p className="text-xs text-muted-foreground/70 pl-1">
                  Start typing to create the team...
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </label>
              <textarea
                placeholder="Add a description..."
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                rows={3}
                className="w-full text-sm bg-transparent px-3 py-2 border rounded-md resize-none placeholder:text-muted-foreground/50"
              />
            </div>

            <Separator />

            {/* Properties */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Properties
              </h4>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is-active" className="text-sm">
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive teams won't appear in assignments
                  </p>
                </div>
                <Switch
                  id="is-active"
                  checked={localIsActive}
                  onCheckedChange={setLocalIsActive}
                />
              </div>
            </div>

            <Separator />

            {/* Team Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members ({localMemberIds.length})
                </h4>
              </div>

              {/* Selected members badges */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user: DepartmentUser) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt=""
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px]">
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </span>
                      )}
                      <span className="text-xs">{user.full_name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(user.id)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search department members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* User list */}
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
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
                            checked={localMemberIds.includes(user.id)}
                            onCheckedChange={() => handleToggleMember(user.id)}
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
                              <p className="font-medium text-sm truncate">
                                {user.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        {searchQuery
                          ? 'No members found'
                          : 'No department members available'}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Timeline */}
            {team && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created:</span>
                      <span>{format(new Date(team.created_at), 'PPP')}</span>
                    </div>
                    {team.created_by_email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>By:</span>
                        <span>{team.created_by_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Delete Team */}
            {(team || createdTeamId) && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors underline underline-offset-2"
                >
                  Delete team
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{team?.name || localName || 'this team'}"?
              This will mark the team as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
