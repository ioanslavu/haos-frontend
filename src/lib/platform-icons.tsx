/**
 * Platform Icons - Shared platform icon components and colors
 *
 * Uses react-icons for brand logos with brand-specific colors
 */

import {
  SiSpotify,
  SiApplemusic,
  SiYoutube,
  SiTiktok,
  SiMeta,
  SiGoogleads,
  SiAmazonmusic,
  SiSoundcloud,
  SiX,
  SiSnapchat,
  SiPinterest,
  SiLinkedin,
} from 'react-icons/si'
import { HiGlobeAlt, HiMusicalNote } from 'react-icons/hi2'
import type { Platform } from '@/types/campaign'
import type { Platform as DistributionPlatform } from '@/types/distribution'

// Platform icon mapping (supports both Campaign and Distribution platforms)
export const PLATFORM_ICONS: Record<Platform | DistributionPlatform, React.ComponentType<{ className?: string }>> = {
  spotify: SiSpotify,
  apple_music: SiApplemusic,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  meta: SiMeta,
  google: SiGoogleads,
  amazon_music: SiAmazonmusic,
  deezer: HiMusicalNote, // Deezer icon not available, using music note
  soundcloud: SiSoundcloud,
  twitter: SiX,
  snapchat: SiSnapchat,
  pinterest: SiPinterest,
  linkedin: SiLinkedin,
  other: HiGlobeAlt,
  multi: HiGlobeAlt, // Multi-platform uses globe icon
}

// Platform brand colors for selected/highlighted state
export const PLATFORM_COLORS: Record<Platform | DistributionPlatform, string> = {
  spotify: 'text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/30',
  apple_music: 'text-[#FA243C] bg-[#FA243C]/10 border-[#FA243C]/30',
  youtube: 'text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/30',
  tiktok: 'text-foreground bg-foreground/10 border-foreground/30',
  meta: 'text-[#0081FB] bg-[#0081FB]/10 border-[#0081FB]/30',
  google: 'text-[#4285F4] bg-[#4285F4]/10 border-[#4285F4]/30',
  amazon_music: 'text-[#FF9900] bg-[#FF9900]/10 border-[#FF9900]/30',
  deezer: 'text-[#FEAA2D] bg-[#FEAA2D]/10 border-[#FEAA2D]/30',
  soundcloud: 'text-[#FF5500] bg-[#FF5500]/10 border-[#FF5500]/30',
  twitter: 'text-foreground bg-foreground/10 border-foreground/30',
  snapchat: 'text-[#FFFC00] bg-[#FFFC00]/10 border-[#FFFC00]/30',
  pinterest: 'text-[#E60023] bg-[#E60023]/10 border-[#E60023]/30',
  linkedin: 'text-[#0A66C2] bg-[#0A66C2]/10 border-[#0A66C2]/30',
  other: 'text-muted-foreground bg-muted border-muted-foreground/30',
  multi: 'text-muted-foreground bg-muted border-muted-foreground/30',
}

// Just the text color from brand colors (for inline use)
export const PLATFORM_TEXT_COLORS: Record<Platform | DistributionPlatform, string> = {
  spotify: 'text-[#1DB954]',
  apple_music: 'text-[#FA243C]',
  youtube: 'text-[#FF0000]',
  tiktok: 'text-foreground',
  meta: 'text-[#0081FB]',
  google: 'text-[#4285F4]',
  amazon_music: 'text-[#FF9900]',
  deezer: 'text-[#FEAA2D]',
  soundcloud: 'text-[#FF5500]',
  twitter: 'text-foreground',
  snapchat: 'text-[#FFFC00]',
  pinterest: 'text-[#E60023]',
  linkedin: 'text-[#0A66C2]',
  other: 'text-muted-foreground',
  multi: 'text-muted-foreground',
}
