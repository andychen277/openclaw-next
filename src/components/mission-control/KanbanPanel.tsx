'use client';

import type { TasksData, Task } from '@/lib/types';
import KanbanBoard from '../dashboard/KanbanBoard';

interface KanbanPanelProps {
  tasks: TasksData;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  error?: string;
  gatewayConnected?: boolean | null;
}

export default function KanbanPanel({ tasks, updateTask, error, gatewayConnected }: KanbanPanelProps) {
  const totalTasks = (tasks.todo?.length || 0) + (tasks.in_progress?.length || 0) + (tasks.done?.length || 0);

  return (
    <div className="h-full">
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Task Management</h2>
          <span className="text-xs text-muted">{totalTasks} tasks</span>
        </div>
        {gatewayConnected === false && (
          <p className="text-xs text-orange-400 mt-1">
            Gateway 離線 - 任務儲存在本機
          </p>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <KanbanBoard tasks={tasks} onUpdateTask={updateTask} />
    </div>
  );
}
