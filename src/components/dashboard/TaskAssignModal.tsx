'use client';

import type { Task } from '@/lib/types';

interface Agent {
  id: string;
  label: string;
  emoji: string;
}

interface TaskAssignModalProps {
  task: Task;
  agents: Agent[];
  onAssign: (agentId: string) => void;
  onClose: () => void;
}

export default function TaskAssignModal({ task, agents, onAssign, onClose }: TaskAssignModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
        {/* 標題 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-text">Assign Task to Agent</h3>
          <p className="mt-1 text-sm text-muted line-clamp-2">{task.task}</p>
        </div>

        {/* Agent 列表 */}
        <div className="mb-6 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => onAssign(agent.id)}
              className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-primary hover:bg-primary/5"
            >
              <span className="text-2xl">{agent.emoji}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-text group-hover:text-primary">{agent.label}</p>
                <p className="text-xs text-muted">{agent.id}</p>
              </div>
            </button>
          ))}
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-background border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-darker"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
