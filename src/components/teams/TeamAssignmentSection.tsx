/**
 * TeamAssignmentSection - Generic team assignment component
 *
 * A reusable component for managing team assignments across different domains
 * (campaigns, distributions, etc.)
 *
 * Features:
 * - Display assigned team members with role badges
 * - Inline user search and selection (no modal)
 * - Remove team members
 * - Creator is marked with crown icon
 */

import { useState, useMemo } from 'react'
import { Users, Plus, X, Loader2, Search, Crown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn, getInitials } from '@/lib/utils'
import { useUsersList } from '@/api/hooks/useUsers'

export type AssignmentRole = 'lead' | 'support' | 'observer'

export interface Assignment {
  id: number
  user: number
  role: AssignmentRole
  user_email: string
  user_name?: string
  user_first_name?: string
  user_last_name?: string
}

interface TeamAssignmentSectionProps {
  /** Unique identifier for the parent entity (campaign, distribution, etc.) */
  entityId: number
  /** Current list of assignments */
  assignments: Assignment[]
  /** User ID of the creator (shown with crown icon) */
  createdBy?: number
  /** Loading state */
  isLoading?: boolean
  /** Label for the entity type (e.g., "campaign", "distribution") */
  entityLabel?: string
  /** Role labels to display */
  roleLabels?: Record<AssignmentRole, string>
  /** Callback when adding a user */
  onAddUser: (userId: number, role: AssignmentRole) => Promise<void>
  /** Callback when removing a user */
  onRemoveUser: (assignmentId: number) => Promise<void>
  /** Whether add/remove operations are pending */
  isPending?: boolean
}

const DEFAULT_ROLE_LABELS: Record<AssignmentRole, string> = {
  lead: 'Lead',
  support: 'Support',
  observer: 'Observer',
}

const ROLE_COLORS: Record<AssignmentRole, string> = {
  lead: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  support: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  observer: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
}

const ROLE_DOT_COLORS: Record<AssignmentRole, string> = {
  lead: 'bg-purple-500',
  support: 'bg-blue-500',
  observer: 'bg-gray-500',
}

export function TeamAssignmentSection({
  entityId,
  assignments,
  createdBy,
  isLoading = false,
  entityLabel = 'entity',
  roleLabels = DEFAULT_ROLE_LABELS,
  onAddUser,
  onRemoveUser,
  isPending = false,
}: TeamAssignmentSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<AssignmentRole>('support')
  const [removeConfirm, setRemoveConfirm] = useState<Assignment | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Fetch users when add form is shown
  const { data: usersData, isLoading: usersLoading } = useUsersList(
    { page_size: 100 },
    showAddForm
  )

  // Get user IDs that are already assigned
  const assignedUserIds = assignments.map((a) => a.user)

  // Filter users based on search and exclude already assigned
  const filteredUsers = useMemo(() => {
    if (!usersData?.results) return []

    return usersData.results.filter((user) => {
      if (assignedUserIds.includes(user.id)) return false

      if (search) {
        const searchLower = search.toLowerCase()
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase()
        const email = (user.email || '').toLowerCase()
        return fullName.includes(searchLower) || email.includes(searchLower)
      }

      return true
    })
  }, [usersData, search, assignedUserIds])

  const handleAddUser = async (userId: number) => {
    setIsAdding(true)
    try {
      await onAddUser(userId, selectedRole)
      setSearch('')
      setSelectedRole('support')
      setShowAddForm(false)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveUser = async () => {
    if (!removeConfirm?.id) return
    setIsRemoving(true)
    try {
      await onRemoveUser(removeConfirm.id)
      setRemoveConfirm(null)
    } finally {
      setIsRemoving(false)
    }
  }

  const handleCloseAddForm = () => {
    setShowAddForm(false)
    setSearch('')
    setSelectedRole('support')
  }

  const getUserName = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim()
    }
    return email || 'Unknown'
  }

  return (
    <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team
          {assignments.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {assignments.length}
            </Badge>
          )}
        </h3>
        {!showAddForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="rounded-lg h-8"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Inline Add Form */}
          {showAddForm && (
            <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
              {/* Header with Role Picker */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Add as:</span>
                  <div className="flex gap-1">
                    {(['lead', 'support', 'observer'] as AssignmentRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                          'flex items-center gap-1.5',
                          selectedRole === role
                            ? cn('ring-2 ring-offset-1 ring-offset-background', ROLE_COLORS[role])
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', ROLE_DOT_COLORS[role])} />
                        {roleLabels[role]}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseAddForm}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                  autoFocus
                />
              </div>

              {/* User Results */}
              <div className="max-h-48 overflow-y-auto rounded-lg border bg-background">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {search ? 'No users found' : 'All users already assigned'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.slice(0, 8).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAddUser(user.id)}
                        disabled={isAdding || isPending}
                        className={cn(
                          'w-full flex items-center gap-3 p-2.5 text-left transition-colors',
                          'hover:bg-muted/50 disabled:opacity-50'
                        )}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(getUserName(user.first_name, user.last_name, user.email))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {getUserName(user.first_name, user.last_name, user.email)}
                          </p>
                          {(user.first_name || user.last_name) && user.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn('w-1.5 h-1.5 rounded-full', ROLE_DOT_COLORS[selectedRole])} />
                          <span>{roleLabels[selectedRole]}</span>
                        </div>
                      </button>
                    ))}
                    {filteredUsers.length > 8 && (
                      <div className="py-2 text-center text-xs text-muted-foreground">
                        +{filteredUsers.length - 8} more - refine search
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment List */}
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((assignment) => {
                const isCreator = createdBy && assignment.user === createdBy
                const isLead = assignment.role === 'lead'

                return (
                  <div
                    key={assignment.id || assignment.user}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl transition-colors',
                      'bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback
                          className={cn(
                            'text-xs font-medium',
                            isLead ? 'bg-purple-500/20 text-purple-600' : 'bg-primary/10'
                          )}
                        >
                          {getInitials(assignment.user_name || assignment.user_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {assignment.user_name || assignment.user_email || 'Unknown User'}
                          </span>
                          {isCreator && (
                            <Crown className="h-3 w-3 text-amber-500 shrink-0" title={`${entityLabel} Creator`} />
                          )}
                        </div>
                        {assignment.user_email && assignment.user_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {assignment.user_email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', ROLE_COLORS[assignment.role])}
                      >
                        {roleLabels[assignment.role] || assignment.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoveConfirm(assignment)}
                        disabled={isRemoving || isPending}
                        title={`Remove from ${entityLabel}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !showAddForm ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-primary/60" />
              </div>
              <p className="text-muted-foreground text-sm mb-2">No team members</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="rounded-lg text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Member
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeConfirm} onOpenChange={(open) => !open && setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{removeConfirm?.user_name || removeConfirm?.user_email}</strong> from
              this {entityLabel}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving || isPending}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleRemoveUser}
              disabled={isRemoving || isPending}
              variant="destructive"
            >
              {(isRemoving || isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
