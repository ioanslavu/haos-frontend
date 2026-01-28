/**
 * Common types barrel export file
 * This file re-exports common types used across the application
 */

// Re-export from common API types
export type { PaginatedResponse } from '@/api/types/common';

// Re-export specific type modules for convenience
export * from './campaign';
export * from './contact';
export * from './distribution';
export * from './invoice';
export * from './notes';
export * from './opportunities';
export * from './permissions';
export * from './projects';
export * from './song';
export * from './user';
export * from './camps';
export * from './alertConfiguration';
