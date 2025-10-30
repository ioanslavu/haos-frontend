import { API_BASE_URL } from './constants';

/**
 * Convert a relative media URL to an absolute URL
 * @param mediaPath - The media path from the API (e.g., "/media/entity_photos/photo.jpg" or null)
 * @returns Full URL or null if no media path
 *
 * @example
 * getMediaUrl(entity.profile_photo) // "http://localhost:8000/media/entity_photos/photo.jpg"
 */
export function getMediaUrl(mediaPath: string | null | undefined): string | null {
  if (!mediaPath) return null;

  // If it's already a full URL, return it
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }

  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${mediaPath}`;
}

/**
 * Get a fallback image URL for profile photos
 * @param name - The name to generate initials from
 * @returns URL to a placeholder image
 */
export function getProfilePlaceholder(name?: string): string {
  // You can use a service like UI Avatars or generate initials
  if (name) {
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=256`;
  }

  return `https://ui-avatars.com/api/?name=?&background=random&size=256`;
}
