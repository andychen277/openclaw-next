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

export const STATUS_CONFIG = {
  backlog: { id: 'backlog', label: '想法暫存', icon: '💡', color: 'border-gray-500/30 bg-gray-500/5' },
  todo: { id: 'todo', label: '待辦清單', icon: '📋', color: 'border-slate-500/30 bg-slate-500/5' },
  pending: { id: 'pending', label: '等待中', icon: '⏸️', color: 'border-violet-500/30 bg-violet-500/5' },
  ongoing: { id: 'ongoing', label: '執行中', icon: '⚡', color: 'border-amber-500/30 bg-amber-500/5' },
  review: { id: 'review', label: '審核中', icon: '🔍', color: 'border-cyan-500/30 bg-cyan-500/5' },
  done: { id: 'done', label: '完成', icon: '✅', color: 'border-emerald-500/30 bg-emerald-500/5' },
} as const;

export const STATUS_API_MAP = {
  backlog: 'todo',
  todo: 'todo',
  pending: 'todo',
  ongoing: 'in_progress',
  review: 'in_progress',
  done: 'done',
} as const;

export const PRIORITY_CONFIG = {
  high: { label: '高', bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  medium: { label: '中', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  low: { label: '低', bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
} as const;
