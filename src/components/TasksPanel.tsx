'use client';

import { AGENTS } from '@/lib/constants';
import type { TasksData } from '@/lib/types';

interface TasksPanelProps {
  tasks: TasksData;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  addTask: () => void;
}

export default function TasksPanel({ tasks, input, setInput, loading, addTask }: TasksPanelProps) {
  return (
    <>
      {/* Add task form */}
      <div className="card mb-5">
        <label className="mb-2 block text-sm text-muted">新增研究任務（AI 自動偵測優先級並處理）</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
            placeholder="例：研究 2026 AI Agent 趨勢"
            disabled={loading}
            className="input flex-1"
            aria-label="研究任務內容"
          />
          <button
            onClick={addTask}
            disabled={loading || !input.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? '送出中...' : '送出'}
          </button>
        </div>
      </div>

      {/* In progress */}
      {tasks.in_progress?.map(task => {
        const agent = AGENTS[task.task_type];
        return (
          <div key={task.id} className="mb-2 rounded-md border border-warning/30 bg-warning/8 p-3.5">
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">{agent?.emoji || '🌊'}</span>
              <div>
                <p className="text-sm text-text">{task.task}</p>
                <p className="text-xs text-muted">{agent?.label || 'Ocean'} 處理中...</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Todo */}
      {tasks.todo?.map(task => {
        const agent = AGENTS[task.task_type];
        return (
          <div key={task.id} className="mb-2 rounded-md border border-border bg-surface/50 p-3.5">
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">{agent?.emoji || '🌊'}</span>
              <div>
                <p className="text-sm text-text">{task.task}</p>
                <p className="text-xs text-light">等待處理</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Done (recent 8) */}
      {tasks.done?.slice(0, 8).map(task => {
        const agent = AGENTS[task.task_type];
        return (
          <div key={task.id} className="mb-1.5 rounded-md border border-success/20 bg-success/5 p-3 opacity-70">
            <div className="flex items-center gap-3">
              <span className="text-base" aria-hidden="true">{agent?.emoji || '🌊'}</span>
              <p className="text-xs text-text">{task.task}</p>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {!tasks.in_progress?.length && !tasks.todo?.length && !tasks.done?.length && (
        <div className="py-10 text-center text-muted">
          <p className="mb-2 text-4xl">📝</p>
          <p className="text-sm">還沒有任務，輸入研究主題開始吧</p>
        </div>
      )}
    </>
  );
}
