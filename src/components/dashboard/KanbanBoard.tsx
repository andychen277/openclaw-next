'use client';

import { useState, useEffect } from 'react';
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
import type { Task, TasksData, TasksDataExtended, TaskStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/constants';
import TaskCard from './TaskCard';
import SortableTaskCard from './SortableTaskCard';
import TaskAssignModal from './TaskAssignModal';

interface KanbanBoardProps {
  tasks: TasksData;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

interface Column {
  id: TaskStatus;
  label: string;
  color: string;
  icon: string;
}

const COLUMNS: Column[] = Object.values(STATUS_CONFIG).map(config => ({
  id: config.id as TaskStatus,
  label: config.label,
  color: config.color,
  icon: config.icon,
}));

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

// Helper: 轉換 3 狀態 → 6 狀態
function convertToExtended(tasks: TasksData): TasksDataExtended {
  const extended: TasksDataExtended = {
    backlog: [],
    todo: [],
    pending: [],
    ongoing: [],
    review: [],
    done: [],
  };

  for (const [backendStatus, taskList] of Object.entries(tasks)) {
    for (const task of taskList as Task[]) {
      const frontendStatus = task.frontendStatus || mapBackendToFrontend(backendStatus);
      extended[frontendStatus].push(task);
    }
  }

  return extended;
}

// Helper: 後端狀態映射到前端預設狀態
function mapBackendToFrontend(status: string): TaskStatus {
  switch (status) {
    case 'todo': return 'todo';
    case 'in_progress': return 'ongoing';
    case 'done': return 'done';
    default: return 'todo';
  }
}

export default function KanbanBoard({ tasks, onUpdateTask }: KanbanBoardProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [assignModalTask, setAssignModalTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<TasksDataExtended>(convertToExtended(tasks));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 更新 localTasks 當 props.tasks 變化時
  useEffect(() => {
    setLocalTasks(convertToExtended(tasks));
  }, [tasks]);

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
    const overColumnId = over.id as TaskStatus;

    // 如果拖到列頭，更新任務狀態
    if (COLUMNS.some(col => col.id === overColumnId)) {
      const task = findTaskById(activeTaskId);
      const currentFrontendStatus = task?.frontendStatus || mapBackendToFrontend(task?.status || 'todo');
      if (task && currentFrontendStatus !== overColumnId) {
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

  const updateTaskStatus = (taskId: string, newFrontendStatus: TaskStatus) => {
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
      // 映射前端狀態到後端狀態
      const backendStatus = newFrontendStatus === 'backlog' ? 'todo' :
                           newFrontendStatus === 'todo' ? 'todo' :
                           newFrontendStatus === 'pending' ? 'todo' :
                           newFrontendStatus === 'ongoing' ? 'in_progress' :
                           newFrontendStatus === 'review' ? 'in_progress' :
                           'done';

      movedTask = {
        ...movedTask,
        frontendStatus: newFrontendStatus,
        status: backendStatus
      };
      newTasks[newFrontendStatus] = [...(newTasks[newFrontendStatus] || []), movedTask];
      setLocalTasks(newTasks);
      onUpdateTask?.(taskId, { frontendStatus: newFrontendStatus, status: backendStatus });
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {COLUMNS.map(column => {
            const columnTasks = filterTasks(localTasks[column.id] || []);

            return (
              <div key={column.id} className="flex flex-col">
                {/* 列頭（作為拖放目標） */}
                <div
                  id={column.id}
                  className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2 ${column.color} transition-all`}
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
                  <div className="space-y-2 flex-1 min-h-[60px]">
                    {columnTasks.length === 0 ? (
                      <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/20">
                        <p className="text-xs text-muted/40">No tasks</p>
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

        {/* 統計摘要 - compact inline */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
          {COLUMNS.map(col => {
            const count = localTasks[col.id]?.length || 0;
            return (
              <span key={col.id}>
                {col.icon} {col.label}: <span className="font-semibold text-text">{count}</span>
              </span>
            );
          })}
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
