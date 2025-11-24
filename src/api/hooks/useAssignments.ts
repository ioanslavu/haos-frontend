import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import {
  SocialMediaManagerAssignment,
  AssignmentCreateInput,
  AssignmentUpdateInput,
  TeamMember,
  AssignableArtist,
} from '../types/assignments';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-handler';

// API endpoints
const ASSIGNMENTS_BASE_URL = '/api/v1/entities/sm-assignments';

// Fetch all assignments with optional filters
export const useAssignments = (params?: {
  social_media_manager?: number;
  artist?: number;
  department?: string;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  // Always add page_size to get all results
  queryParams.append('page_size', '1000');

  return useQuery({
    queryKey: ['social-media-assignments', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: SocialMediaManagerAssignment[] }>(
        `${ASSIGNMENTS_BASE_URL}/?${queryParams.toString()}`
      );
      return response.data.results;
    },
  });
};

// Fetch single assignment
export const useAssignment = (id: number) => {
  return useQuery({
    queryKey: ['social-media-assignments', id],
    queryFn: async () => {
      const response = await apiClient.get<SocialMediaManagerAssignment>(
        `${ASSIGNMENTS_BASE_URL}/${id}/`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

// Fetch assignments for a specific social media manager
export const useManagerAssignments = (managerId: number | undefined) => {
  return useAssignments(managerId ? { social_media_manager: managerId } : undefined);
};

// Fetch assignments for a specific artist
export const useArtistAssignments = (artistId: number | undefined) => {
  return useAssignments(artistId ? { artist: artistId } : undefined);
};

// Fetch marketing team members
export const useMarketingTeam = () => {
  return useQuery({
    queryKey: ['users', { department: 'marketing' }],
    queryFn: async () => {
      const response = await apiClient.get<{ results: TeamMember[] }>(
        '/api/v1/users/?department=marketing&page_size=1000'
      );
      return response.data.results;
    },
  });
};

// Fetch assignable artists (internal creatives: artists, producers, lyricists)
export const useAssignableArtists = () => {
  return useQuery({
    queryKey: ['entities', { role: 'creative', is_internal: true }],
    queryFn: async () => {
      // Helper function to fetch all pages for a given role
      const fetchAllPages = async (role: string): Promise<AssignableArtist[]> => {
        let allResults: AssignableArtist[] = [];
        let nextUrl: string | null = `/api/v1/entities/?entity_roles__role=${role}&entity_roles__is_internal=true&page_size=100`;

        while (nextUrl) {
          const response = await apiClient.get<{ results: AssignableArtist[]; next: string | null }>(nextUrl);
          allResults = [...allResults, ...response.data.results];
          nextUrl = response.data.next;

          // If next URL is absolute, convert to relative
          if (nextUrl && nextUrl.startsWith('http')) {
            const url = new URL(nextUrl);
            nextUrl = url.pathname + url.search;
          }
        }

        return allResults;
      };

      // Fetch all internal creative people (artists, producers, lyricists)
      const [artists, producers, lyricists] = await Promise.all([
        fetchAllPages('artist'),
        fetchAllPages('producer'),
        fetchAllPages('lyricist'),
      ]);

      // Combine and deduplicate by ID
      const allCreatives = [...artists, ...producers, ...lyricists];

      // Remove duplicates based on ID
      const uniqueCreatives = allCreatives.reduce((acc, creative) => {
        if (!acc.find((c) => c.id === creative.id)) {
          acc.push(creative);
        }
        return acc;
      }, [] as AssignableArtist[]);

      // Sort by display name
      return uniqueCreatives.sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
  });
};

// Create assignment mutation
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignmentCreateInput) => {
      const response = await apiClient.post<SocialMediaManagerAssignment>(
        `${ASSIGNMENTS_BASE_URL}/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Artist assigned successfully');
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'assigning artist',
        showToast: true,
      });
    },
  });
};

// Update assignment mutation
export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AssignmentUpdateInput }) => {
      const response = await apiClient.patch<SocialMediaManagerAssignment>(
        `${ASSIGNMENTS_BASE_URL}/${id}/`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['social-media-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-assignments', variables.id] });
      toast.success('Assignment updated successfully');
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'updating assignment',
        showToast: true,
      });
    },
  });
};

// Delete assignment mutation (soft delete)
export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${ASSIGNMENTS_BASE_URL}/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Assignment removed successfully');
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'removing assignment',
        showToast: true,
      });
    },
  });
};

// Bulk assignment operations
export const useBulkAssignments = () => {
  const createMutation = useCreateAssignment();
  const deleteMutation = useDeleteAssignment();

  // Process assignments sequentially to avoid rate limiting (429 errors)
  const assignArtists = async (managerId: number, artistIds: number[]) => {
    const results: SocialMediaManagerAssignment[] = [];
    const errors: Error[] = [];

    for (const artistId of artistIds) {
      try {
        const result = await createMutation.mutateAsync({
          social_media_manager: managerId,
          artist: artistId,
        });
        results.push(result);
      } catch (error) {
        errors.push(error as Error);
        // Continue with remaining assignments even if one fails
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw errors[0]; // Throw if all failed
    }

    return results;
  };

  // Process deletions sequentially to avoid rate limiting
  const unassignArtists = async (assignmentIds: number[]) => {
    for (const id of assignmentIds) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        // Continue with remaining deletions even if one fails
        console.error(`Failed to delete assignment ${id}:`, error);
      }
    }
  };

  return {
    assignArtists,
    unassignArtists,
    isLoading: createMutation.isPending || deleteMutation.isPending,
  };
};
