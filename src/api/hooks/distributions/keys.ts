/**
 * Distribution Query Keys - Factory for all distribution-related query keys
 */

import type { DistributionFilters } from '@/types/distribution'

export const distributionKeys = {
  all: ['distributions'] as const,

  // Lists
  lists: () => [...distributionKeys.all, 'list'] as const,
  list: (filters?: DistributionFilters & { page?: number; page_size?: number; ordering?: string }) =>
    [...distributionKeys.lists(), filters] as const,
  infinite: (filters?: DistributionFilters) => [...distributionKeys.lists(), 'infinite', filters] as const,

  // Details
  details: () => [...distributionKeys.all, 'detail'] as const,
  detail: (id: number) => [...distributionKeys.details(), id] as const,

  // Stats
  stats: (filters?: DistributionFilters) => [...distributionKeys.all, 'stats', filters] as const,

  // Catalog Items
  catalogItems: (distributionId: number) => [...distributionKeys.detail(distributionId), 'catalog-items'] as const,
  catalogItemList: (distributionId: number, filters?: { page?: number; page_size?: number }) =>
    filters
      ? [...distributionKeys.catalogItems(distributionId), filters] as const
      : distributionKeys.catalogItems(distributionId),
  catalogItemDetail: (distributionId: number, catalogItemId: number) =>
    [...distributionKeys.catalogItems(distributionId), catalogItemId] as const,

  // Revenue Reports
  revenueReports: (distributionId: number, catalogItemId: number) =>
    [...distributionKeys.catalogItemDetail(distributionId, catalogItemId), 'revenue-reports'] as const,

  // Songs (External)
  songs: (distributionId: number) => [...distributionKeys.detail(distributionId), 'songs'] as const,
  songList: (distributionId: number, filters?: { page?: number; page_size?: number }) =>
    filters
      ? [...distributionKeys.songs(distributionId), filters] as const
      : distributionKeys.songs(distributionId),
  songDetail: (distributionId: number, songId: number) =>
    [...distributionKeys.songs(distributionId), songId] as const,

  // Assignments
  assignments: (distributionId: number) => [...distributionKeys.detail(distributionId), 'assignments'] as const,

  // Invoices
  invoices: (distributionId: number) => ['distributions', distributionId, 'invoices'] as const,
}
