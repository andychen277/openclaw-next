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
    <div className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-surface p-2 transition-all hover:border-primary/40 hover:shadow-md">
      {/* 任務標題 + 優先級 */}
      <div className="flex items-start gap-1.5">
        <span className={`mt-0.5 shrink-0 h-2 w-2 rounded-full ${config.bg.replace('/20', '')}`} />
        <h4 className="font-medium text-text text-xs line-clamp-2 group-hover:text-primary transition-colors">
          {task.task}
        </h4>
      </div>

      {/* Agent + 日期 */}
      {(assignedAgent || task.timestamp) && (
        <div className="flex items-center justify-between mt-1 ml-3.5">
          {assignedAgent && (
            <span className="text-[10px] font-medium text-primary">{assignedAgent}</span>
          )}
          {task.timestamp && (
            <span className="text-[10px] text-muted/60">
              {new Date(task.timestamp).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
