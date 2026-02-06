'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Task } from '@/lib/types';
import { detectPriority, getPriorityLabel, getStatusLabel } from '@/lib/priority';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tasks
  useEffect(() => {
    try {
      const saved = localStorage.getItem('openclaw-tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTasks(parsed.map((t: Task) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        })));
      }
    } catch (e) {
      console.error('Load error:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save tasks
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('openclaw-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  // Add task - using form submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      content: text,
      priority: detectPriority(text),
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks([newTask, ...tasks]);
    setInputText('');
  };

  const cycleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;
      const order: Task['status'][] = ['todo', 'in_progress', 'done'];
      const idx = order.indexOf(t.status);
      return { ...t, status: order[(idx + 1) % 3], updatedAt: new Date() };
    }));
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    selectedTasks.delete(id);
    setSelectedTasks(new Set(selectedTasks));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedTasks);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedTasks(next);
  };

  const handleMerge = () => {
    const items = tasks.filter(t => selectedTasks.has(t.id));
    const text = items.map(t => `• ${t.content}`).join('\n');
    navigator.clipboard?.writeText(text);
    alert(`已複製 ${items.length} 項任務`);
  };

  const handlePublish = (platform: string) => {
    const items = tasks.filter(t => selectedTasks.has(t.id));
    const text = items.map(t => t.content).join('\n\n');
    alert(`發布到 ${platform}:\n\n${text}`);
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const progressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🦞</span>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>OpenClaw</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>AI 任務管理</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="card mb-8">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
            新增任務
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="輸入任務..."
              className="input flex-1"
              autoComplete="off"
            />
            <button type="submit" className="btn-primary">
              送出
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--light)' }}>
            輸入「緊急」「急」→ 高優先，「有空」「不急」→ 低優先
          </p>
        </form>

        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p style={{ color: 'var(--muted)' }}>還沒有任務</p>
          </div>
        ) : (
          <>
            <TaskSection title="待辦" tasks={todoTasks} color="#5B8BD4" onCycle={cycleStatus} onDelete={handleDelete} onSelect={toggleSelect} selected={selectedTasks} />
            <TaskSection title="進行中" tasks={progressTasks} color="#D4A84B" onCycle={cycleStatus} onDelete={handleDelete} onSelect={toggleSelect} selected={selectedTasks} />
            <TaskSection title="已完成" tasks={doneTasks} color="#5D8C61" onCycle={cycleStatus} onDelete={handleDelete} onSelect={toggleSelect} selected={selectedTasks} />
          </>
        )}
      </main>

      {/* Action Bar */}
      {selectedTasks.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span style={{ color: 'var(--text)' }}>
                已選 <b style={{ color: 'var(--primary)' }}>{selectedTasks.size}</b> 項
              </span>
              <button onClick={() => setSelectedTasks(new Set())} className="text-sm" style={{ color: 'var(--muted)' }}>
                取消
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleMerge} className="btn-secondary text-sm py-2 px-3">複製</button>
              <div className="relative group">
                <button className="btn-primary text-sm py-2 px-3">發布</button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                  <div className="card p-1 shadow-lg min-w-[120px]">
                    {['Instagram', 'Threads', 'X'].map(p => (
                      <button key={p} onClick={() => handlePublish(p)} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-background" style={{ color: 'var(--text)' }}>
                        {p}
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

// Task Section Component
function TaskSection({ title, tasks, color, onCycle, onDelete, onSelect, selected }: {
  title: string;
  tasks: Task[];
  color: string;
  onCycle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selected: Set<string>;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{title}</span>
        <span className="text-xs" style={{ color: 'var(--light)' }}>({tasks.length})</span>
      </div>
      {tasks.map(task => (
        <div
          key={task.id}
          className="card mb-2"
          style={{ borderLeft: `4px solid ${color}` }}
        >
          <div className="flex items-start gap-3">
            {task.status === 'done' && (
              <input
                type="checkbox"
                checked={selected.has(task.id)}
                onChange={() => onSelect(task.id)}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge badge-${task.priority}`}>
                  {getPriorityLabel(task.priority)}
                </span>
                <span className="text-xs" style={{ color: 'var(--light)' }}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
              <p style={{ color: task.status === 'done' ? 'var(--muted)' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                {task.content}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onCycle(task.id)} className="text-sm px-2 py-1 rounded" style={{ color: 'var(--muted)' }}>
                切換
              </button>
              <button onClick={() => onDelete(task.id)} className="text-sm px-2 py-1 rounded" style={{ color: 'var(--danger)' }}>
                刪除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
