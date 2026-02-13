'use client';

import { useState } from 'react';
import { AGENTS, PRIORITY_CONFIG } from '@/lib/constants';
import { detectPriority } from '@/lib/priority';

interface TaskCreateModalProps {
  onSubmit: (data: {
    task: string;
    agentId: string;
    priority: 'high' | 'medium' | 'low';
  }) => Promise<void>;
  onClose: () => void;
  preselectedAgent?: string;
}

export default function TaskCreateModal({
  onSubmit,
  onClose,
  preselectedAgent
}: TaskCreateModalProps) {
  const [task, setTask] = useState('');
  const [agentId, setAgentId] = useState(preselectedAgent || 'auto');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | 'auto'>('auto');
  const [loading, setLoading] = useState(false);

  // Auto-detect priority when task changes
  const detectedPriority = priority === 'auto' ? detectPriority(task) : priority;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        task: task.trim(),
        agentId,
        priority: detectedPriority,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  const agentsList = [
    { id: 'auto', label: 'Auto Assign', emoji: '🤖' },
    ...Object.entries(AGENTS).map(([id, config]) => ({
      id,
      label: config.label,
      emoji: config.emoji,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-t-2xl lg:rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-text mb-4">➕ 新增任務</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              任務描述 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="輸入任務描述..."
              rows={3}
              autoFocus
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              分配給 Agent
            </label>
            <div className="grid grid-cols-4 gap-2">
              {agentsList.map(agent => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setAgentId(agent.id)}
                  disabled={loading}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                    agentId === agent.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-surface'
                  } disabled:opacity-50`}
                >
                  <span className="text-2xl">{agent.emoji}</span>
                  <span className="text-xs font-medium text-text">{agent.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              優先級
              {priority === 'auto' && task.trim() && (
                <span className="ml-2 text-xs text-muted">
                  (自動檢測: {PRIORITY_CONFIG[detectedPriority].label})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority('auto')}
                disabled={loading}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  priority === 'auto'
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                    : 'border-border bg-background text-text hover:border-primary/50'
                } disabled:opacity-50`}
              >
                🤖 自動
              </button>
              {(['low', 'medium', 'high'] as const).map(p => {
                const config = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    disabled={loading}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      priority === p
                        ? `${config.border} ${config.bg} ${config.text} ring-2 ring-offset-0`
                        : `border-border bg-background text-text hover:${config.border}`
                    } disabled:opacity-50`}
                  >
                    {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🔵'} {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !task.trim()}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送出中...' : '送出任務'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
