/**
 * AssignmentSection - Distribution team assignments wrapper
 *
 * Uses the shared TeamAssignmentSection component with distribution-specific hooks
 */

import {
  TeamAssignmentSection,
  type Assignment,
  type AssignmentRole,
} from '@/components/teams/TeamAssignmentSection'
import type { DistributionAssignment } from '@/types/distribution'
import { DISTRIBUTION_ASSIGNMENT_ROLE_LABELS } from '@/types/distribution'
import {
  useCreateDistributionAssignment,
  useDeleteDistributionAssignment,
} from '@/api/hooks/useDistributions'

interface AssignmentSectionProps {
  distributionId: number
  assignments: DistributionAssignment[]
  createdBy?: number
  isLoading?: boolean
}

export function AssignmentSection({
  distributionId,
  assignments,
  createdBy,
  isLoading = false,
}: AssignmentSectionProps) {
  const createAssignment = useCreateDistributionAssignment()
  const deleteAssignment = useDeleteDistributionAssignment()

  const handleAddUser = async (userId: number, role: AssignmentRole) => {
    await createAssignment.mutateAsync({
      distributionId,
      userId,
      role,
    })
  }

  const handleRemoveUser = async (assignmentId: number) => {
    await deleteAssignment.mutateAsync({
      distributionId,
      assignmentId,
    })
  }

  // Map DistributionAssignment to generic Assignment
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
      entityId={distributionId}
      assignments={mappedAssignments}
      createdBy={createdBy}
      isLoading={isLoading}
      entityLabel="distribution"
      roleLabels={DISTRIBUTION_ASSIGNMENT_ROLE_LABELS}
      onAddUser={handleAddUser}
      onRemoveUser={handleRemoveUser}
      isPending={createAssignment.isPending || deleteAssignment.isPending}
    />
  )
}
