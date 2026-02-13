'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import AgentSearch from '@/components/dashboard/AgentSearch';
import AgentPerformanceChart from '@/components/dashboard/AgentPerformanceChart';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import type { TasksData } from '@/lib/types';
import { API_BASE } from '@/lib/constants';

type ViewMode = 'agents' | 'kanban' | 'analytics';

export default function DashboardPage() {
  const { agents, metrics, loading, error } = useAgentStatus();
  const [viewMode, setViewMode] = useState<ViewMode>('agents');
  const [tasks, setTasks] = useState<TasksData>({ todo: [], in_progress: [], done: [] });
  const [tasksLoading, setTasksLoading] = useState(false);

  // 獲取任務數據
  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const res = await fetch(`${API_BASE}/data/tasks.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'kanban') {
      fetchTasks();
      const interval = setInterval(fetchTasks, 5000);
      return () => clearInterval(interval);
    }
  }, [viewMode, fetchTasks]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-danger mb-2">⚠️ Failed to load</p>
          <p className="text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-text">
      {/* 頂部導航 */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text mb-1">🌊 OpenClaw Dashboard</h1>
              <p className="text-sm text-muted">Agent Teams & Task Management</p>
            </div>

            {/* 視圖切換 */}
            <div className="flex gap-2 rounded-lg bg-background border border-border p-1">
              <button
                onClick={() => setViewMode('agents')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'agents'
                    ? 'bg-primary text-background shadow-sm'
                    : 'text-muted hover:text-text hover:bg-surface-darker'
                }`}
              >
                🤖 Agents
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-primary text-background shadow-sm'
                    : 'text-muted hover:text-text hover:bg-surface-darker'
                }`}
              >
                📋 Tasks
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === 'analytics'
                    ? 'bg-primary text-background shadow-sm'
                    : 'text-muted hover:text-text hover:bg-surface-darker'
                }`}
              >
                📊 Analytics
              </button>
            </div>
          </div>

          {/* 系統指標 */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-3">
              <p className="text-xs text-muted/70 mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-primary">{metrics.totalTasks}</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-3">
              <p className="text-xs text-muted/70 mb-1">Active</p>
              <p className="text-2xl font-bold text-amber-400">{metrics.activeTasks}</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-3">
              <p className="text-xs text-muted/70 mb-1">System Load</p>
              <p className="text-2xl font-bold text-emerald-400">{(metrics.systemLoad * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-3">
              <p className="text-xs text-muted/70 mb-1">Avg Response</p>
              <p className="text-2xl font-bold text-blue-400">{metrics.avgResponseTime}ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* 主內容區域 */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {viewMode === 'agents' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text">Agent Status</h2>
              <span className="text-sm text-muted">{agents.length} agents online</span>
            </div>
            <AgentSearch agents={agents} />
          </>
        )}

        {viewMode === 'kanban' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text">Task Management</h2>
              <span className="text-sm text-muted">
                {(tasks.todo?.length || 0) + (tasks.in_progress?.length || 0) + (tasks.done?.length || 0)} total tasks
              </span>
            </div>

            {tasksLoading && !tasks.todo ? (
              <div className="text-center py-12">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2"></div>
                <p className="text-sm text-muted">Loading tasks...</p>
              </div>
            ) : (
              <KanbanBoard tasks={tasks} />
            )}
          </>
        )}

        {viewMode === 'analytics' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-text">Performance Analytics</h2>
              <p className="text-sm text-muted mt-1">7-day performance trends</p>
            </div>
            <div className="space-y-6">
              <AgentPerformanceChart agents={agents} />

              {/* Agent 統計表格 */}
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-text">Agent Statistics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background/50">
                      <tr className="text-left text-xs text-muted">
                        <th className="px-6 py-3">Agent</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Completed</th>
                        <th className="px-6 py-3">Failed</th>
                        <th className="px-6 py-3">Success Rate</th>
                        <th className="px-6 py-3">Avg Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {agents.map(agent => {
                        const successRate = agent.stats.completedTasks / (agent.stats.completedTasks + agent.stats.failedTasks || 1);
                        return (
                          <tr key={agent.id} className="hover:bg-background/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{agent.emoji}</span>
                                <span className="font-medium text-text text-sm">{agent.label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                agent.status === 'working' ? 'bg-amber-500/20 text-amber-300' :
                                agent.status === 'idle' ? 'bg-slate-500/20 text-slate-300' :
                                'bg-blue-500/20 text-blue-300'
                              }`}>
                                {agent.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-emerald-400 font-semibold">{agent.stats.completedTasks}</td>
                            <td className="px-6 py-4 text-sm text-red-400 font-semibold">{agent.stats.failedTasks}</td>
                            <td className="px-6 py-4 text-sm text-text">{(successRate * 100).toFixed(1)}%</td>
                            <td className="px-6 py-4 text-sm text-text">{agent.stats.averageResponseTime}ms</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
