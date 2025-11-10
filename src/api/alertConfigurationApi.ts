/**
 * Alert Configuration API
 *
 * API functions for managing alert configurations.
 * Admin-only operations.
 */

import apiClient from './client';
import { AlertConfiguration, AlertConfigurationUpdate } from '@/types/alertConfiguration';

const ALERT_CONFIG_BASE = '/api/v1/alert-configurations';

/**
 * Fetch all alert configurations
 * Admin-only
 */
export const fetchAlertConfigurations = () => {
  return apiClient.get<AlertConfiguration[]>(`${ALERT_CONFIG_BASE}/`);
};

/**
 * Fetch a specific alert configuration by ID
 * Admin-only
 */
export const fetchAlertConfiguration = (id: number) => {
  return apiClient.get<AlertConfiguration>(`${ALERT_CONFIG_BASE}/${id}/`);
};

/**
 * Update an alert configuration
 * Admin-only
 */
export const updateAlertConfiguration = (id: number, data: AlertConfigurationUpdate) => {
  return apiClient.patch<AlertConfiguration>(`${ALERT_CONFIG_BASE}/${id}/`, data);
};

/**
 * Quick toggle alert enabled/disabled
 * Admin-only
 */
export const toggleAlertConfiguration = (id: number, enabled: boolean) => {
  return apiClient.patch<AlertConfiguration>(`${ALERT_CONFIG_BASE}/${id}/`, { enabled });
};

/**
 * Replace entire alert configuration
 * Admin-only
 */
export const replaceAlertConfiguration = (id: number, data: AlertConfigurationUpdate) => {
  return apiClient.put<AlertConfiguration>(`${ALERT_CONFIG_BASE}/${id}/`, data);
};
