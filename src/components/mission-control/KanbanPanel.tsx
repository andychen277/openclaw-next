'use client';

import type { TasksData, Task } from '@/lib/types';
import KanbanBoard from '../dashboard/KanbanBoard';

interface KanbanPanelProps {
  tasks: TasksData;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  error?: string;
}

export default function KanbanPanel({ tasks, updateTask, error }: KanbanPanelProps) {
  const totalTasks = (tasks.todo?.length || 0) + (tasks.in_progress?.length || 0) + (tasks.done?.length || 0);

  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-text">Task Management</h2>
        <p className="text-sm text-muted mt-1">
          {totalTasks} total tasks
        </p>
      </div>

      {/* Error / Connection Warning */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <KanbanBoard tasks={tasks} onUpdateTask={updateTask} />
    </div>
  );
}
