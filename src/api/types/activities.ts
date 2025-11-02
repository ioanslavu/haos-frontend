// Activity related types

export type ActivityType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'video_call'
  | 'note'
  | 'follow_up'
  | 'task_created'
  | 'status_change'
  | 'document'
  | 'social_media'
  | 'event'
  | 'negotiation';

export type ActivitySentiment =
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative';

export type ActivityDirection = 'inbound' | 'outbound' | 'internal';

export interface ActivityUserDetail {
  id: number;
  email: string;
  full_name: string;
}

export interface ActivityEntityDetail {
  id: number;
  display_name: string;
  kind: 'PF' | 'PJ';
}

export interface ActivityCampaignDetail {
  id: number;
  name: string;
  status: string;
}

export interface ActivityContactPersonDetail {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface ActivityTaskDetail {
  id: number;
  title: string;
  status: string;
  due_date?: string;
}

export interface Activity {
  id: number;
  type: ActivityType;
  subject: string;
  content?: string;

  // Relationships
  entity?: number;
  entity_detail?: ActivityEntityDetail;
  contact_person?: number;
  contact_person_detail?: ActivityContactPersonDetail;
  campaign?: number;
  campaign_detail?: ActivityCampaignDetail;
  contract?: number;

  // Participants
  created_by?: number;
  created_by_detail?: ActivityUserDetail;
  participants?: number[];
  participants_detail?: ActivityUserDetail[];
  external_participants?: Array<{ name: string; email?: string }>;

  // Communication
  direction: ActivityDirection;
  sentiment?: ActivitySentiment;

  // Activity metadata
  activity_date: string;
  duration_minutes?: number;
  location?: string;

  // Follow-up
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_completed: boolean;
  follow_up_task?: number;
  follow_up_task_detail?: ActivityTaskDetail;

  // Attachments
  attachments?: string[];
  related_url?: string;

  // Department
  department?: number;
  department_name?: string;

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ActivityCreateInput {
  type: ActivityType;
  subject: string;
  content?: string;
  entity?: number;
  contact_person?: number;
  campaign?: number;
  contract?: number;
  participants?: number[];
  external_participants?: Array<{ name: string; email?: string }>;
  direction?: ActivityDirection;
  sentiment?: ActivitySentiment;
  activity_date?: string;
  duration_minutes?: number;
  location?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  attachments?: string[];
  related_url?: string;
  department?: number;
  metadata?: Record<string, any>;
}

export interface ActivityUpdateInput extends Partial<ActivityCreateInput> {
  follow_up_completed?: boolean;
}

// Activity type display helpers
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  email: 'Email',
  call: 'Phone Call',
  meeting: 'Meeting',
  video_call: 'Video Call',
  note: 'Internal Note',
  follow_up: 'Follow-up',
  task_created: 'Task Created',
  status_change: 'Status Change',
  document: 'Document Shared',
  social_media: 'Social Media',
  event: 'Event/Show',
  negotiation: 'Negotiation',
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  email: '✉️',
  call: '📞',
  meeting: '🤝',
  video_call: '📹',
  note: '📝',
  follow_up: '🔔',
  task_created: '✅',
  status_change: '🔄',
  document: '📄',
  social_media: '💬',
  event: '🎤',
  negotiation: '💰',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  email: 'blue',
  call: 'green',
  meeting: 'purple',
  video_call: 'indigo',
  note: 'gray',
  follow_up: 'orange',
  task_created: 'teal',
  status_change: 'yellow',
  document: 'cyan',
  social_media: 'pink',
  event: 'red',
  negotiation: 'amber',
};

// Sentiment display helpers
export const ACTIVITY_SENTIMENT_LABELS: Record<ActivitySentiment, string> = {
  very_positive: 'Very Positive',
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  very_negative: 'Very Negative',
};

export const ACTIVITY_SENTIMENT_COLORS: Record<ActivitySentiment, string> = {
  very_positive: 'green',
  positive: 'emerald',
  neutral: 'gray',
  negative: 'orange',
  very_negative: 'red',
};

export const ACTIVITY_SENTIMENT_ICONS: Record<ActivitySentiment, string> = {
  very_positive: '😊',
  positive: '🙂',
  neutral: '😐',
  negative: '😕',
  very_negative: '😞',
};

// Direction display helpers
export const ACTIVITY_DIRECTION_LABELS: Record<ActivityDirection, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  internal: 'Internal',
};

export const ACTIVITY_DIRECTION_ICONS: Record<ActivityDirection, string> = {
  inbound: '⬇️',
  outbound: '⬆️',
  internal: '🔄',
};

// Choice arrays for form dropdowns
export const ACTIVITY_TYPE_CHOICES: ActivityType[] = [
  'email',
  'call',
  'meeting',
  'video_call',
  'note',
  'follow_up',
  'task_created',
  'status_change',
  'document',
  'social_media',
  'event',
  'negotiation',
];

export const ACTIVITY_SENTIMENT_CHOICES: ActivitySentiment[] = [
  'very_positive',
  'positive',
  'neutral',
  'negative',
  'very_negative',
];

export const ACTIVITY_DIRECTION_CHOICES: ActivityDirection[] = [
  'inbound',
  'outbound',
  'internal',
];

// Note: Activity model doesn't have a 'status' field - it has 'type' and 'direction'
// If ActivityFormDialog uses status, it should be removed or mapped to another field
export const ACTIVITY_STATUS_LABELS = ACTIVITY_DIRECTION_LABELS;
export const ACTIVITY_STATUS_CHOICES = ACTIVITY_DIRECTION_CHOICES;