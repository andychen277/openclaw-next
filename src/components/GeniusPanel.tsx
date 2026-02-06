'use client';

import type { Output } from '@/lib/types';

interface GeniusPanelProps {
  geniusItems: Output[];
  selectedGenius: string[];
  toggleGenius: (f: string) => void;
}

const TYPE_ICON: Record<string, string> = {
  social: '📱',
  image: '🖼️',
  podcast: '🎙️',
  video: '🎬',
};

export default function GeniusPanel({ geniusItems, selectedGenius, toggleGenius }: GeniusPanelProps) {
  if (geniusItems.length === 0) {
    return (
      <div className="py-10 text-center text-muted">
        <p className="mb-2 text-4xl">✨</p>
        <p className="text-sm">還沒有內容，先去「素材庫」選素材創作</p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted">二次創作素材（社群文案、圖片、播客、影音腳本）</p>
      {geniusItems.map(item => {
        const selected = selectedGenius.includes(item.filename);
        const icon = TYPE_ICON[item.type || ''] || '📄';
        return (
          <button
            key={item.filename}
            onClick={() => toggleGenius(item.filename)}
            aria-pressed={selected}
            className={`mb-1.5 flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors ${
              selected
                ? 'border-accent/50 bg-accent/10'
                : 'border-border bg-surface/50 hover:border-accent/30'
            }`}
          >
            <span className="text-base" aria-hidden="true">{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">
                {item.filename.replace(/^\d{4}-\d{2}-\d{2}_\d{4}_/, '').replace(/\.txt$/, '')}
              </p>
              <p className="text-xs text-light">
                {new Date(item.modified).toLocaleDateString('zh-TW')}
              </p>
            </div>
          </button>
        );
      })}
    </>
  );
}
