import apiClient from './client';
import {
  Camp,
  CampListItem,
  CampCreateInput,
  CampUpdateInput,
  CampFilters,
  PaginatedResponse,
  Artist,
} from '@/types/camps';

const CAMPS_BASE = '/api/v1/camps';

// Camps CRUD
export const fetchCamps = (params?: CampFilters) => {
  return apiClient.get<PaginatedResponse<CampListItem>>(CAMPS_BASE + '/', { params });
};

export const fetchCampDetail = (id: number) => {
  return apiClient.get<Camp>(`${CAMPS_BASE}/${id}/`);
};

export const createCamp = (data: CampCreateInput) => {
  return apiClient.post<Camp>(`${CAMPS_BASE}/`, data);
};

export const updateCamp = (id: number, data: CampUpdateInput) => {
  return apiClient.patch<Camp>(`${CAMPS_BASE}/${id}/`, data);
};

export const deleteCamp = (id: number) => {
  return apiClient.delete(`${CAMPS_BASE}/${id}/`);
};

// Camp actions
export const duplicateCamp = (id: number) => {
  return apiClient.post<Camp>(`${CAMPS_BASE}/${id}/duplicate/`);
};

export const exportCampPDF = (id: number) => {
  return apiClient.post(`${CAMPS_BASE}/${id}/export-pdf/`, {}, { responseType: 'blob' });
};

// Creative artists (for studio artist selection)
export const fetchCreativeArtists = (params?: { search?: string }) => {
  return apiClient.get<Artist[]>('/api/v1/entities/creative/', { params });
};
