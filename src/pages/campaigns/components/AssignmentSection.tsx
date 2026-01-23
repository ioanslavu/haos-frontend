/**
 * AssignmentSection - Campaign team assignments wrapper
 *
 * Uses the shared TeamAssignmentSection component with campaign-specific hooks
 */

import {
  TeamAssignmentSection,
  type Assignment,
  type AssignmentRole,
} from '@/components/teams/TeamAssignmentSection'
import type { CampaignAssignment } from '@/types/campaign'
import { CAMPAIGN_ASSIGNMENT_ROLE_LABELS } from '@/types/campaign'
import {
  useCreateCampaignAssignment,
  useDeleteCampaignAssignment,
} from '@/api/hooks/useCampaigns'

interface AssignmentSectionProps {
  campaignId: number
  assignments: CampaignAssignment[]
  createdBy?: number
  isLoading?: boolean
}

export function AssignmentSection({
  campaignId,
  assignments,
  createdBy,
  isLoading = false,
}: AssignmentSectionProps) {
  const createAssignment = useCreateCampaignAssignment()
  const deleteAssignment = useDeleteCampaignAssignment()

  const handleAddUser = async (userId: number, role: AssignmentRole) => {
    await createAssignment.mutateAsync({
      campaignId,
      userId,
      role,
    })
  }

  const handleRemoveUser = async (assignmentId: number) => {
    await deleteAssignment.mutateAsync({
      campaignId,
      assignmentId,
    })
  }

  // Map CampaignAssignment to generic Assignment
  const mappedAssignments: Assignment[] = assignments.map((a) => ({
    id: a.id,
    user: a.user,
    role: a.role,
    user_email: a.user_email,
    user_name: a.user_name,
  }))

  return (
    <TeamAssignmentSection
      entityId={campaignId}
      assignments={mappedAssignments}
      createdBy={createdBy}
      isLoading={isLoading}
      entityLabel="campaign"
      roleLabels={CAMPAIGN_ASSIGNMENT_ROLE_LABELS}
      onAddUser={handleAddUser}
      onRemoveUser={handleRemoveUser}
      isPending={createAssignment.isPending || deleteAssignment.isPending}
    />
  )
}
