'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TasksData } from '@/lib/types';
import TaskCard from './TaskCard';
import SortableTaskCard from './SortableTaskCard';
import TaskAssignModal from './TaskAssignModal';

interface KanbanBoardProps {
  tasks: TasksData;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

interface Column {
  id: 'todo' | 'in_progress' | 'done';
  label: string;
  color: string;
  icon: string;
}

const COLUMNS: Column[] = [
  { id: 'todo', label: 'To Do', color: 'border-slate-500/30 bg-slate-500/5', icon: '📋' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-500/30 bg-amber-500/5', icon: '⚡' },
  { id: 'done', label: 'Done', color: 'border-emerald-500/30 bg-emerald-500/5', icon: '✅' },
];

const AGENTS = [
  { id: 'auto', label: 'Auto Assign', emoji: '🤖' },
  { id: 'general', label: 'Ocean', emoji: '🌊' },
  { id: 'dev', label: 'Forge', emoji: '🔧' },
  { id: 'devcc', label: 'ForgeCC', emoji: '⚙️' },
  { id: 'writer', label: 'Quill', emoji: '✍️' },
  { id: 'imagegen', label: 'Pixel', emoji: '🎨' },
  { id: 'brainstorm', label: 'Spark', emoji: '💡' },
  { id: 'forum', label: 'Echo', emoji: '📢' },
];

export default function KanbanBoard({ tasks, onUpdateTask }: KanbanBoardProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [assignModalTask, setAssignModalTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 更新 localTasks 當 props.tasks 變化時
  useState(() => {
    setLocalTasks(tasks);
  });

  const filterTasks = (taskList: Task[]) => {
    let filtered = taskList;

    // 優先級篩選
    if (filter !== 'all') {
      filtered = filtered.filter(task => task.priority === filter);
    }

    // 搜尋篩選
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTaskId = active.id as string;
    const overColumnId = over.id as 'todo' | 'in_progress' | 'done';

    // 如果拖到列頭，更新任務狀態
    if (COLUMNS.some(col => col.id === overColumnId)) {
      const task = findTaskById(activeTaskId);
      if (task && task.status !== overColumnId) {
        updateTaskStatus(activeTaskId, overColumnId);
      }
    }

    setActiveTask(null);
  };

  const findTaskById = (id: string): Task | null => {
    for (const column of COLUMNS) {
      const task = localTasks[column.id]?.find(t => t.id === id);
      if (task) return task;
    }
    return null;
  };

  const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    const newTasks = { ...localTasks };
    let movedTask: Task | null = null;

    // 從舊列中移除
    for (const column of COLUMNS) {
      const index = newTasks[column.id]?.findIndex(t => t.id === taskId);
      if (index !== undefined && index >= 0) {
        movedTask = newTasks[column.id][index];
        newTasks[column.id] = newTasks[column.id].filter(t => t.id !== taskId);
        break;
      }
    }

    // 添加到新列
    if (movedTask) {
      movedTask = { ...movedTask, status: newStatus };
      newTasks[newStatus] = [...(newTasks[newStatus] || []), movedTask];
      setLocalTasks(newTasks);
      onUpdateTask?.(taskId, { status: newStatus });
    }
  };

  const handleAssignAgent = (taskId: string, agentId: string) => {
    const newTasks = { ...localTasks };

    for (const column of COLUMNS) {
      const task = newTasks[column.id]?.find(t => t.id === taskId);
      if (task) {
        task.task_type = agentId;
        setLocalTasks({ ...newTasks });
        onUpdateTask?.(taskId, { task_type: agentId });
        break;
      }
    }

    setAssignModalTask(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* 搜尋和篩選器 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 搜尋框 */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 pl-10 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 優先級篩選 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Priority:</span>
            <div className="flex gap-2">
              {['all', 'high', 'medium', 'low'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary text-background'
                      : 'bg-surface text-muted hover:bg-surface-darker hover:text-text'
                  }`}
                >
                  {f === 'all' ? 'All' : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban 列 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map(column => {
            const columnTasks = filterTasks(localTasks[column.id] || []);

            return (
              <div key={column.id} className="flex flex-col">
                {/* 列頭（作為拖放目標） */}
                <div
                  id={column.id}
                  className={`mb-3 flex items-center justify-between rounded-lg border p-3 ${column.color} transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{column.icon}</span>
                    <h3 className="font-semibold text-text">{column.label}</h3>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/50 text-xs font-bold text-text">
                    {columnTasks.length}
                  </span>
                </div>

                {/* 任務卡片列表 */}
                <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 flex-1 min-h-[200px]">
                    {columnTasks.length === 0 ? (
                      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-background/30">
                        <p className="text-sm text-muted/50">No tasks</p>
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          assignedAgent={task.task_type !== 'auto' ? task.task_type : undefined}
                          onAssign={() => setAssignModalTask(task)}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* 統計摘要 */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-border bg-surface p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-400">{localTasks.todo?.length || 0}</p>
            <p className="text-xs text-muted">Pending</p>
          </div>
          <div className="text-center border-l border-r border-border">
            <p className="text-2xl font-bold text-amber-400">{localTasks.in_progress?.length || 0}</p>
            <p className="text-xs text-muted">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{localTasks.done?.length || 0}</p>
            <p className="text-xs text-muted">Completed</p>
          </div>
        </div>
      </div>

      {/* 拖拽預覽 */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-80">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>

      {/* 任務分配 Modal */}
      {assignModalTask && (
        <TaskAssignModal
          task={assignModalTask}
          agents={AGENTS}
          onAssign={(agentId) => handleAssignAgent(assignModalTask.id, agentId)}
          onClose={() => setAssignModalTask(null)}
        />
      )}
    </DndContext>
  );
}
