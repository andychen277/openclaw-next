'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { detectPriority, getPriorityLabel, getStatusLabel } from '@/lib/priority';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedTasks(new Set());

  const handleMerge = () => {
    const items = tasks.filter(t => selectedTasks.has(t.id));
    const content = items.map(t => `• ${t.content}`).join('\n');
    navigator.clipboard?.writeText(content);
    alert(`已複製 ${items.length} 項任務`);
  };

  const handlePublish = (platform: string) => {
    const items = tasks.filter(t => selectedTasks.has(t.id));
    const content = items.map(t => t.content).join('\n\n');
    const names: Record<string, string> = { instagram: 'Instagram', threads: 'Threads', x: 'X' };
    alert(`發布到 ${names[platform]}:\n\n${content}`);
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const TaskItem = ({ task }: { task: Task }) => (
    <div className={`card task-card status-${task.status} mb-3`}>
      <div className="flex items-start gap-3">
        {task.status === 'done' && (
          <input
            type="checkbox"
            checked={selectedTasks.has(task.id)}
            onChange={() => toggleSelection(task.id)}
            className="mt-1 w-4 h-4 accent-primary rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge badge-${task.priority}`}>
              {getPriorityLabel(task.priority)}
            </span>
            <span className="text-light text-xs">
              {getStatusLabel(task.status)}
            </span>
          </div>
          <p className={`text-text leading-relaxed ${task.status === 'done' ? 'line-through text-muted' : ''}`}>
            {task.content}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => cycleStatus(task.id)}
            className="text-muted hover:text-primary text-sm px-3 py-1.5 rounded-lg hover:bg-background transition-colors"
          >
            切換
          </button>
          <button
            onClick={() => handleDelete(task.id)}
            className="text-muted hover:text-danger text-sm px-3 py-1.5 rounded-lg hover:bg-background transition-colors"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );

  const TaskSection = ({ title, tasks, dotColor }: { title: string; tasks: Task[]; dotColor: string }) => {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h2 className="text-muted font-medium">{title}</h2>
          <span className="text-light text-sm">({tasks.length})</span>
        </div>
        {tasks.map(task => <TaskItem key={task.id} task={task} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦞</span>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>OpenClaw</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>AI 任務管理</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Input Section */}
        <div className="card mb-10">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>新增任務</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入任務內容，按 Enter 送出..."
              className="input flex-1"
            />
            <button
              onClick={handleAddTask}
              disabled={!inputText.trim()}
              className="btn-primary whitespace-nowrap"
            >
              送出
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--light)' }}>
            AI 自動判斷優先級：「緊急」「急」「馬上」→ 高優先，「有空」「之後」「不急」→ 低優先
          </p>
        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>還沒有任務</p>
            <p className="text-sm mt-1" style={{ color: 'var(--light)' }}>在上方輸入框新增你的第一個任務</p>
          </div>
        ) : (
          <>
            <TaskSection title="待辦" tasks={todoTasks} dotColor="bg-[#5B8BD4]" />
            <TaskSection title="進行中" tasks={inProgressTasks} dotColor="bg-[#D4A84B]" />
            <TaskSection title="已完成" tasks={doneTasks} dotColor="bg-[#5D8C61]" />
          </>
        )}
      </main>

      {/* Action Bar */}
      {selectedTasks.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 border-t p-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span style={{ color: 'var(--text)' }}>
                已選取 <strong style={{ color: 'var(--primary)' }}>{selectedTasks.size}</strong> 項
              </span>
              <button
                onClick={clearSelection}
                className="text-sm hover:underline"
                style={{ color: 'var(--muted)' }}
              >
                取消選取
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleMerge} className="btn-secondary text-sm py-2 px-4">
                複製
              </button>
              <div className="relative group">
                <button className="btn-primary text-sm py-2 px-4">
                  發布
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                  <div className="card p-2 min-w-[140px] shadow-lg">
                    {[
                      { key: 'instagram', label: '📷 Instagram' },
                      { key: 'threads', label: '🧵 Threads' },
                      { key: 'x', label: '𝕏 X' },
                    ].map(p => (
                      <button
                        key={p.key}
                        onClick={() => handlePublish(p.key)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-background transition-colors"
                        style={{ color: 'var(--text)' }}
                      >
                        {p.label}
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
