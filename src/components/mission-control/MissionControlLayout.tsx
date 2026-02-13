'use client';

interface MissionControlLayoutProps {
  header?: React.ReactNode;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function MissionControlLayout({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
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
        <div className="hidden lg:block lg:w-1/4 border-r border-border bg-surface overflow-y-auto">
          {leftPanel}
        </div>

        {/* Center Panel - Kanban (50%) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {centerPanel}
        </div>

        {/* Right Panel - Content (25%) */}
        <div className="hidden lg:block lg:w-1/4 border-l border-border bg-surface overflow-y-auto">
          {rightPanel}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur p-2 grid grid-cols-3 gap-2 z-10">
        <button className="btn-secondary py-2 text-xs">
          🤖 Agents
        </button>
        <button className="btn-primary py-2 text-xs">
          📋 Tasks
        </button>
        <button className="btn-secondary py-2 text-xs">
          📁 Content
        </button>
      </div>
    </div>
  );
}
