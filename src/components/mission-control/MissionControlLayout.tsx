'use client';

import type { PanelType } from '@/hooks/useMissionControl';

interface MissionControlLayoutProps {
  header?: React.ReactNode;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
}

export default function MissionControlLayout({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
  activePanel,
  setActivePanel,
}: MissionControlLayoutProps) {
  return (
    <div className="min-h-dvh bg-background text-text">
      {/* Header */}
      {header && (
        <div className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
          {header}
        </div>
      )}

      {/* Three-panel layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100dvh-theme(spacing.20))]">
        {/* Left Panel - Agents (25%) */}
        <div className={`
          border-r border-border bg-surface overflow-y-auto
          ${activePanel === 'agents' ? 'block' : 'hidden'} lg:block lg:w-1/4
        `}>
          {leftPanel}
        </div>

        {/* Center Panel - Kanban (50%) */}
        <div className={`
          flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6
          ${activePanel === 'tasks' ? 'block' : 'hidden'} lg:block
        `}>
          {centerPanel}
        </div>

        {/* Right Panel - Content (25%) */}
        <div className={`
          border-l border-border bg-surface overflow-y-auto
          ${activePanel === 'content' ? 'block' : 'hidden'} lg:block lg:w-1/4
        `}>
          {rightPanel}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur p-2 grid grid-cols-3 gap-2 z-10">
        <button
          onClick={() => setActivePanel('agents')}
          className={`py-2 text-xs ${activePanel === 'agents' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🤖 Agents
        </button>
        <button
          onClick={() => setActivePanel('tasks')}
          className={`py-2 text-xs ${activePanel === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📋 Tasks
        </button>
        <button
          onClick={() => setActivePanel('content')}
          className={`py-2 text-xs ${activePanel === 'content' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📁 Content
        </button>
      </div>
    </div>
  );
}
