'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');

  // Load
  useEffect(() => {
    const data = localStorage.getItem('openclaw-tasks');
    if (data) {
      try {
        setTasks(JSON.parse(data));
      } catch {}
    }
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem('openclaw-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Detect priority
  const getPriority = (text: string): Task['priority'] => {
    const t = text.toLowerCase();
    if (['緊急', '急', 'urgent', '馬上', '立刻', '重要'].some(k => t.includes(k))) return 'high';
    if (['有空', '之後', '不急', '慢慢'].some(k => t.includes(k))) return 'low';
    return 'medium';
  };

  // Add task
  const addTask = () => {
    const text = input.trim();
    if (!text) return;

    const task: Task = {
      id: Date.now().toString(),
      content: text,
      priority: getPriority(text),
      status: 'todo'
    };

    setTasks([task, ...tasks]);
    setInput('');
  };

  // Cycle status
  const cycle = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t;
      const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' } as const;
      return { ...t, status: next[t.status] };
    }));
  };

  // Delete
  const del = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  // Labels
  const priorityLabel = { high: '高', medium: '中', low: '低' };
  const statusLabel = { todo: '待辦', in_progress: '進行', done: '完成' };
  const statusColor = { todo: '#5B8BD4', in_progress: '#D4A84B', done: '#5D8C61' };
  const priorityColor = { high: '#C75D5D', medium: '#D4A84B', low: '#5D8C61' };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F7', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E4DF', padding: '16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🦞</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#2D2D2D' }}>OpenClaw</div>
            <div style={{ fontSize: 12, color: '#6B6B6B' }}>AI 任務管理</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        {/* Input */}
        <div style={{ background: '#fff', border: '1px solid #E8E4DF', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 8 }}>新增任務</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
              placeholder="輸入任務..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #E8E4DF',
                borderRadius: 8,
                fontSize: 15,
                outline: 'none'
              }}
            />
            <button
              onClick={addTask}
              style={{
                padding: '12px 20px',
                background: '#DA7756',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              送出
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#9B9B9B', marginTop: 8 }}>
            「緊急」「急」→ 高優先，「有空」「不急」→ 低優先
          </div>
        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B6B6B' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div>還沒有任務</div>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              style={{
                background: '#fff',
                border: '1px solid #E8E4DF',
                borderLeft: `4px solid ${statusColor[task.status]}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      background: `${priorityColor[task.priority]}20`,
                      color: priorityColor[task.priority],
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {priorityLabel[task.priority]}
                    </span>
                    <span style={{ fontSize: 12, color: '#9B9B9B' }}>
                      {statusLabel[task.status]}
                    </span>
                  </div>
                  <div style={{
                    color: task.status === 'done' ? '#9B9B9B' : '#2D2D2D',
                    textDecoration: task.status === 'done' ? 'line-through' : 'none'
                  }}>
                    {task.content}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => cycle(task.id)}
                    style={{
                      padding: '6px 10px',
                      background: 'transparent',
                      border: 'none',
                      color: '#6B6B6B',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    切換
                  </button>
                  <button
                    onClick={() => del(task.id)}
                    style={{
                      padding: '6px 10px',
                      background: 'transparent',
                      border: 'none',
                      color: '#C75D5D',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
