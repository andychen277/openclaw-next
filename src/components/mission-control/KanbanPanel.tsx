'use client';

import type { TasksData, Task } from '@/lib/types';
import KanbanBoard from '../dashboard/KanbanBoard';

interface KanbanPanelProps {
  tasks: TasksData;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export default function KanbanPanel({ tasks, updateTask }: KanbanPanelProps) {
  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-text">Task Management</h2>
        <p className="text-sm text-muted mt-1">
          {(tasks.todo?.length || 0) + (tasks.in_progress?.length || 0) + (tasks.done?.length || 0)} total tasks
        </p>
      </div>

      <KanbanBoard tasks={tasks} onUpdateTask={updateTask} />
    </div>
  );
}
