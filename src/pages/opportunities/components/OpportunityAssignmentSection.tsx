/**
 * OpportunityAssignmentSection - Opportunity team assignments wrapper
 *
 * Uses the shared TeamAssignmentSection component with opportunity-specific hooks
 */

import {
  TeamAssignmentSection,
  type Assignment,
  type AssignmentRole,
} from '@/components/teams/TeamAssignmentSection'
import type { OpportunityAssignment } from '@/types/opportunities'
import { OPPORTUNITY_ASSIGNMENT_ROLE_LABELS } from '@/types/opportunities'
import {
  useCreateOpportunityAssignment,
  useDeleteOpportunityAssignment,
} from '@/api/hooks/useOpportunities'

interface OpportunityAssignmentSectionProps {
  opportunityId: number
  assignments: OpportunityAssignment[]
  createdBy?: number
  isLoading?: boolean
}

export function OpportunityAssignmentSection({
  opportunityId,
  assignments,
  createdBy,
  isLoading = false,
}: OpportunityAssignmentSectionProps) {
  const createAssignment = useCreateOpportunityAssignment()
  const deleteAssignment = useDeleteOpportunityAssignment()

  const handleAddUser = async (userId: number, role: AssignmentRole) => {
    await createAssignment.mutateAsync({
      opportunityId,
      userId,
      role,
    })
  }

  const handleRemoveUser = async (assignmentId: number) => {
    await deleteAssignment.mutateAsync({
      opportunityId,
      assignmentId,
    })
  }

  // Map OpportunityAssignment to generic Assignment
  const mappedAssignments: Assignment[] = assignments.map((a) => ({
    id: a.id,
    user: a.user,
    role: a.role,
    user_email: a.user_email,
    user_name: a.user_name,
    user_first_name: a.user_first_name,
    user_last_name: a.user_last_name,
  }))

  return (
    <TeamAssignmentSection
      entityId={opportunityId}
      assignments={mappedAssignments}
      createdBy={createdBy}
      isLoading={isLoading}
      entityLabel="opportunity"
      roleLabels={OPPORTUNITY_ASSIGNMENT_ROLE_LABELS}
      onAddUser={handleAddUser}
      onRemoveUser={handleRemoveUser}
      isPending={createAssignment.isPending || deleteAssignment.isPending}
    />
  )
}
