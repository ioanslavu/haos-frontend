// Extended campaign types with department-specific fields

export type ServiceType =
  | 'ppc'
  | 'tiktok_ugc'
  | 'dsp_distribution'
  | 'radio_plugging'
  | 'playlist_pitching'
  | 'youtube_cms'
  | 'social_media_mgmt'
  | 'content_creation'
  | 'influencer_marketing'
  | 'seo'
  | 'email_marketing';

export const SERVICE_TYPE_CHOICES: ServiceType[] = [
  'ppc',
  'tiktok_ugc',
  'dsp_distribution',
  'radio_plugging',
  'playlist_pitching',
  'youtube_cms',
  'social_media_mgmt',
  'content_creation',
  'influencer_marketing',
  'seo',
  'email_marketing',
];

export type Platform =
  | 'meta'
  | 'google'
  | 'tiktok'
  | 'spotify'
  | 'youtube'
  | 'apple_music'
  | 'deezer'
  | 'amazon_music'
  | 'soundcloud'
  | 'twitter'
  | 'linkedin'
  | 'snapchat'
  | 'pinterest'
  | 'multi';

export const PLATFORM_CHOICES: Platform[] = [
  'meta',
  'google',
  'tiktok',
  'spotify',
  'youtube',
  'apple_music',
  'deezer',
  'amazon_music',
  'soundcloud',
  'twitter',
  'linkedin',
  'snapchat',
  'pinterest',
  'multi',
];

export interface KPITarget {
  target: number;
  unit: string;
}

export interface KPIActual {
  actual: number;
  unit: string;
  last_updated?: string;
}

export interface CampaignMetrics {
  id: number;
  campaign: number;
  campaign_name?: string;
  campaign_status?: string;
  recorded_date: string;
  source?: string;

  // Performance metrics
  impressions?: number;
  clicks?: number;
  ctr?: number;
  conversions?: number;
  conversion_rate?: number;
  cost?: number;
  cpc?: number;
  cpa?: number;

  // Social media metrics
  reach?: number;
  engagement?: number;
  engagement_rate?: number;
  followers_gained?: number;
  followers_lost?: number;

  // Content metrics
  views?: number;
  watch_time_minutes?: number;
  shares?: number;
  comments?: number;
  likes?: number;

  // Music metrics
  streams?: number;
  downloads?: number;
  playlist_adds?: number;
  radio_plays?: number;

  // Revenue metrics
  revenue?: number;
  roi?: number;

  // Custom metrics
  custom_metrics?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CampaignMetricsInput {
  campaign: number;
  recorded_date: string;
  source?: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  conversions?: number;
  conversion_rate?: number;
  cost?: number;
  cpc?: number;
  cpa?: number;
  reach?: number;
  engagement?: number;
  engagement_rate?: number;
  followers_gained?: number;
  followers_lost?: number;
  views?: number;
  watch_time_minutes?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  streams?: number;
  downloads?: number;
  playlist_adds?: number;
  radio_plays?: number;
  revenue?: number;
  roi?: number;
  custom_metrics?: Record<string, any>;
}

export interface CampaignMetricsSummary {
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_cost: number;
  total_revenue: number;
  avg_ctr: number;
  avg_cpa: number;
  avg_roi: number;
  latest_metrics: CampaignMetrics;
  metrics_count: number;
}

// Service type display helpers
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ppc: 'PPC Campaign',
  tiktok_ugc: 'TikTok UGC',
  dsp_distribution: 'DSP Distribution',
  radio_plugging: 'Radio Plugging',
  playlist_pitching: 'Playlist Pitching',
  youtube_cms: 'YouTube CMS',
  social_media_mgmt: 'Social Media Management',
  content_creation: 'Content Creation',
  influencer_marketing: 'Influencer Marketing',
  seo: 'SEO Optimization',
  email_marketing: 'Email Marketing',
};

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  ppc: '📊',
  tiktok_ugc: '🎵',
  dsp_distribution: '📡',
  radio_plugging: '📻',
  playlist_pitching: '🎧',
  youtube_cms: '📹',
  social_media_mgmt: '📱',
  content_creation: '✍️',
  influencer_marketing: '⭐',
  seo: '🔍',
  email_marketing: '✉️',
};

// Platform display helpers
export const PLATFORM_LABELS: Record<Platform, string> = {
  meta: 'Meta (Facebook/Instagram)',
  google: 'Google Ads',
  tiktok: 'TikTok',
  spotify: 'Spotify',
  youtube: 'YouTube',
  apple_music: 'Apple Music',
  deezer: 'Deezer',
  amazon_music: 'Amazon Music',
  soundcloud: 'SoundCloud',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  snapchat: 'Snapchat',
  pinterest: 'Pinterest',
  multi: 'Multi-Platform',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  meta: 'bg-blue-500',
  google: 'bg-red-500',
  tiktok: 'bg-black',
  spotify: 'bg-green-500',
  youtube: 'bg-red-600',
  apple_music: 'bg-gray-800',
  deezer: 'bg-orange-500',
  amazon_music: 'bg-orange-600',
  soundcloud: 'bg-orange-400',
  twitter: 'bg-blue-400',
  linkedin: 'bg-blue-700',
  snapchat: 'bg-yellow-400',
  pinterest: 'bg-red-700',
  multi: 'bg-gradient-to-r from-blue-500 to-purple-500',
};

// KPI categories for grouping
export const KPI_CATEGORIES = {
  performance: ['impressions', 'clicks', 'ctr', 'conversions', 'conversion_rate'],
  cost: ['cost', 'cpc', 'cpa', 'budget_spent'],
  social: ['reach', 'engagement', 'engagement_rate', 'followers_gained'],
  content: ['views', 'watch_time_minutes', 'shares', 'comments', 'likes'],
  music: ['streams', 'downloads', 'playlist_adds', 'radio_plays'],
  revenue: ['revenue', 'roi'],
};

// Common KPI presets for different service types
export const SERVICE_KPI_PRESETS: Record<ServiceType, string[]> = {
  ppc: ['impressions', 'clicks', 'ctr', 'conversions', 'cost', 'cpa', 'roi'],
  tiktok_ugc: ['views', 'engagement', 'shares', 'followers_gained', 'reach'],
  dsp_distribution: ['streams', 'playlist_adds', 'downloads', 'revenue'],
  radio_plugging: ['radio_plays', 'reach', 'engagement'],
  playlist_pitching: ['playlist_adds', 'streams', 'followers_gained'],
  youtube_cms: ['views', 'watch_time_minutes', 'subscribers_gained', 'revenue'],
  social_media_mgmt: ['reach', 'engagement', 'followers_gained', 'impressions'],
  content_creation: ['views', 'engagement', 'shares', 'comments'],
  influencer_marketing: ['reach', 'engagement', 'conversions', 'roi'],
  seo: ['impressions', 'clicks', 'ctr', 'conversions'],
  email_marketing: ['sent', 'opens', 'clicks', 'conversions', 'roi'],
};

// Currency options
export const CURRENCIES = [
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
  { value: 'RON', label: 'RON', symbol: 'RON' },
];