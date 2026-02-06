'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { detectPriority, getPriorityLabel, getStatusLabel } from '@/lib/priority';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('openclaw-tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed.map((t: Task) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        })));
      } catch (e) {
        console.error('Failed to parse tasks:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('openclaw-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const handleAddTask = () => {
    const text = inputText.trim();
    if (!text) return;

    const newTask: Task = {
      id: Date.now().toString(),
      content: text,
      priority: detectPriority(text),
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks(prev => [newTask, ...prev]);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const cycleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;
      const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done'];
      const currentIndex = statusOrder.indexOf(t.status);
      const nextStatus = statusOrder[(currentIndex + 1) % 3];
      return { ...t, status: nextStatus, updatedAt: new Date() };
    }));
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    setSelectedTasks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedTasks(new Set());

  const handleMerge = () => {
    const items = tasks.filter(t => selectedTasks.has(t.id));
    const content = items.map(t => `• ${t.content}`).join('\n');
    navigator.clipboard?.writeText(content);
    alert(`已複製 ${items.length} 項任務到剪貼簿`);
  };

  const handlePublish = (platform: string) => {
    const items = tasks.filter(t => selectedTasks.has(t.id));
    const content = items.map(t => t.content).join('\n\n');
    const names: Record<string, string> = { instagram: 'Instagram', threads: 'Threads', x: 'X' };
    alert(`發布到 ${names[platform]}:\n\n${content}`);
  };

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500'
  };

  const statusColors = {
    todo: 'border-l-blue-500',
    in_progress: 'border-l-amber-500',
    done: 'border-l-emerald-500'
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className={`group bg-zinc-900 border border-zinc-800 ${statusColors[task.status]} border-l-4 rounded-lg p-4 hover:bg-zinc-800/50 transition-all`}
    >
      <div className="flex items-start gap-3">
        {task.status === 'done' && (
          <input
            type="checkbox"
            checked={selectedTasks.has(task.id)}
            onChange={() => toggleSelection(task.id)}
            className="mt-1 w-4 h-4 rounded accent-purple-500"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`${priorityColors[task.priority]} text-white text-xs px-2 py-0.5 rounded font-medium`}>
              {getPriorityLabel(task.priority)}
            </span>
            <span className="text-zinc-500 text-xs">
              {getStatusLabel(task.status)}
            </span>
          </div>
          <p className={`text-zinc-100 text-sm leading-relaxed ${task.status === 'done' ? 'line-through text-zinc-500' : ''}`}>
            {task.content}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => cycleStatus(task.id)}
            className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-zinc-700"
          >
            切換
          </button>
          <button
            onClick={() => handleDelete(task.id)}
            className="text-zinc-400 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-zinc-700"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );

  const TaskSection = ({ title, tasks, color }: { title: string; tasks: Task[]; color: string }) => {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h2 className="text-zinc-400 text-sm font-medium">{title}</h2>
          <span className="text-zinc-600 text-xs">({tasks.length})</span>
        </div>
        <div className="space-y-2">
          {tasks.map(task => <TaskItem key={task.id} task={task} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <h1 className="text-lg font-semibold text-white">OpenClaw</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Input */}
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入任務，按 Enter 送出..."
              className="flex-1 bg-zinc-900 text-white placeholder-zinc-500 px-4 py-3 rounded-lg border border-zinc-800 focus:border-zinc-600 focus:outline-none text-sm"
            />
            <button
              onClick={handleAddTask}
              disabled={!inputText.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              送出
            </button>
          </div>
          <p className="text-zinc-600 text-xs mt-2">
            AI 會自動判斷優先級：緊急/急/馬上 → 高優先，有空/之後/不急 → 低優先
          </p>
        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-zinc-400">還沒有任務</p>
            <p className="text-zinc-600 text-sm mt-1">在上方輸入任務開始吧</p>
          </div>
        ) : (
          <>
            <TaskSection title="待辦" tasks={todoTasks} color="bg-blue-500" />
            <TaskSection title="進行中" tasks={inProgressTasks} color="bg-amber-500" />
            <TaskSection title="已完成" tasks={doneTasks} color="bg-emerald-500" />
          </>
        )}
      </main>

      {/* Action Bar */}
      {selectedTasks.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-300">
                已選取 <span className="text-purple-400 font-medium">{selectedTasks.size}</span> 項
              </span>
              <button
                onClick={clearSelection}
                className="text-zinc-500 hover:text-white text-sm"
              >
                取消
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMerge}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
              >
                複製
              </button>
              <div className="relative group">
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm">
                  發布
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-1 min-w-[120px]">
                    {['instagram', 'threads', 'x'].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePublish(p)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700 rounded"
                      >
                        {p === 'instagram' ? '📷 Instagram' : p === 'threads' ? '🧵 Threads' : '𝕏 X'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
