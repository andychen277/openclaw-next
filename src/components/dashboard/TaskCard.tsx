'use client';

import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  assignedAgent?: string;
  onAssignAgent?: (taskId: string, agentId: string) => void;
}

export default function TaskCard({ task, assignedAgent, onAssignAgent }: TaskCardProps) {
  const priorityConfig = {
    high: {
      bg: 'bg-red-500/20',
      text: 'text-red-300',
      border: 'border-red-500/30',
      label: 'HIGH'
    },
    medium: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
      label: 'MEDIUM'
    },
    low: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      label: 'LOW'
    },
  };

  const config = priorityConfig[task.priority];

  return (
    <div className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-surface p-3 transition-all hover:border-primary/40 hover:shadow-md">
      {/* 任務標題 */}
      <h4 className="mb-2 font-medium text-text text-sm line-clamp-2 group-hover:text-primary transition-colors">
        {task.task}
      </h4>

      {/* 優先級標籤 */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}>
          {config.label}
        </span>

        {task.timestamp && (
          <span className="text-xs text-muted/70">
            {new Date(task.timestamp).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* 分配的 Agent */}
      {assignedAgent && (
        <div className="flex items-center gap-2 rounded-md bg-background/50 px-2 py-1.5">
          <span className="text-xs text-muted/70">Assigned to:</span>
          <span className="text-xs font-medium text-primary">{assignedAgent}</span>
        </div>
      )}

      {/* 任務類型標籤 */}
      {task.task_type && task.task_type !== 'auto' && (
        <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary/80">
          {task.task_type}
        </div>
      )}
    </div>
  );
}
