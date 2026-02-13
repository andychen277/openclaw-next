export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:18789';

export const AGENTS: Record<string, { emoji: string; label: string }> = {
  general: { emoji: '\u{1F30A}', label: 'Ocean' },
  dev: { emoji: '\u{1F527}', label: 'Forge' },
  devcc: { emoji: '\u{2699}\u{FE0F}', label: 'ForgeCC' },
  writer: { emoji: '\u{270D}\u{FE0F}', label: 'Quill' },
  imagegen: { emoji: '\u{1F3A8}', label: 'Pixel' },
  brainstorm: { emoji: '\u{1F4A1}', label: 'Spark' },
  forum: { emoji: '\u{1F4E2}', label: 'Echo' },
};

export const SOCIAL_PLATFORMS = [
  { id: 'all', label: '全部' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'threads', label: 'Threads' },
  { id: 'twitter', label: 'X' },
] as const;

export const PODCAST_DURATIONS = ['3', '5', '10'] as const;

export const VIDEO_OPTIONS = [
  { platform: 'reels', duration: '30', label: 'Reels 30s' },
  { platform: 'reels', duration: '60', label: 'Reels 60s' },
  { platform: 'tiktok', duration: '30', label: 'TikTok 30s' },
  { platform: 'shorts', duration: '60', label: 'Shorts 60s' },
] as const;
