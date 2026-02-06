'use client';

import { Task } from '@/lib/types';
import { getPriorityLabel, getStatusLabel } from '@/lib/priority';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({
  task,
  isSelected,
  onToggleSelect,
  onStatusChange,
  onDelete
}: TaskCardProps) {
  const statusOptions: Task['status'][] = ['todo', 'in_progress', 'done'];

  return (
    <div
      className={`task-card status-${task.status} p-5 rounded-2xl relative pl-7 ${
        isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox for done tasks */}
        {task.status === 'done' && (
          <div className="flex items-center justify-center mt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(task.id)}
              className="w-5 h-5 rounded-md accent-purple-500 cursor-pointer bg-white/10 border-white/20"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header with priority badge */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span
              className={`priority-${task.priority} text-xs px-3 py-1 rounded-full font-semibold tracking-wide`}
            >
              {getPriorityLabel(task.priority)}
            </span>
            <span className="text-xs text-white/50 font-medium uppercase tracking-wider">
              {getStatusLabel(task.status)}
            </span>
          </div>

          {/* Task content */}
          <p className={`text-white text-base leading-relaxed ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
            {task.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
              className="bg-white/5 text-white text-sm px-4 py-2 rounded-xl border border-white/10 outline-none cursor-pointer hover:bg-white/10 transition-colors appearance-none pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.2em'
              }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s} className="bg-gray-900 text-white">
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>

            <button
              onClick={() => onDelete(task.id)}
              className="text-red-400/70 hover:text-red-400 text-sm px-3 py-2 rounded-xl transition-all hover:bg-red-500/10"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
