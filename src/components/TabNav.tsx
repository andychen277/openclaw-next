'use client';

import type { TabType, TasksData } from '@/lib/types';

interface TabNavProps {
  tab: TabType;
  setTab: (t: TabType) => void;
  tasks: TasksData;
  outputCount: number;
  geniusCount: number;
}

const TABS: { id: TabType; emoji: string; label: string }[] = [
  { id: 'tasks', emoji: '📝', label: '任務' },
  { id: 'outputs', emoji: '📁', label: '素材庫' },
  { id: 'genius', emoji: '✨', label: '天才庫' },
  { id: 'create', emoji: '🎨', label: '創作' },
];

export default function TabNav({ tab, setTab, tasks, outputCount, geniusCount }: TabNavProps) {
  const badge = (id: TabType) => {
    switch (id) {
      case 'tasks': return (tasks.todo?.length || 0) + (tasks.in_progress?.length || 0);
      case 'outputs': return outputCount;
      case 'genius': return geniusCount;
      default: return 0;
    }
  };

  return (
    <nav className="mx-auto max-w-3xl px-4 pt-4" aria-label="主要導航">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(t => {
          const count = badge(t.id);
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={active ? 'page' : undefined}
              className={`rounded-sm px-3.5 py-2 text-sm transition-colors ${
                active
                  ? 'border border-primary/50 bg-primary/15 text-primary font-medium'
                  : 'border border-border bg-surface/50 text-muted hover:border-primary/30 hover:text-text'
              }`}
            >
              {t.emoji} {t.label}
              {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
